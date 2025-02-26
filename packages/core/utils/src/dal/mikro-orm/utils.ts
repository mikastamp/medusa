import { EntityMetadata, FindOptions } from "@mikro-orm/core"
import { SqlEntityManager } from "@mikro-orm/postgresql"
import { isString } from "../../common/is-string"
import { buildQuery } from "../../modules-sdk/build-query"

function detectCircularDependency(
  manager: SqlEntityManager,
  entityMetadata: EntityMetadata,
  visited: Set<string> = new Set(),
  shouldStop: boolean = false
) {
  if (shouldStop) {
    return
  }

  visited.add(entityMetadata.className)

  const relations = entityMetadata.relations

  const relationsToCascade = relations.filter((relation) =>
    relation.cascade?.includes("soft-remove" as any)
  )

  for (const relation of relationsToCascade) {
    const branchVisited = new Set(Array.from(visited))

    const relationEntity =
      typeof relation.entity === "function"
        ? relation.entity()
        : relation.entity
    const isSelfCircularDependency = isString(relationEntity)
      ? entityMetadata.className === relationEntity
      : entityMetadata.class === relationEntity

    if (!isSelfCircularDependency && branchVisited.has(relation.name)) {
      const dependencies = Array.from(visited)
      dependencies.push(entityMetadata.className)
      const circularDependencyStr = dependencies.join(" -> ")

      throw new Error(
        `Unable to soft delete the ${relation.name}. Circular dependency detected: ${circularDependencyStr}`
      )
    }
    branchVisited.add(relation.name)

    const relationEntityMetadata = manager
      .getDriver()
      .getMetadata()
      .get(relation.type)

    detectCircularDependency(
      manager,
      relationEntityMetadata,
      branchVisited,
      isSelfCircularDependency
    )
  }
}

async function performCascadingSoftDeletion<T>(
  manager: SqlEntityManager,
  entity: T & { id: string; deleted_at?: string | Date | null },
  value: Date | null
) {
  if (!("deleted_at" in entity)) return

  entity.deleted_at = value

  const entityName = entity.constructor.name
  const entityMetadata = manager.getDriver().getMetadata().get(entityName)
  const relations = entityMetadata.relations

  const relationsToCascade = relations.filter((relation) =>
    relation.cascade?.includes("soft-remove" as any)
  )

  // If there are no relations to cascade, just persist the entity and return
  if (!relationsToCascade.length) {
    manager.persist(entity)
    return
  }

  // Fetch the entity with all cascading relations in a single query
  const relationNames = relationsToCascade.map((r) => r.name)

  const query = buildQuery(
    {
      id: entity.id,
    },
    {
      relations: relationNames,
      withDeleted: true,
    }
  )

  const entityWithRelations = await manager.findOne(
    entityName,
    query.where,
    query.options as FindOptions<any>
  )

  if (!entityWithRelations) {
    manager.persist(entity)
    return
  }

  // Create a map to group related entities by their type
  const relatedEntitiesByType = new Map<string, any[]>()

  // Collect all related entities by type
  for (const relation of relationsToCascade) {
    const entityRelation = entityWithRelations[relation.name]

    // Skip if relation is null or undefined
    if (!entityRelation) {
      continue
    }

    const isCollection = "toArray" in entityRelation
    let relationEntities: any[] = []

    if (isCollection) {
      relationEntities = entityRelation.getItems()
    } else {
      relationEntities = [entityRelation]
    }

    if (!relationEntities.length) {
      continue
    }

    // Add to the map of entities by type
    if (!relatedEntitiesByType.has(relation.type)) {
      relatedEntitiesByType.set(relation.type, [])
    }
    relatedEntitiesByType.get(relation.type)!.push(...relationEntities)
  }

  // Process each type of related entity in batch
  for (const [, entities] of relatedEntitiesByType.entries()) {
    if (entities.length === 0) continue

    // Process cascading relations for these entities
    await mikroOrmUpdateDeletedAtRecursively(manager, entities, value)
  }

  manager.persist(entity)
}

export const mikroOrmUpdateDeletedAtRecursively = async <
  T extends object = any
>(
  manager: SqlEntityManager,
  entities: (T & { id: string; deleted_at?: string | Date | null })[],
  value: Date | null
) => {
  if (!entities.length) return

  const entityMetadata = manager
    .getDriver()
    .getMetadata()
    .get(entities[0].constructor.name)
  detectCircularDependency(manager, entityMetadata)

  // Process each entity type
  for (const entity of entities) {
    await performCascadingSoftDeletion(manager, entity, value)
  }
}

import { BaseRelationship } from "./base"
import { RelationNullableModifier } from "./nullable"

export class BelongsTo<T> extends BaseRelationship<T> {
  type = "belongsTo" as const
  declare $foreignKey: true

  static isBelongsTo<T>(relationship: any): relationship is BelongsTo<T> {
    return relationship?.type === "belongsTo"
  }

  /**
   * Apply nullable modifier on the schema
   */
  nullable() {
    return new RelationNullableModifier<T, BelongsTo<T>, true>(this)
  }
}

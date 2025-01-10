import { faker } from "@faker-js/faker"
import {
  DeclarationReflection,
  ReflectionFlags,
  SignatureReflection,
  SomeType,
} from "typedoc"

export function isReflectionTypeOptional(reflectionType: SomeType): boolean {
  return "flags" in reflectionType
    ? (reflectionType.flags as ReflectionFlags).isOptional
    : false
}

function getReflectionTypeFakeValue({
  reflectionType,
  name,
}: {
  reflectionType: SomeType
  name: string
}): unknown {
  if (reflectionType.type === "literal") {
    return getFakeStrValue({
      name,
      type: typeof reflectionType.value,
    })
  }

  if (reflectionType.type === "array") {
    return new Array(
      getReflectionTypeFakeValue({
        reflectionType: reflectionType.elementType,
        name,
      })
    )
  }

  if (
    reflectionType.type === "reference" &&
    reflectionType.reflection instanceof DeclarationReflection
  ) {
    const obj: Record<string, unknown> = {}
    reflectionType.reflection.children?.forEach((child) => {
      if (!child.type || isReflectionTypeOptional(child.type)) {
        return
      }

      obj[child.name] = getReflectionTypeFakeValue({
        reflectionType: child.type,
        name: child.name,
      })
    })

    return obj
  }

  if (reflectionType.type === "intersection") {
    const obj: Record<string, unknown> = {}

    reflectionType.types?.forEach((type) => {
      const value = getReflectionTypeFakeValue({
        reflectionType: type,
        name,
      })

      if (typeof value === "object") {
        Object.assign(obj, value)
      } else {
        obj[name] = value
      }
    })

    return obj
  }

  if (reflectionType.type === "union" && reflectionType.types.length) {
    return getReflectionTypeFakeValue({
      reflectionType: reflectionType.types[0],
      name,
    })
  }

  // TODO: handle more types
  return "{value}"
}

export function getFakeJsObjectValue(reflection: SignatureReflection): string {
  const obj: Record<string, unknown> = {}

  reflection.parameters?.forEach((param) => {
    if (!param.type || isReflectionTypeOptional(param.type)) {
      return
    }

    obj[param.name] = getReflectionTypeFakeValue({
      reflectionType: param.type,
      name: param.name,
    })
  })

  return JSON.stringify(obj, null, 2)
}

export function getFakeStrValue({
  name,
  type,
  format,
}: {
  /**
   * The name of the property. It can help when generating the fake value.
   * For example, if the name is `id`, the fake value generated will be of the format `id_<randomstring>`.
   */
  name: string
  /**
   * The type of the property, such as `string` or `boolean`.
   */
  type: string
  /**
   * The format of the property, useful for OAS. For example, `date-time`.
   */
  format?: string
}): unknown {
  let value: unknown
  if (!format && name.endsWith("_at")) {
    format = "date-time"
  }

  switch (true) {
    case type === "string" && format === "date-time":
      value = faker.date.future().toISOString()
      break
    case type === "boolean":
      value = faker.datatype.boolean()
      break
    case type === "integer" || type === "number":
      value = faker.number.int()
      break
    case type === "array":
      value = []
      break
    case type === "string":
      value = faker.helpers
        .mustache(`{{${name}}}`, {
          id: () =>
            `id_${faker.string.alphanumeric({
              length: { min: 10, max: 20 },
            })}`,
          name: () => faker.person.firstName(),
          email: () => faker.internet.email(),
          password: () => faker.internet.password({ length: 8 }),
          currency: () => faker.finance.currencyCode(),
        })
        .replace(`{{${name}}}`, "{value}")
  }

  return value !== undefined ? value : "{value}"
}

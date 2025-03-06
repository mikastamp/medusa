import { MedusaContextType } from "./context-parameter"

// TODO: POC
const CacheDecorator = {
  cacheServiceInstance: null,
  decorate: function <T extends (...args: any[]) => Promise<any>>(options?: {
    getKey?: (...args: any[]) => string
    ttl?: number
  }) {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value
      descriptor.value = async function (
        ...args: any[]
      ): Promise<ReturnType<Awaited<T>>> {
        const cacheInstance = CacheDecorator.cacheServiceInstance as any

        if (!cacheInstance) {
          console.error("Cache service not found")
          return await originalMethod.apply(this, args)
        }

        const potentialContext = args[args.length - 1]
        const argsToStringify = [...args]

        if (potentialContext?.__type === MedusaContextType) {
          // Skip cache withing transaction
          if (!!potentialContext.transactionManager) {
            return await originalMethod.apply(this, args)
          }

          argsToStringify.pop()
        }

        const key =
          options?.getKey?.(argsToStringify) ?? JSON.stringify(argsToStringify)
        const cachedResult = await cacheInstance.get(key)

        if (cachedResult) {
          console.log(`Cache hit for ${this.constructor.name}.${propertyKey}`)
          return cachedResult
        }

        const result = await originalMethod.apply(this, args)

        cacheInstance.set(key, result, options?.ttl)
        console.log(
          `Cache set for ${this.constructor.name}.${propertyKey} with key ${key}`
        )
        return result
      }
    }
  },
}

global.CacheDecorator ??= CacheDecorator
const cacheDecoratorToExport = global.CacheDecorator
export { cacheDecoratorToExport as CacheDecorator }


key | value
input_1 | data
tag_1 | input_1
tag_2 | input_1
input_2 | data
tag_3 | input_2
tag_4 | input_2, input_1


create something
tag_4 -> input_1, input_2
invalidate input_1, input_2








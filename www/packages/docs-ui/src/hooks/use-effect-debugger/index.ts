"use client"

import { useEffect } from "react"
import { usePrevious } from "../.."

export const useEffectDebugger = (
  effectHook: () => void,
  dependencies: any[],
  dependencyNames: string[] = []
) => {
  const previousDeps = usePrevious(dependencies) || []

  const changedDeps = dependencies.reduce((accum, dependency, index) => {
    if (dependency !== previousDeps[index]) {
      const keyName = dependencyNames[index] || index
      return {
        ...accum,
        [keyName]: {
          before: previousDeps[index],
          after: dependency,
        },
      }
    }

    return accum
  }, {})

  if (Object.keys(changedDeps).length) {
    // eslint-disable-next-line no-console
    console.debug("[use-effect-debugger] ", changedDeps)
  }

  useEffect(effectHook, dependencies)
}

import { DeclarationReflection, ParameterReflection } from "typedoc"
import { getFakeJsObjectValue } from "utils/src"

export default class Examples {
  generateHookExample({
    hookName,
    workflowName,
    parameter,
  }: {
    hookName: string
    workflowName: string
    parameter: ParameterReflection
  }): string {
    let str = `import { ${workflowName} } from "@medusajs/medusa/core-flows"\n\n`

    str += `${workflowName}.hooks.${hookName}(\n\t(async ({`

    if (
      parameter.type?.type === "reference" &&
      parameter.type.reflection instanceof DeclarationReflection &&
      parameter.type.reflection.children
    ) {
      parameter.type.reflection.children.forEach((childParam, index) => {
        if (index > 0) {
          str += `,`
        }

        str += ` ${childParam.name}`
      })
    }

    str += ` }, { container }) => {\n\t\t//TODO\n\t})\n)`

    return str
  }

  generateWorkflowExample(workflowReflection: DeclarationReflection) {
    if (!workflowReflection.signatures?.length) {
      return
    }
    const exampleTags = workflowReflection.comment?.blockTags.filter(
      (tag) => tag.tag === "@example"
    )

    if (exampleTags?.length) {
      return
    }

    // generate example
    return `const { result } = await ${
      workflowReflection.name
    }(container)\n\t.run(\n\t\t{\n\t\t\tinput: ${getFakeJsObjectValue(
      workflowReflection.signatures[0]
    )}\n\t\t})`
  }
}

import { SignatureReflection } from "typedoc"

export default function () {
  Handlebars.registerHelper(
    "workflowExamples",
    function (this: SignatureReflection): string {
      const workflowReflection = this.parent
      const exampleStr: string[] = []

      const exampleTags = workflowReflection.comment?.blockTags.filter(
        (tag) => tag.tag === "@example"
      )

      if (!exampleTags?.length) {
        return ""
      }

      exampleTags.forEach((exampleTag) => {
        exampleTag.content.forEach((part) => {
          if (part.kind !== "code") {
            exampleStr.push(part.text)
            return
          }

          exampleStr.push(
            getExecutionCodeTabs({
              exampleCode: part.text,
              workflowName: workflowReflection.name,
            })
          )
        })
      })

      return exampleStr.join("\n")
    }
  )
}

function getExecutionCodeTabs({
  exampleCode,
  workflowName,
}: {
  exampleCode: string
  workflowName: string
}): string {
  return `<CodeTabs group="workflow-exection">
    <CodeTab label="Another Workflow" value="another-workflow">
    
\`\`\`ts
import { createWorkflow } from "@medusajs/framework/workflows-sdk"
import { ${workflowName} } from "@medusajs/medusa/core-flows"

const myWorkflow = createWorkflow(
  "my-workflow",
  () => {
    ${exampleCode
      .replace(`await `, "")
      .replace(`(container)\n\t.run(`, ".runAsStep(")}
  }
)
\`\`\`

    </CodeTab>
    <CodeTab label="API Route" value="api-route">
    
\`\`\`ts
import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ${workflowName} } from "@medusajs/medusa/core-flows"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
    ${exampleCode.replace("container", "req.scope")}

    res.send(result)
  }
)
\`\`\`

    </CodeTab>
    <CodeTab label="Subscriber" value="subscriber">
    
\`\`\`ts
import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework"
import { ${workflowName} } from "@medusajs/medusa/core-flows"

export default async function handleOrderPlaced({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  ${exampleCode}

  console.log(result)
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
\`\`\`

    </CodeTab>
    <CodeTab label="Scheduled Job" value="scheduled-job">
    
\`\`\`ts
import { MedusaContainer } from "@medusajs/framework/types"
import { ${workflowName} } from "@medusajs/medusa/core-flows"

export default async function myCustomJob(
  container: MedusaContainer
) {
  ${exampleCode}

  console.log(result.message)
}

export const config = {
  name: "run-once-a-day",
  schedule: "0 0 * * *",
};
\`\`\`

    </CodeTab>
  </CodeTabs>`
}

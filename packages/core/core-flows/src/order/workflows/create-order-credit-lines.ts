import { CreateOrderCreditLineDTO, OrderDTO } from "@medusajs/framework/types"
import { MathBN, MedusaError, Modules } from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createHook,
  createStep,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "../../common"
import { createEntitiesStep } from "../../common/steps/create-entities"

export const validateOrderCreditLinesStep = createStep(
  "validate-order-credit-lines",
  async function ({
    order,
    creditLines,
  }: {
    order: OrderDTO
    creditLines: Omit<CreateOrderCreditLineDTO, "order_id">[]
  }) {
    const amountPending = MathBN.convert(
      order.summary?.raw_pending_difference!
    ).multipliedBy(-1)
    console.log("amountPending - ", amountPending.toNumber())
    const creditLinesAmount = creditLines.reduce((acc, creditLine) => {
      return MathBN.add(acc, MathBN.convert(creditLine.amount))
    }, MathBN.convert(0))
    console.log("creditLinesAmount - ", creditLinesAmount.toNumber())
    if (MathBN.lte(amountPending, 0)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Order does not have an outstanding balance to refund`
      )
    }

    if (MathBN.gt(creditLinesAmount, amountPending)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Cannot create more credit lines with amount more than the pending difference - ${amountPending}`
      )
    }
  }
)

export const createOrderCreditLinesWorkflowId = "create-order-credit-lines"
export const createOrderCreditLinesWorkflow = createWorkflow(
  createOrderCreditLinesWorkflowId,
  (
    input: WorkflowData<{
      id: string
      credit_lines: Omit<CreateOrderCreditLineDTO, "order_id">[]
    }>
  ) => {
    const orderQuery = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "summary.raw_pending_difference",
        "summary.pending_difference",
      ],
      filters: { id: input.id },
      options: { throwIfKeyNotFound: true },
    })

    const order = transform({ orderQuery }, ({ orderQuery }) => {
      return orderQuery.data[0]
    })

    validateOrderCreditLinesStep({ order, creditLines: input.credit_lines })

    const creditLinesInput = transform({ input }, ({ input }) => {
      return input.credit_lines.map((creditLine) => ({
        ...creditLine,
        order_id: input.id,
      }))
    })

    const creditLines = createEntitiesStep({
      moduleRegistrationName: Modules.ORDER,
      invokeMethod: "createOrderCreditLines",
      compensateMethod: "deleteOrderCreditLines",
      data: creditLinesInput,
    })

    const creditLinesCreated = createHook("creditLinesCreated", {
      creditLines,
    })

    return new WorkflowResponse(creditLines, {
      hooks: [creditLinesCreated],
    })
  }
)

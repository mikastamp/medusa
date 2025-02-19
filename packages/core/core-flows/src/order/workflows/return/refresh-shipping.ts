import { OrderChangeDTO, ReturnDTO } from "@medusajs/framework/types"
import { ChangeActionType, OrderChangeStatus } from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"

import { maybeRefreshShippingMethodsWorkflow } from "../utils/maybe-refresh-shipping-methods"
import { useRemoteQueryStep } from "../../../common"

/**
 * The data to validate that items can be added to a return.
 */
export type RequestItemReturnValidationStepInput = {
  /**
   * The order change's ID.
   */
  order_change_id: string
  /**
   * The return's details.
   */
  return_id: string
}

export const refreshReturnShippingWorkflowId = "refresh-return-shipping"
/**
 * This workflow refreshes the shipping method for a return in case the shipping option is calculated.
 *
 * @summary
 *
 * Refresh return shipping.
 */
export const refreshReturnShippingWorkflow = createWorkflow(
  refreshReturnShippingWorkflowId,
  function (
    input: WorkflowData<RequestItemReturnValidationStepInput>
  ): WorkflowResponse<void> {
    const orderReturn: ReturnDTO = useRemoteQueryStep({
      entry_point: "return",
      fields: ["id", "status", "order_id", "canceled_at", "items.*"],
      variables: { id: input.return_id },
      list: false,
      throw_if_key_not_found: true,
    })

    const orderChange: OrderChangeDTO = useRemoteQueryStep({
      entry_point: "order_change",
      fields: ["id", "status", "order_id", "return_id", "actions.*"],
      variables: {
        filters: {
          order_id: orderReturn.order_id,
          return_id: orderReturn.id,
          status: [OrderChangeStatus.PENDING, OrderChangeStatus.REQUESTED],
        },
      },
      list: false,
    }).config({ name: "order-change-query" })

    const refreshArgs = transform(
      { input, orderChange, orderReturn },
      ({ input, orderChange, orderReturn }) => {
        const shippingAction = orderChange.actions.find(
          (action) => action.action === ChangeActionType.SHIPPING_ADD
        )

        const items = orderChange.actions
          .filter((action) => action.action === ChangeActionType.RETURN_ITEM)
          .map((a) => ({
            id: a.details?.reference_id,
            quantity: a.details?.quantity,
          }))

        if (shippingAction) {
          return {
            shipping_method_id: shippingAction.reference_id,
            order_id: orderChange.order_id,
            action_id: shippingAction.id,
            context: {
              orderReturn: { items } as ReturnDTO,
            },
          }
        }

        return null
      }
    )

    when({ refreshArgs }, ({ refreshArgs }) => refreshArgs !== null).then(() =>
      maybeRefreshShippingMethodsWorkflow.runAsStep({
        input: refreshArgs,
      })
    )

    return new WorkflowResponse(void 0)
  }
)

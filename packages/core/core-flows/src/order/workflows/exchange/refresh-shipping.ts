import { OrderChangeDTO } from "@medusajs/framework/types"
import { ChangeActionType, OrderChangeStatus } from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"

import { maybeRefreshShippingMethodsWorkflow } from "../../utils/maybe-refresh-shipping-methods"
import { useRemoteQueryStep } from "../../../common"

/**
 * The data to refresh the shipping methods for an exchange.
 */
export type RefreshExchangeShippingWorkflowInput = {
  /**
   * The order change's ID.
   */
  order_change_id: string
  /**
   * The exchange's details.
   */
  exchange_id: string
  /**
   * The order's ID.
   */
  order_id: string
}

export const refreshExchangeShippingWorkflowId = "refresh-exchange-shipping"
/**
 * This workflow refreshes the shipping methods for an exchange in case the shipping option is calculated.
 * It refreshes both inbound and outbound shipping methods.
 *
 * @summary
 *
 * Refresh exchange shipping.
 */
export const refreshExchangeShippingWorkflow = createWorkflow(
  refreshExchangeShippingWorkflowId,
  function (
    input: WorkflowData<RefreshExchangeShippingWorkflowInput>
  ): WorkflowResponse<void> {
    const orderChange: OrderChangeDTO = useRemoteQueryStep({
      entry_point: "order_change",
      fields: [
        "id",
        "status",
        "order_id",
        "exchange_id",
        "return_id",
        "actions.*",
      ],
      variables: {
        filters: {
          order_id: input.order_id,
          exchange_id: input.exchange_id,
          status: [OrderChangeStatus.PENDING, OrderChangeStatus.REQUESTED],
        },
      },
      list: false,
    }).config({ name: "order-change-query" })

    const refreshArgs = transform(
      { input, orderChange },
      ({ input, orderChange }) => {
        const result: Record<string, any> = []

        const inboundShippingAction = orderChange.actions.find(
          (action) =>
            action.action === ChangeActionType.SHIPPING_ADD &&
            !!action.return_id
        )

        const outboundShippingAction = orderChange.actions.find(
          (action) =>
            action.action === ChangeActionType.SHIPPING_ADD && !action.return_id
        )

        if (inboundShippingAction) {
          const items = orderChange.actions
            .filter((action) => action.action === ChangeActionType.RETURN_ITEM)
            .map((a) => ({
              id: a.details?.reference_id as string,
              quantity: a.details?.quantity as number,
            }))

          result.push({
            shipping_method_id: inboundShippingAction.reference_id,
            order_id: orderChange.order_id,
            action_id: inboundShippingAction.id,
            context: {
              return_id: inboundShippingAction.return_id,
              return_items: items,
            },
          })
        } else {
          result.push(null)
        }

        if (outboundShippingAction) {
          const items = orderChange.actions
            .filter((action) => action.action === ChangeActionType.ITEM_ADD)
            .map((a) => ({
              id: a.details?.reference_id as string,
              quantity: a.details?.quantity as number,
            }))

          result.push({
            shipping_method_id: outboundShippingAction.reference_id,
            order_id: orderChange.order_id,
            action_id: outboundShippingAction.id,
            context: {
              exchange_id: outboundShippingAction.exchange_id,
              exchange_items: items,
            },
          })
        } else {
          result.push(null)
        }

        return result
      }
    )

    // Refresh inbound shipping method
    when({ refreshArgs }, ({ refreshArgs }) => refreshArgs[0] !== null).then(
      () =>
        maybeRefreshShippingMethodsWorkflow
          .runAsStep({
            input: refreshArgs[0],
          })
          .config({ name: "refresh-inbound-shipping-method" })
    )

    // Refresh outbound shipping method
    when({ refreshArgs }, ({ refreshArgs }) => refreshArgs[1] !== null).then(
      () =>
        maybeRefreshShippingMethodsWorkflow
          .runAsStep({
            input: refreshArgs[1],
          })
          .config({ name: "refresh-outbound-shipping-method" })
    )

    return new WorkflowResponse(void 0)
  }
)

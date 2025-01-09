import {
  AdditionalData,
  BigNumberInput,
  FulfillmentDTO,
  OrderDTO,
  OrderWorkflow,
} from "@medusajs/framework/types"
import {
  MedusaError,
  Modules,
  OrderWorkflowEvents,
} from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createHook,
  createStep,
  createWorkflow,
  parallelize,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep, useRemoteQueryStep } from "../../common"
import { cancelFulfillmentWorkflow } from "../../fulfillment"
import { adjustInventoryLevelsStep } from "../../inventory"
import { cancelOrderFulfillmentStep } from "../steps/cancel-fulfillment"
import {
  throwIfItemsDoesNotExistsInOrder,
  throwIfOrderIsCancelled,
} from "../utils/order-validation"

/**
 * This step validates that an order fulfillment can be canceled.
 */
export const cancelOrderFulfillmentValidateOrder = createStep(
  "cancel-fulfillment-validate-order",
  ({
    order,
    input,
  }: {
    order: OrderDTO & { fulfillments: FulfillmentDTO[] }
    input: OrderWorkflow.CancelOrderFulfillmentWorkflowInput
  }) => {
    throwIfOrderIsCancelled({ order })

    const fulfillment = order.fulfillments.find(
      (f) => f.id === input.fulfillment_id
    )
    if (!fulfillment) {
      throw new Error(
        `Fulfillment with id ${input.fulfillment_id} not found in the order`
      )
    }

    if (fulfillment.shipped_at) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `The fulfillment has already been shipped. Shipped fulfillments cannot be canceled`
      )
    }

    throwIfItemsDoesNotExistsInOrder({
      order,
      inputItems: fulfillment.items.map((i) => ({
        id: i.line_item_id as string,
        quantity: i.quantity,
      })),
    })
  }
)

function prepareCancelOrderFulfillmentData({
  order,
  fulfillment,
}: {
  order: OrderDTO
  fulfillment: FulfillmentDTO
}) {
  return {
    order_id: order.id,
    reference: Modules.FULFILLMENT,
    reference_id: fulfillment.id,
    items: fulfillment.items!.map((i) => {
      return {
        id: i.line_item_id as string,
        quantity: i.quantity,
      }
    }),
  }
}

function prepareInventoryUpdate({
  fulfillment,
}: {
  order: OrderDTO
  fulfillment: FulfillmentDTO
}) {
  const inventoryAdjustment: {
    inventory_item_id: string
    location_id: string
    adjustment: BigNumberInput
  }[] = []
  for (const item of fulfillment.items) {
    // if this is `null` this means that item is from variant that has `manage_inventory` false
    if (!item.inventory_item_id) {
      continue
    }

    inventoryAdjustment.push({
      inventory_item_id: item.inventory_item_id as string,
      location_id: fulfillment.location_id,
      adjustment: item.quantity,
    })
  }

  return {
    inventoryAdjustment,
  }
}

export const cancelOrderFulfillmentWorkflowId = "cancel-order-fulfillment"
/**
 * This workflow cancels an order's fulfillment.
 */
export const cancelOrderFulfillmentWorkflow = createWorkflow(
  cancelOrderFulfillmentWorkflowId,
  (
    input: WorkflowData<
      OrderWorkflow.CancelOrderFulfillmentWorkflowInput & AdditionalData
    >
  ) => {
    const order: OrderDTO & { fulfillments: FulfillmentDTO[] } =
      useRemoteQueryStep({
        entry_point: "orders",
        fields: [
          "id",
          "status",
          "items.*",
          "fulfillments.*",
          "fulfillments.items.*",
        ],
        variables: { id: input.order_id },
        list: false,
        throw_if_key_not_found: true,
      })

    cancelOrderFulfillmentValidateOrder({ order, input })

    const fulfillment = transform({ input, order }, ({ input, order }) => {
      return order.fulfillments.find((f) => f.id === input.fulfillment_id)!
    })

    const cancelOrderFulfillmentData = transform(
      { order, fulfillment },
      prepareCancelOrderFulfillmentData
    )

    const { inventoryAdjustment } = transform(
      { order, fulfillment },
      prepareInventoryUpdate
    )

    const eventData = transform({ order, fulfillment }, (data) => {
      return {
        order_id: data.order.id,
        fulfillment_id: data.fulfillment.id,
      }
    })

    parallelize(
      cancelOrderFulfillmentStep(cancelOrderFulfillmentData),
      adjustInventoryLevelsStep(inventoryAdjustment),
      emitEventStep({
        eventName: OrderWorkflowEvents.FULFILLMENT_CANCELED,
        data: eventData,
      })
    )

    // last step because there is no compensation for this step
    cancelFulfillmentWorkflow.runAsStep({
      input: {
        id: input.fulfillment_id,
      },
    })

    const orderFulfillmentCanceled = createHook("orderFulfillmentCanceled", {
      fulfillment,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, {
      hooks: [orderFulfillmentCanceled],
    })
  }
)

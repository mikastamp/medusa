/**
 * @schema AdminReturn
 * type: object
 * description: The return's details.
 * x-schemaName: AdminReturn
 * required:
 *   - items
 *   - id
 *   - order_id
 *   - order_version
 *   - display_id
 *   - received_at
 *   - created_at
 *   - canceled_at
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The return's ID.
 *   status:
 *     type: string
 *     description: The return's status.
 *     enum:
 *       - canceled
 *       - requested
 *       - received
 *       - partially_received
 *   refund_amount:
 *     type: number
 *     title: refund_amount
 *     description: The amount refunded by this return.
 *   order_id:
 *     type: string
 *     title: order_id
 *     description: The ID of the associated order.
 *   items:
 *     type: array
 *     description: The return's items.
 *     items:
 *       $ref: "#/components/schemas/AdminReturnItem"
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the return was created.
 *   canceled_at:
 *     type: string
 *     title: canceled_at
 *     description: The date the return was canceled.
 *     format: date-time
 *   exchange_id:
 *     type: string
 *     title: exchange_id
 *     description: The return's exchange id.
 *   location_id:
 *     type: string
 *     title: location_id
 *     description: The return's location id.
 *   claim_id:
 *     type: string
 *     title: claim_id
 *     description: The return's claim id.
 *   order_version:
 *     type: number
 *     title: order_version
 *     description: The return's order version.
 *   display_id:
 *     type: number
 *     title: display_id
 *     description: The return's display id.
 *   no_notification:
 *     type: boolean
 *     title: no_notification
 *     description: Whether the customer should receive notifications about the return's updates.
 *   received_at:
 *     type: string
 *     title: received_at
 *     description: The date the return was received.
 * 
*/


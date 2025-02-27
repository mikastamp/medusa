import { zodResolver } from "@hookform/resolvers/zod"
import { AdminOrder } from "@medusajs/types"
import { Button, CurrencyInput, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"
import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateOrderCreditLine } from "../../../../../hooks/api"
import { getCurrencySymbol } from "../../../../../lib/data/currencies"
import { formatCurrency } from "../../../../../lib/format-currency"

const CreateCreditLineSchema = zod.object({
  amount: zod.number(),
  reference: zod.string(),
  reference_id: zod.string(),
  note: zod.string().optional(),
})

export const CreateCreditLineForm = ({ order }: { order: AdminOrder }) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const form = useForm<zod.infer<typeof CreateCreditLineSchema>>({
    defaultValues: {
      amount: 0,
      reference: "order",
      reference_id: order.id,
    },
    resolver: zodResolver(CreateCreditLineSchema),
  })

  const { mutateAsync, isPending } = useCreateOrderCreditLine(order.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        amount: data.amount,
        reference: data.reference,
        reference_id: data.reference_id,
      },
      {
        onSuccess: () => {
          toast.success(
            t("orders.payment.refundPaymentSuccess", {
              amount: formatCurrency(data.amount, order?.currency_code!),
            })
          )

          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex size-full flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex-1 overflow-auto">
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="amount"
              rules={{
                required: true,
                min: 0,
                max: order.summary.pending_difference as number,
              }}
              render={({ field: { onChange, ...field } }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t("fields.amount")}</Form.Label>

                    <Form.Control>
                      <CurrencyInput
                        {...field}
                        min={0}
                        onValueChange={(value) => {
                          const fieldValue = value ? parseInt(value) : ""

                          onChange(fieldValue)
                        }}
                        code={order.currency_code}
                        symbol={getCurrencySymbol(order.currency_code)}
                        value={field.value}
                      />
                    </Form.Control>

                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
          </div>
        </RouteDrawer.Body>

        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>

            <Button
              isLoading={isPending}
              type="submit"
              variant="primary"
              size="small"
              disabled={!!Object.keys(form.formState.errors || {}).length}
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}

import { zodResolver } from "@hookform/resolvers/zod"
import { AdminOrder } from "@medusajs/types"
import {
  Button,
  clx,
  CurrencyInput,
  Input,
  Label,
  RadioGroup,
  toast,
} from "@medusajs/ui"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"
import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateOrderCreditLine } from "../../../../../hooks/api"
import { getCurrencySymbol } from "../../../../../lib/data/currencies"

const CreateCreditLineSchema = zod.object({
  amount: zod.number(),
  reference: zod.string().optional(),
  reference_id: zod.string().optional(),
  note: zod.string().optional(),
})

export const CreateCreditLineForm = ({ order }: { order: AdminOrder }) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const form = useForm<zod.infer<typeof CreateCreditLineSchema>>({
    defaultValues: {
      amount: 0,
    },
    resolver: zodResolver(CreateCreditLineSchema),
  })

  const { mutateAsync, isPending } = useCreateOrderCreditLine(order.id)

  const [isCredit, setIsCredit] = useState(true)

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        amount: isCredit ? data.amount : -data.amount,
        reference: data.reference ?? "order",
        reference_id: data.reference_id ?? order.id,
      },
      {
        onSuccess: () => {
          toast.success(t("orders.creditLines.createCreditLineSuccess"))

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
            <Label className="txt-compact-small font-sans font-medium">
              {t("orders.creditLines.operation")}
            </Label>

            <RadioGroup
              className="flex flex-col gap-y-3"
              value={isCredit.toString()}
              onValueChange={(value) => setIsCredit(value === "true")}
            >
              <RadioGroup.ChoiceBox
                value={"true"}
                description={t("orders.creditLines.creditDescription")}
                label={t("orders.creditLines.credit")}
                className={clx("basis-1/2")}
              />

              <RadioGroup.ChoiceBox
                value={"false"}
                description={t("orders.creditLines.debitDescription")}
                label={t("orders.creditLines.debit")}
                className={clx("basis-1/2")}
              />
            </RadioGroup>

            <Form.Field
              control={form.control}
              name="amount"
              rules={{
                required: true,
                min: 0,
                max: order.summary.pending_difference,
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

            <Form.Field
              control={form.control}
              name="reference"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t("fields.reference")}</Form.Label>

                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>

                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />

            <Form.Field
              control={form.control}
              name="reference_id"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t("fields.reference_id")}</Form.Label>

                    <Form.Control>
                      <Input {...field} />
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

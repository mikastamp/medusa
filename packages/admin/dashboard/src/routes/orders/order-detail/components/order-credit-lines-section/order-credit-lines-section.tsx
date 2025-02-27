import { Plus } from "@medusajs/icons"
import { AdminOrder, HttpTypes, OrderCreditLineDTO } from "@medusajs/types"
import { Badge, Container, Heading, Text, toast, usePrompt } from "@medusajs/ui"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "../../../../../components/common/action-menu"
import DisplayId from "../../../../../components/common/display-id/display-id"
import { useCreateOrderCreditLine } from "../../../../../hooks/api"
import { getTotalCreditLines } from "../../../../../lib/credit-line"
import { formatCurrency } from "../../../../../lib/format-currency"
import {
  getLocaleAmount,
  getStylizedAmount,
} from "../../../../../lib/money-amount-helpers"

export const OrderCreditLinesSection = ({ order }: { order: AdminOrder }) => {
  const creditLines = order.credit_lines ?? []

  return (
    <Container className="divide-y divide-dashed p-0">
      <Header order={order} />

      {creditLines.map((creditLine) => (
        <CreditLine key={creditLine.id} order={order} creditLine={creditLine} />
      ))}

      <Total order={order} />
    </Container>
  )
}

const Header = ({ order }: { order: AdminOrder }) => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <Heading level="h2">{t("orders.creditLines.title")}</Heading>
    </div>
  )
}

const Total = ({ order }: { order: AdminOrder }) => {
  const { t } = useTranslation()

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4">
        <Text size="small" weight="plus" leading="compact">
          {t("orders.creditLines.total")}
        </Text>

        <Text size="small" weight="plus" leading="compact">
          {getStylizedAmount(
            getTotalCreditLines(order.credit_lines ?? []),
            order.currency_code
          )}
        </Text>
      </div>
    </div>
  )
}

const CreditLine = ({
  order,
  creditLine,
}: {
  order: HttpTypes.AdminOrder
  creditLine: OrderCreditLineDTO
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync } = useCreateOrderCreditLine(order.id)

  const handleCreateCreditLine = async () => {
    const res = await prompt({
      title: t("orders.payment.capture"),
      description: t("orders.payment.capturePayment", {
        amount: formatCurrency(
          creditLine.amount as number,
          order.currency_code
        ),
      }),
      confirmText: t("actions.confirm"),
      cancelText: t("actions.cancel"),
      variant: "confirmation",
    })

    if (!res) {
      return
    }

    await mutateAsync(
      {
        amount: creditLine.amount as number,
        order_id: order.id,
        reference: "order",
        reference_id: order.id,
      },
      {
        onSuccess: () => {
          toast.success(
            t("orders.payment.capturePaymentSuccess", {
              amount: formatCurrency(
                creditLine.amount as number,
                order.currency_code
              ),
            })
          )
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  return (
    <div className="divide-y divide-dashed">
      <div className="text-ui-fg-subtle grid grid-cols-[1fr_1fr_1fr_20px] items-center gap-x-4 px-6 py-4 sm:grid-cols-[1fr_1fr_1fr_1fr_20px]">
        <div className="w-full min-w-[60px] overflow-hidden">
          <Text
            size="small"
            leading="compact"
            weight="plus"
            className="truncate"
          >
            <DisplayId id={creditLine.id} />
          </Text>
          <Text size="small" leading="compact">
            {format(
              new Date(creditLine.created_at as unknown as string),
              "dd MMM, yyyy, HH:mm:ss"
            )}
          </Text>
        </div>

        <div className="hidden items-center justify-end gap-x-2 sm:flex">
          <Text size="small" leading="compact" className="capitalize">
            {creditLine.reference}
          </Text>

          <Badge color={"grey"} className="text-nowrap" size="2xsmall">
            <DisplayId id={creditLine.reference_id!} />
          </Badge>
        </div>

        <div className="flex items-center justify-end">
          <Badge
            color={(creditLine.amount as number) > 0 ? "green" : "red"}
            className="text-nowrap"
            size="2xsmall"
          >
            {(creditLine.amount as number) > 0 ? "credit" : "debit"}
          </Badge>
        </div>

        <div className="flex items-center justify-end">
          <Text size="small" leading="compact">
            {getLocaleAmount(creditLine.amount as number, order.currency_code)}
          </Text>
        </div>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: "Create Credit Line",
                  icon: <Plus />,
                  to: `/orders/${order.id}/credit-lines?creditLineId=${creditLine.id}`,
                },
              ],
            },
          ]}
        />
      </div>
    </div>
  )
}

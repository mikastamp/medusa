import { AdminOrder, HttpTypes, OrderCreditLineDTO } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import DisplayId from "../../../../../components/common/display-id/display-id"
import { getTotalCreditLines } from "../../../../../lib/credit-line"
import {
  getLocaleAmount,
  getStylizedAmount,
} from "../../../../../lib/money-amount-helpers"

export const OrderCreditLinesSection = ({ order }: { order: AdminOrder }) => {
  const creditLines = order.credit_lines ?? []

  return (
    <Container className="divide-y divide-dashed p-0">
      <Header />

      {creditLines.map((creditLine) => (
        <CreditLine key={creditLine.id} order={order} creditLine={creditLine} />
      ))}

      <Total order={order} />
    </Container>
  )
}

const Header = () => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <Heading level="h2">{t("orders.creditLines.title")}</Heading>

      <Link
        to="credit-lines"
        className="text-ui-fg-muted txt-compact-small-plus"
      >
        {t("orders.creditLines.creditOrDebit")}
      </Link>
    </div>
  )
}

const Total = ({ order }: { order: AdminOrder }) => {
  const { t } = useTranslation()

  return (
    <div>
      <div className="flex items-end justify-between px-6 py-4">
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
  const prettyReference = creditLine.reference
    ?.split("_")
    .join(" ")
    .split("-")
    .join(" ")

  const prettyReferenceId = creditLine.reference_id ? (
    <DisplayId id={creditLine.reference_id} />
  ) : null

  return (
    <div className="divide-y divide-dashed">
      <div className="text-ui-fg-subtle grid grid-cols-[1fr_1fr_1fr] items-center gap-x-4 px-6 py-4 sm:grid-cols-[1fr_1fr_1fr]">
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
            {format(new Date(creditLine.created_at), "dd MMM, yyyy, HH:mm:ss")}
          </Text>
        </div>

        <div className="hidden items-center justify-end gap-x-2 sm:flex">
          <Text size="small" leading="compact" className="capitalize">
            {prettyReference} ({prettyReferenceId})
          </Text>
        </div>

        <div className="flex items-center justify-end">
          <Text size="small" leading="compact">
            {getLocaleAmount(creditLine.amount as number, order.currency_code)}
          </Text>
        </div>
      </div>
    </div>
  )
}

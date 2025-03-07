import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { RouteDrawer } from "../../../components/modals"
import { useOrder } from "../../../hooks/api"
import { DEFAULT_FIELDS } from "../order-detail/constants"
import { CreateCreditLineForm } from "./components/create-credit-line-form"

export const OrderCreateCreditLine = () => {
  const { t } = useTranslation()
  const params = useParams()
  const { order } = useOrder(params.id!, {
    fields: DEFAULT_FIELDS,
  })

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("orders.creditLines.createCreditLine")}</Heading>
      </RouteDrawer.Header>

      {order && <CreateCreditLineForm order={order} />}
    </RouteDrawer>
  )
}

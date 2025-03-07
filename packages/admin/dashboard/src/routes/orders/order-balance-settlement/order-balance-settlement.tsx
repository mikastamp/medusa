import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { RouteDrawer } from "../../../components/modals"
import { useOrder } from "../../../hooks/api"
import { DEFAULT_FIELDS } from "../order-detail/constants"
import { OrderBalanceSettlementForm } from "./components/order-balance-settlement-form"

export const OrderBalanceSettlement = () => {
  const { t } = useTranslation()
  const params = useParams()
  const { order } = useOrder(params.id!, { fields: DEFAULT_FIELDS })

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("orders.balanceSettlement.title")}</Heading>
      </RouteDrawer.Header>

      {order && <OrderBalanceSettlementForm order={order} />}
    </RouteDrawer>
  )
}

import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"
import { DEFAULT_BATCH_ENDPOINTS_SIZE_LIMIT } from "../../../utils/middlewares"
import { createBatchBody } from "../../utils/validators"
import * as QueryConfig from "./query-config"
import {
  AdminCreatePromotion,
  AdminCreatePromotionRule,
  AdminGetPromotionParams,
  AdminGetPromotionRuleParams,
  AdminGetPromotionRuleTypeParams,
  AdminGetPromotionsParams,
  AdminGetPromotionsRuleValueParams,
  AdminUpdatePromotion,
  AdminUpdatePromotionRule,
} from "./validators"

export const adminPromotionRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/promotions",
    middlewares: [
      validateAndTransformQuery(
        AdminGetPromotionsParams,
        QueryConfig.listTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/promotions",
    middlewares: [
      validateAndTransformBody(AdminCreatePromotion),
      validateAndTransformQuery(
        AdminGetPromotionParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/promotions/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetPromotionParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/promotions/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdatePromotion),
      validateAndTransformQuery(
        AdminGetPromotionParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/promotions/:id/:rule_type",
    middlewares: [
      validateAndTransformQuery(
        AdminGetPromotionRuleTypeParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/promotions/:id/rules/batch",
    bodyParser: {
      sizeLimit: DEFAULT_BATCH_ENDPOINTS_SIZE_LIMIT,
    },
    middlewares: [
      validateAndTransformBody(
        createBatchBody(AdminCreatePromotionRule, AdminUpdatePromotionRule)
      ),
      validateAndTransformQuery(
        AdminGetPromotionRuleParams,
        QueryConfig.retrieveRuleTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/promotions/:id/target-rules/batch",
    bodyParser: {
      sizeLimit: DEFAULT_BATCH_ENDPOINTS_SIZE_LIMIT,
    },
    middlewares: [
      validateAndTransformBody(
        createBatchBody(AdminCreatePromotionRule, AdminUpdatePromotionRule)
      ),
      validateAndTransformQuery(
        AdminGetPromotionRuleParams,
        QueryConfig.retrieveRuleTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/promotions/:id/buy-rules/batch",
    bodyParser: {
      sizeLimit: DEFAULT_BATCH_ENDPOINTS_SIZE_LIMIT,
    },
    middlewares: [
      validateAndTransformBody(
        createBatchBody(AdminCreatePromotionRule, AdminUpdatePromotionRule)
      ),
      validateAndTransformQuery(
        AdminGetPromotionRuleParams,
        QueryConfig.retrieveRuleTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher:
      "/admin/promotions/rule-value-options/:rule_type/:rule_attribute_id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetPromotionsRuleValueParams,
        QueryConfig.listRuleValueTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/promotions/rule-attribute-options/:rule_type",
    middlewares: [
      validateAndTransformQuery(
        AdminGetPromotionRuleParams,
        QueryConfig.listRuleTransformQueryConfig
      ),
    ],
  },
]

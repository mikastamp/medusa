import { FulfillmentWorkflow } from "@medusajs/framework/types"
import {
  MedusaError,
  Modules,
  ShippingOptionPriceType,
} from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export const validateShippingOptionPricesStepId =
  "validate-shipping-option-prices"

/**
 * Validate that shipping options can be crated based on provided price configuration.
 *
 * For flat rate prices, it validates that regions exist for the shipping option prices.
 * For calculated prices, it validates with the fulfillment provider if the price can be calculated.
 */
export const validateShippingOptionPricesStep = createStep(
  validateShippingOptionPricesStepId,
  async (
    options: (
      | FulfillmentWorkflow.CreateShippingOptionsWorkflowInput
      | FulfillmentWorkflow.UpdateShippingOptionsWorkflowInput
    )[],
    { container }
  ) => {
    const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)

    const flatRatePrices = options.flatMap((option) =>
      option.price_type === ShippingOptionPriceType.FLAT
        ? ((option.prices ?? []) as { region_id: string; amount: number }[])
        : []
    )

    const calculatedOptions = options
      .filter(
        (option) => option.price_type === ShippingOptionPriceType.CALCULATED
      )
      .flatMap((option) => option ?? [])

    await fulfillmentModuleService.validateShippingOptionsForPriceCalculation(
      calculatedOptions as FulfillmentWorkflow.CreateShippingOptionsWorkflowInput[]
    )

    const regionIdSet = new Set<string>()

    flatRatePrices.forEach((price) => {
      if ("region_id" in price && price.region_id) {
        regionIdSet.add(price.region_id)
      }
    })

    if (regionIdSet.size === 0) {
      return new StepResponse(void 0)
    }

    const regionService = container.resolve(Modules.REGION)
    const regionList = await regionService.listRegions({
      id: Array.from(regionIdSet),
    })

    if (regionList.length !== regionIdSet.size) {
      const missingRegions = Array.from(regionIdSet).filter(
        (id) => !regionList.some((region) => region.id === id)
      )
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Cannot create prices for non-existent regions. Region with ids [${missingRegions.join(
          ", "
        )}] were not found.`
      )
    }

    return new StepResponse(void 0)
  }
)

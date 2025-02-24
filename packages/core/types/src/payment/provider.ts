import { AddressDTO } from "../address"
import { BigNumberInput, BigNumberValue } from "../totals"
import { AccountHolderDTO, PaymentSessionStatus } from "./common"
import { ProviderWebhookPayload } from "./mutations"

/**
 * The address of the payment.
 */
export type PaymentAddressDTO = Partial<AddressDTO>

/**
 * The customer associated with the payment.
 */
export type PaymentCustomerDTO = {
  /**
   * The ID of the customer in Medusa.
   */
  id: string
  /**
   * The email of the customer.
   */
  email: string
  /**
   * The customer's company name.
   */
  company_name?: string | null
  /**
   * The customer's first name.
   */
  first_name?: string | null
  /**
   * The customer's last name.
   */
  last_name?: string | null
  /**
   * The customer's phone number.
   */
  phone?: string | null
  /**
   * The customer's billing address.
   */
  billing_address?: PaymentAddressDTO | null
}

export type PaymentAccountHolderDTO = {
  /**
   * Account holder's details as stored in the third-party payment provider.
   */
  data: Record<string, unknown>
}

/**
 * Normalized events from payment provider to internal payment module events.
 */
export type PaymentActions =
  | "authorized"
  | "captured"
  | "failed"
  | "pending"
  | "requires_more"
  | "canceled"
  | "not_supported"

/**
 * @interface
 *
 * Context data provided to the payment provider
 */
export type PaymentProviderContext = {
  /**
   * The account holder information, if available for the payment provider.
   */
  account_holder?: PaymentAccountHolderDTO

  /**
   * The customer information from Medusa.
   */
  customer?: PaymentCustomerDTO

  /**
   * Idempotency key for the request, if the payment provider supports it. It will be ignored otherwise.
   */
  idempotency_key?: string
}

export type PaymentProviderInput = {
  /**
   * Data is a combination of the input from the user and what is stored in the database for the associated model.
   */
  data?: Record<string, unknown>
  /**
   * The context for this payment operation. The data is guaranteed to be validated and not directly provided by the user.
   */
  context?: PaymentProviderContext
}

/**
 * @interface
 *
 * The data used initiate a payment in a provider when a payment
 * session is created.
 */
export type InitiatePaymentInput = PaymentProviderInput & {
  /**
   * The amount to be authorized.
   */
  amount: BigNumberInput

  /**
   * The ISO 3 character currency code.
   */
  currency_code: string
}

/**
 * @interface
 *
 * The attributes to update a payment related to a payment session in a provider.
 */
export type UpdatePaymentInput = PaymentProviderInput & {
  /**
   * The payment session's amount.
   */
  amount: BigNumberInput

  /**
   * The ISO 3 character code of the payment session.
   */
  currency_code: string
}

/**
 * @interface
 *
 * The data to delete a payment.
 */
export type DeletePaymentInput = PaymentProviderInput

/**
 * @interface
 *
 * The data to authorize a payment.
 */
export type AuthorizePaymentInput = PaymentProviderInput

/**
 * @interface
 *
 * The data to capture a payment.
 */
export type CapturePaymentInput = PaymentProviderInput

/**
 * @interface
 *
 * The data to refund a payment.
 */
export type RefundPaymentInput = PaymentProviderInput & {
  /**
   * The amount to refund.
   */
  amount: BigNumberInput
}

/**
 * @interface
 *
 * The data to retrieve a payment.
 */
export type RetrievePaymentInput = PaymentProviderInput

/**
 * @interface
 *
 * The data to cancel a payment.
 */
export type CancelPaymentInput = PaymentProviderInput

/**
 * @interface
 *
 * The data to create an account holder.
 */
export type CreateAccountHolderInput = PaymentProviderInput & {
  /**
   * The context of creating the account holder.
   */
  context: Omit<PaymentProviderContext, "customer"> & {
    /**
     * The account holder's associated customer details.
     */
    customer: PaymentCustomerDTO
  }
}

export type UpdateAccountHolderInput = PaymentProviderInput & {
  /**
   * The context of updating the account holder.
   */
  context: PaymentProviderContext & {
    /**
     * The account holder's details.
     */
    account_holder: PaymentAccountHolderDTO
  }
}

/**
 * @interface
 *
 * The data to delete an account holder.
 */
export type DeleteAccountHolderInput = PaymentProviderInput & {
  /**
   * The context of deleting the account holder.
   */
  context: Omit<PaymentProviderContext, "account_holder"> & {
    /**
     * The account holder's details.
     */
    account_holder: Partial<AccountHolderDTO>
  }
}

/**
 * @interface
 *
 * The data to list payment methods.
 */
export type ListPaymentMethodsInput = PaymentProviderInput

/**
 * @interface
 *
 * The data to save a payment method.
 */
export type SavePaymentMethodInput = PaymentProviderInput

/**
 * @interface
 *
 * The data to get the payment status.
 */
export type GetPaymentStatusInput = PaymentProviderInput

/**
 * @interface
 *
 * The response of operations on a payment.
 */
export type PaymentProviderOutput = {
  /**
   * The unstructured data returned from the payment provider. The content will vary between providers.
   */
  data?: Record<string, unknown>
}

/**
 * @interface
 *
 * The successful result of initiating a payment session using a third-party payment provider.
 */
export type InitiatePaymentOutput = PaymentProviderOutput & {
  /**
   * The ID of the payment session in the payment provider.
   */
  id: string
}

/**
 * @interface
 *
 * The successful result of authorizing a payment session using a payment provider.
 */
export type AuthorizePaymentOutput = PaymentProviderOutput & {
  /**
   * The status of the payment, which will be stored in the payment session's `status` field.
   */
  status: PaymentSessionStatus
}

/**
 * @interface
 *
 * The result of updating a payment.
 */
export type UpdatePaymentOutput = PaymentProviderOutput

/**
 * @interface
 *
 * The result of deleting a payment.
 */
export type DeletePaymentOutput = PaymentProviderOutput

/**
 * @interface
 *
 * The result of capturing the payment.
 */
export type CapturePaymentOutput = PaymentProviderOutput

/**
 * @interface
 *
 * The result of refunding the payment.
 */
export type RefundPaymentOutput = PaymentProviderOutput

/**
 * @interface
 *
 * The result of retrieving the payment.
 */
export type RetrievePaymentOutput = PaymentProviderOutput

/**
 * @interface
 *
 * The result of canceling the payment.
 */
export type CancelPaymentOutput = PaymentProviderOutput

/**
 * @interface
 *
 * The result of creating an account holder in the third-party payment provider. The `data`
 * property is stored as-is in Medusa's account holder's `data` property.
 */
export type CreateAccountHolderOutput = PaymentProviderOutput & {
  /**
   * The ID of the account holder in the payment provider.
   * This is stored in Medusa's account holder in the `external_id` property.
   */
  id: string
}

/**
 * @interface
 * 
 * The result of updating an account holder in the third-party payment provider. The `data`
 * property is stored as-is in Medusa's account holder's `data` property.
 */
export type UpdateAccountHolderOutput = PaymentProviderOutput

/**
 * @interface
 * 
 * The result of deleting an account holder in the third-party payment provider.
 */
export type DeleteAccountHolderOutput = PaymentProviderOutput

/**
 * @interface
 * 
 * The result of listing payment methods for an account holder in the third-party payment provider.
 */
export type ListPaymentMethodsOutput = (PaymentProviderOutput & {
  /**
   * The ID of the payment method in the payment provider.
   */
  id: string
})[]

/**
 * @interface
 *
 * The result of saving a payment method.
 */
export type SavePaymentMethodOutput = PaymentProviderOutput & {
  /**
   * The ID of the payment method in the payment provider.
   */
  id: string
}

/**
 * @interface
 *
 * The result of getting the payment status.
 */
export type GetPaymentStatusOutput = PaymentProviderOutput & {
  /**
   * The status of the payment, which will be stored in the payment session's `status` field.
   */
  status: PaymentSessionStatus
}

/**
 * @interface
 *
 * The details of an action to be performed as a result of a received webhook event.
 */
export type WebhookActionData = {
  /**
   * The associated payment session's ID.
   */
  session_id: string

  /**
   * The amount to be captured or authorized (based on the action's type.)
   */
  amount: BigNumberValue
}

/**
 * @interface
 *
 * The actions that the payment provider informs the Payment Module to perform.
 */
export type WebhookActionResult = {
  /**
   * Normalized events from payment provider to internal payment module events.
   */
  action: PaymentActions

  /**
   * The webhook action's details.
   */
  data?: WebhookActionData
}

export interface IPaymentProvider {
  /**
   * @ignore
   *
   * Return a unique identifier to retrieve the payment module provider
   */
  getIdentifier(): string

  initiatePayment(data: InitiatePaymentInput): Promise<InitiatePaymentOutput>

  updatePayment(data: UpdatePaymentInput): Promise<UpdatePaymentOutput>

  deletePayment(data: DeletePaymentInput): Promise<DeletePaymentOutput>

  authorizePayment(data: AuthorizePaymentInput): Promise<AuthorizePaymentOutput>

  capturePayment(data: CapturePaymentInput): Promise<CapturePaymentOutput>

  refundPayment(data: RefundPaymentInput): Promise<RefundPaymentOutput>

  retrievePayment(data: RetrievePaymentInput): Promise<RetrievePaymentOutput>

  cancelPayment(data: CancelPaymentInput): Promise<CancelPaymentOutput>

  /**
   * This method is used when creating an account holder in Medusa, allowing you to create
   * the equivalent account in the third-party service. An account holder is useful to
   * later save payment methods, such as credit cards, for a customer in the
   * third-party payment provider using the {@link savePaymentMethod} method.
   *
   * The returned data will be stored in the account holder created in Medusa. For example,
   * the returned `id` property will be stored in the account holder's `external_id` property.
   *
   * Medusa creates an account holder when a payment session initialized for a registered customer.
   *
   * @param data - Input data including the details of the account holder to create.
   * @returns The result of creating the account holder. If an error occurs, throw it.
   *
   * @version 2.5.0
   *
   * @example
   * import { MedusaError } from "@medusajs/framework/utils"
   *
   * class MyPaymentProviderService extends AbstractPaymentProvider<
   *  Options
   * > {
   *  async createAccountHolder({ context, data }: CreateAccountHolderInput) {
   *   const { account_holder, customer } = context
   *
   *   if (account_holder?.data?.id) {
   *     return { id: account_holder.data.id as string }
   *   }
   *
   *   if (!customer) {
   *     throw new MedusaError(
   *       MedusaError.Types.INVALID_DATA,
   *       "Missing customer data."
   *     )
   *   }
   *
   *   // assuming you have a client that creates the account holder
   *   const providerAccountHolder = await this.client.createAccountHolder({
   *     email: customer.email,
   *    ...data
   *   })
   *
   *   return {
   *     id: providerAccountHolder.id,
   *     data: providerAccountHolder as unknown as Record<string, unknown>
   *   }
   * }
   */
  createAccountHolder?(
    data: CreateAccountHolderInput
  ): Promise<CreateAccountHolderOutput>

  /**
   * This method is used when updating an account holder in Medusa, allowing you to update
   * the equivalent account in the third-party service.
   *
   * The returned data will be stored in the account holder created in Medusa. For example,
   * the returned `id` property will be stored in the account holder's `external_id` property.
   *
   * @param data - Input data including the details of the account holder to update.
   * @returns The result of updating the account holder. If an error occurs, throw it.
   *
   * @version 2.5.1
   *
   * @example
   * import { MedusaError } from "@medusajs/framework/utils"
   *
   * class MyPaymentProviderService extends AbstractPaymentProvider<
   *  Options
   * > {
   *  async updateAccountHolder({ context, data }: UpdateAccountHolderInput) {
   *   const { account_holder, customer } = context
   *
   *   if (!account_holder?.data?.id) {
   *     throw new MedusaError(
   *       MedusaError.Types.INVALID_DATA,
   *       "Missing account holder ID."
   *     )
   *   }
   *
   *   // assuming you have a client that updates the account holder
   *   const providerAccountHolder = await this.client.updateAccountHolder({
   *     id: account_holder.data.id,
   *    ...data
   *   })
   *
   *   return {
   *     id: providerAccountHolder.id,
   *     data: providerAccountHolder as unknown as Record<string, unknown>
   *   }
   * }
   */
  updateAccountHolder?(
    data: UpdateAccountHolderInput
  ): Promise<UpdateAccountHolderOutput>

  /**
   * This method is used when an account holder is deleted in Medusa, allowing you
   * to also delete the equivalent account holder in the third-party service.
   *
   * @param data - Input data including the details of the account holder to delete.
   * @returns The result of deleting the account holder. If an error occurs, throw it.
   *
   * @version 2.5.0
   *
   * @example
   * import { MedusaError } from "@medusajs/framework/utils"
   *
   * class MyPaymentProviderService extends AbstractPaymentProvider<
   *  Options
   * > {
   *   async deleteAccountHolder({ context }: DeleteAccountHolderInput) {
   *     const { account_holder } = context
   *     const accountHolderId = account_holder?.data?.id as string | undefined
   *     if (!accountHolderId) {
   *       throw new MedusaError(
   *         MedusaError.Types.INVALID_DATA,
   *         "Missing account holder ID."
   *       )
   *     }
   *
   *     // assuming you have a client that deletes the account holder
   *     await this.client.deleteAccountHolder({
   *       id: accountHolderId
   *     })
   *
   *     return {}
   *   }
   * }
   */
  deleteAccountHolder?(
    data: DeleteAccountHolderInput
  ): Promise<DeleteAccountHolderOutput>

  /**
   * This method is used to retrieve the list of saved payment methods for an account holder
   * in the third-party payment provider. A payment provider that supports saving payment methods
   * must implement this method.
   *
   * @version 2.5.0
   *
   * @param data - Input data including the details of the account holder to list payment methods for.
   * @returns The list of payment methods saved for the account holder. If an error occurs, throw it.
   *
   * @example
   * import { MedusaError } from "@medusajs/framework/utils"
   *
   * class MyPaymentProviderService extends AbstractPaymentProvider<
   *   Options
   * > {
   *   async listPaymentMethods({ context }: ListPaymentMethodsInput) {
   *     const { account_holder } = context
   *     const accountHolderId = account_holder?.data?.id as string | undefined
   *
   *     if (!accountHolderId) {
   *       throw new MedusaError(
   *         MedusaError.Types.INVALID_DATA,
   *         "Missing account holder ID."
   *       )
   *     }
   *
   *    // assuming you have a client that lists the payment methods
   *    const paymentMethods = await this.client.listPaymentMethods({
   *      customer_id: accountHolderId
   *    })
   *
   *    return paymentMethods.map((pm) => ({
   *      id: pm.id,
   *      data: pm as unknown as Record<string, unknown>
   *    }))
   *  }
   * }
   */
  listPaymentMethods?(
    data: ListPaymentMethodsInput
  ): Promise<ListPaymentMethodsOutput>

  /**
   * This method is used to save a customer's payment method, such as a credit card, in the
   * third-party payment provider. A payment provider that supports saving payment methods
   * must implement this method.
   *
   * @version 2.5.0
   *
   * @param data - The details of the payment method to save.
   * @returns The result of saving the payment method. If an error occurs, throw it.
   *
   * @example
   * import { MedusaError } from "@medusajs/framework/utils"
   *
   * class MyPaymentProviderService extends AbstractPaymentProvider<
   *   Options
   * > {
   *   async savePaymentMethod({ context, data }: SavePaymentMethodInput) {   *
   *     const accountHolderId = context?.account_holder?.data?.id as
   *       | string
   *       | undefined
   *
   *     if (!accountHolderId) {
   *       throw new MedusaError(
   *         MedusaError.Types.INVALID_DATA,
   *         "Missing account holder ID."
   *       )
   *     }
   *
   *    // assuming you have a client that saves the payment method
   *    const paymentMethod = await this.client.savePaymentMethod({
   *      customer_id: accountHolderId,
   *      ...data
   *    })
   *
   *   return {
   *     id: paymentMethod.id,
   *     data: paymentMethod as unknown as Record<string, unknown>
   *   }
   *  }
   * }
   */
  savePaymentMethod?(
    data: SavePaymentMethodInput
  ): Promise<SavePaymentMethodOutput>

  getPaymentStatus(data: GetPaymentStatusInput): Promise<GetPaymentStatusOutput>

  getWebhookActionAndData(
    data: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult>
}

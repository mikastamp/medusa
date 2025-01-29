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
  id: string
  email: string
  company_name?: string | null
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  billing_address?: PaymentAddressDTO | null
}

export type PaymentAccountHolderDTO = {
  data: Record<string, unknown>
}

/**
 * Normalized events from payment provider to internal payment module events.
 */
export type PaymentActions =
  | "authorized"
  | "captured"
  | "failed"
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
}

export type PaymentProviderInput = {
  // Data is a combination of the input from the user and whatever is stored in the DB for this entity.
  data?: Record<string, unknown>

  // The context for this payment operation. The data is guaranteed to be validated and not directly provided by the user.
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

export type DeletePaymentInput = PaymentProviderInput

export type AuthorizePaymentInput = PaymentProviderInput

export type CapturePaymentInput = PaymentProviderInput

export type RefundPaymentInput = PaymentProviderInput & {
  /**
   * The amount to refund.
   */
  amount: BigNumberInput
}

export type RetrievePaymentInput = PaymentProviderInput

export type CancelPaymentInput = PaymentProviderInput

export type CreateAccountHolderInput = PaymentProviderInput & {
  context: Omit<PaymentProviderContext, "customer"> & {
    customer: PaymentCustomerDTO
  }
}

export type DeleteAccountHolderInput = PaymentProviderInput & {
  context: Omit<PaymentProviderContext, "account_holder"> & {
    account_holder: Partial<AccountHolderDTO>
  }
}

export type ListPaymentMethodsInput = PaymentProviderInput

export type SavePaymentMethodInput = PaymentProviderInput

export type GetPaymentStatusInput = PaymentProviderInput

/**
 * @interface
 *
 * The response of operations on a payment.
 */
export type PaymentProviderOutput = {
  /**
   * The unstrucvtured data returned from the payment provider. The content will vary between providers.
   */
  data?: Record<string, unknown>
}

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

export type UpdatePaymentOutput = PaymentProviderOutput

export type DeletePaymentOutput = PaymentProviderOutput

export type CapturePaymentOutput = PaymentProviderOutput

export type RefundPaymentOutput = PaymentProviderOutput

export type RetrievePaymentOutput = PaymentProviderOutput

export type CancelPaymentOutput = PaymentProviderOutput

export type CreateAccountHolderOutput = PaymentProviderOutput & {
  /**
   * The ID of the account holder in the payment provider.
   */
  id: string
}

export type DeleteAccountHolderOutput = PaymentProviderOutput

export type ListPaymentMethodsOutput = (PaymentProviderOutput & {
  /**
   * The ID of the payment method in the payment provider.
   */
  id: string
})[]

export type SavePaymentMethodOutput = PaymentProviderOutput & {
  /**
   * The ID of the payment method in the payment provider.
   */
  id: string
}

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

  createAccountHolder?(
    data: CreateAccountHolderInput
  ): Promise<CreateAccountHolderOutput>

  deleteAccountHolder?(
    data: DeleteAccountHolderInput
  ): Promise<DeleteAccountHolderOutput>

  listPaymentMethods?(
    data: ListPaymentMethodsInput
  ): Promise<ListPaymentMethodsOutput>

  savePaymentMethod?(
    data: SavePaymentMethodInput
  ): Promise<SavePaymentMethodOutput>

  getPaymentStatus(data: GetPaymentStatusInput): Promise<GetPaymentStatusOutput>

  getWebhookActionAndData(
    data: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult>
}

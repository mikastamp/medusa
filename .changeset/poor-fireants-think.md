---
"@medusajs/payment": minor
---

fix(payment): If someone was using region_id from the payment collection entity, or cart_id, order_id, customer_id from the payment entity, they will no longer exist. Similarly, any code that was passing region_Id to createPaymentCollections would be recommended to remove the field.

/**
 * Payment checkout state machine definitions.
 */
export const PaymentStatus = {
  IDLE: "idle",
  CREATING_ORDER: "creating_order",
  ORDER_CREATED: "order_created",
  OPENING_GATEWAY: "opening_gateway",
  AWAITING_PAYMENT: "awaiting_payment",
  SUCCESS: "success",
  FAILED: "failed",
  CANCELLED: "cancelled",
  VERIFICATION_PENDING: "verification_pending",
  BOOKING_CREATED: "booking_created",
  COMPLETED: "completed",
};

export default PaymentStatus;

const OrderAutoTransition = {
  STATES: {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    PREPARING: "preparing",
    PACKAGING: "packaging",
    SHIPPING: "shipping",
    DELIVERING: "delivering",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    DELIVERY_FAILED: "delivery_failed",
    AWAITING_PAYMENT: "awaiting_payment",
  },

  TRANSITIONS: {
    PENDING_TO_CONFIRMED: {
      from: "pending",
      to: "confirmed",
      event: "admin_confirmed",
      condition: "manual_approval",
    },

    AWAITING_PAYMENT_TO_CONFIRMED: {
      from: "awaiting_payment",
      to: "confirmed",
      event: "payment_success",
      condition: "auto",
    },

    CONFIRMED_TO_PREPARING: {
      from: "confirmed",
      to: "preparing",
      event: "order_processing_started",
      condition: "auto",
    },

    PREPARING_TO_PACKAGING: {
      from: "preparing",
      to: "packaging",
      event: "products_prepared",
      condition: "trigger",
    },

    PACKAGING_TO_SHIPPING: {
      from: "packaging",
      to: "shipping",
      event: "shipping_pickup",
      condition: "trigger",
    },

    SHIPPING_TO_DELIVERING: {
      from: "shipping",
      to: "delivering",
      event: "out_for_delivery",
      condition: "trigger",
    },

    DELIVERING_TO_COMPLETED: {
      from: "delivering",
      to: "completed",
      event: "delivery_success",
      condition: "trigger",
    },

    DELIVERING_TO_FAILED: {
      from: "delivering",
      to: "delivery_failed",
      event: "delivery_failed",
      condition: "trigger",
    },

    ANY_TO_CANCELLED: {
      from: ["pending", "confirmed", "preparing", "awaiting_payment"],
      to: "cancelled",
      event: "order_cancelled",
      condition: "trigger",
    },
  },

  CONDITIONS: {
    TIME_BASED: {
      PENDING_AUTO_CONFIRM: 15 * 60 * 1000,
      CONFIRMED_TO_PREPARING: 30 * 60 * 1000,
      AUTO_CANCEL_UNPAID: 24 * 60 * 60 * 1000,
    },

    MINIMUM_TRANSITION_TIME: 5 * 60 * 1000,
  },

  ADMIN_OVERRIDE: true,
  LOG_TRANSITIONS: true,

  canTransition: (currentStatus, targetStatus) => {
    const validTransitions = Object.values(
      OrderAutoTransition.TRANSITIONS
    ).filter((transition) => {
      if (Array.isArray(transition.from)) {
        return (
          transition.from.includes(currentStatus) &&
          transition.to === targetStatus
        );
      }
      return (
        transition.from === currentStatus && transition.to === targetStatus
      );
    });

    return validTransitions.length > 0;
  },

  getNextPossibleStates: (currentStatus) => {
    return Object.values(OrderAutoTransition.TRANSITIONS)
      .filter((transition) => {
        if (Array.isArray(transition.from)) {
          return transition.from.includes(currentStatus);
        }
        return transition.from === currentStatus;
      })
      .map((transition) => transition.to);
  },
};

export default OrderAutoTransition;

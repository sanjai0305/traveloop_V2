import api from "../utils/apiClient";

export const createOrder = async (tripId, seats) => {
  const response = await api.post("/payment/create-order", { tripId, seats });
  return response.data;
};

export const verifyPayment = async (payload) => {
  const response = await api.post("/payment/verify", payload);
  return response.data;
};

import { supabase } from "../config/supabase.js";

const Payment = {
  create: async (payload) => {
    const mapped = {
      bookingId: payload.bookingId,
      amount: payload.amount,
      paymentMethod: payload.gateway || payload.paymentMethod || 'Razorpay',
      status: payload.status || 'Paid',
      transactionId: payload.transactionId || payload.paymentId || '',
    };
    const { data, error } = await supabase.from("payments").insert([mapped]).select().single();
    if (error) throw error;
    return {
      ...data,
      _id: data.id,
    };
  },
  find: async (query = {}) => {
    let q = supabase.from("payments").select("*");
    if (query.bookingId) {
      q = q.eq("bookingId", query.bookingId);
    }
    const { data } = await q;
    return (data || []).map(r => ({ ...r, _id: r.id }));
  },
  findOne: async (query = {}) => {
    let q = supabase.from("payments").select("*");
    if (query.bookingId) {
      q = q.eq("bookingId", query.bookingId);
    }
    const { data } = await q.maybeSingle();
    if (!data) return null;
    return {
      ...data,
      _id: data.id,
    };
  }
};

export default Payment;

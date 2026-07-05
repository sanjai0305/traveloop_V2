import React, { useState, useEffect, useRef } from "react";
import { X, CreditCard, Smartphone, QrCode, Building, Wallet, Loader2 } from "lucide-react";
import { loadRazorpay } from "../../utils/loadRazorpay";
import { PaymentStatus } from "./PaymentStatusManager";
import QRPayment from "./QRPayment";
import UPIPayment from "./UPIPayment";
import PaymentRetry from "./PaymentRetry";

export const PaymentModal = ({
  isOpen,
  onClose,
  bookingId,
  amount,
  tripId,
  bookingPayload,
  onSuccess,
  onFailure
}) => {
  const [status, setStatus] = useState(PaymentStatus.IDLE);
  const [selectedMethod, setSelectedMethod] = useState("gateway"); // gateway, upi, qr
  const [errorMessage, setErrorMessage] = useState("");
  const [qrData, setQrData] = useState(null);
  const [pollIntervalId, setPollIntervalId] = useState(null);

  const timeoutRef = useRef(null);

  // Initialize checkout
  useEffect(() => {
    if (isOpen && bookingId) {
      handleInitializePayment();
    }
    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(pollIntervalId);
    };
  }, [isOpen, bookingId]);

  const handleInitializePayment = async () => {
    setStatus(PaymentStatus.CREATING_ORDER);
    setErrorMessage("");

    // Set a 30-second connection timeout guard
    timeoutRef.current = setTimeout(() => {
      if (status !== PaymentStatus.SUCCESS && status !== PaymentStatus.COMPLETED) {
        setStatus(PaymentStatus.FAILED);
        setErrorMessage("Payment initialization timed out. The server is not responding. Please retry.");
      }
    }, 30000);

    try {
      // 1. Try loading Razorpay
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        throw new Error("Failed to load payment gateway scripts. Are you offline?");
      }

      setStatus(PaymentStatus.ORDER_CREATED);
      clearTimeout(timeoutRef.current);
    } catch (err) {
      clearTimeout(timeoutRef.current);
      setStatus(PaymentStatus.FAILED);
      setErrorMessage(err.message || "Failed to load payment gateways.");
    }
  };

  const handleOpenGateway = async () => {
    setStatus(PaymentStatus.OPENING_GATEWAY);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("agentToken");
      const host = import.meta.env.VITE_API_URL || "http://localhost:5000";

      // 1. Create order
      const orderRes = await fetch(`${host}/api/payment/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tripId, seats: bookingPayload?.seats || 1 }),
      });

      if (!orderRes.ok) {
        const errJson = await orderRes.json();
        throw new Error(errJson.message || "Order creation failed.");
      }

      const orderData = await orderRes.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_dummykeyid",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "TravelLoop Checkout",
        description: "Group Journey Booking Fee",
        order_id: orderData.orderId,
        handler: async (response) => {
          setStatus(PaymentStatus.VERIFICATION_PENDING);
          try {
            const verifyRes = await fetch(`${host}/api/payment/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
                bookingPayload,
              }),
            });

            if (!verifyRes.ok) {
              throw new Error("Payment signature verification failed.");
            }

            setStatus(PaymentStatus.COMPLETED);
            onSuccess(await verifyRes.json());
          } catch (verifyErr) {
            setStatus(PaymentStatus.FAILED);
            setErrorMessage(verifyErr.message);
            onFailure(verifyErr);
          }
        },
        modal: {
          ondismiss: () => {
            setStatus(PaymentStatus.CANCELLED);
          },
        },
        prefill: {
          name: bookingPayload?.travellers?.[0]?.name || "",
          contact: bookingPayload?.contactNumber || "",
        },
        theme: {
          color: "#2563EB",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      setStatus(PaymentStatus.AWAITING_PAYMENT);
    } catch (err) {
      console.error("[Razorpay Open Error]:", err);
      setStatus(PaymentStatus.FAILED);
      setErrorMessage(err.message || "Primary gateway connection refused.");
    }
  };

  const handleGenerateQR = async () => {
    setStatus(PaymentStatus.OPENING_GATEWAY);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("agentToken");
      const host = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await fetch(`${host}/api/payment/generate-qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId, amount, tripId }),
      });

      if (!response.ok) {
        throw new Error("Unable to generate QR link.");
      }

      const data = await response.json();
      setQrData(data);
      setStatus(PaymentStatus.AWAITING_PAYMENT);
      startPolling();
    } catch (err) {
      setStatus(PaymentStatus.FAILED);
      setErrorMessage(err.message || "Failed to generate QR payment code.");
    }
  };

  const handleUPIRequest = async (upiVPA) => {
    // UPI collect request logic
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("agentToken");
      const host = import.meta.env.VITE_API_URL || "http://localhost:5000";
      
      const response = await fetch(`${host}/api/payment/confirm-manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          paymentMethod: "upi_collect",
          transactionId: `TXN_UPI_${Date.now()}`,
          upiReference: upiVPA
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send collect request.");
      }

      setStatus(PaymentStatus.COMPLETED);
      onSuccess(await response.json());
    } catch (err) {
      setStatus(PaymentStatus.FAILED);
      setErrorMessage(err.message || "UPI collect request failed.");
    }
  };

  // Start polling checkout status every 5 seconds
  const startPolling = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("agentToken");
    const host = import.meta.env.VITE_API_URL || "http://localhost:5000";

    const id = setInterval(async () => {
      try {
        const res = await fetch(`${host}/api/payment/status/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "PAID") {
            clearInterval(id);
            setStatus(PaymentStatus.COMPLETED);
            onSuccess(data);
          }
        }
      } catch (err) {
        console.warn("[Polling check failed]:", err.message);
      }
    }, 5000);

    setPollIntervalId(id);
  };

  // Confirm manual payment
  const handleConfirmManualQR = async () => {
    setStatus(PaymentStatus.VERIFICATION_PENDING);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("agentToken");
      const host = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const res = await fetch(`${host}/api/payment/confirm-manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          upiReference: qrData?.upiId || "travelloop@okaxis",
          transactionId: qrData?.transactionId
        })
      });

      if (!res.ok) {
        throw new Error("Failed to confirm manual transaction.");
      }

      setStatus(PaymentStatus.COMPLETED);
      onSuccess(await res.json());
    } catch (err) {
      setStatus(PaymentStatus.FAILED);
      setErrorMessage(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gray-900/90 rounded-2xl border border-white/10 p-6 text-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Payment Checkout</h2>
            <p className="text-xs text-gray-400">Total amount to pay: <span className="text-blue-400 font-bold">₹{amount}</span></p>
          </div>
          <button
            onClick={() => {
              clearInterval(pollIntervalId);
              onClose();
            }}
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* State Machine UI Render */}
        {status === PaymentStatus.CREATING_ORDER && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm font-semibold text-gray-300">Initializing payment gateway...</p>
          </div>
        )}

        {status === PaymentStatus.FAILED && (
          <PaymentRetry
            errorMessage={errorMessage}
            onRetry={handleInitializePayment}
            onFallback={() => setSelectedMethod("qr")}
            onClose={() => {
              clearInterval(pollIntervalId);
              onClose();
            }}
          />
        )}

        {status === PaymentStatus.ORDER_CREATED && (
          <div className="space-y-6">
            <p className="text-xs text-gray-400">Select a payment option to proceed:</p>
            <div className="space-y-2.5">
              <button
                onClick={() => setSelectedMethod("gateway")}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-sm font-medium transition-colors ${
                  selectedMethod === "gateway"
                    ? "bg-blue-600/10 border-blue-500 text-white"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
                }`}
              >
                <span className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-3 text-blue-400" />
                  Cards / Netbanking / Wallets
                </span>
              </button>

              <button
                onClick={() => setSelectedMethod("upi")}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-sm font-medium transition-colors ${
                  selectedMethod === "upi"
                    ? "bg-blue-600/10 border-blue-500 text-white"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
                }`}
              >
                <span className="flex items-center">
                  <Smartphone className="w-5 h-5 mr-3 text-purple-400" />
                  UPI Direct Collect VPA
                </span>
              </button>

              <button
                onClick={() => setSelectedMethod("qr")}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-sm font-medium transition-colors ${
                  selectedMethod === "qr"
                    ? "bg-blue-600/10 border-blue-500 text-white"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
                }`}
              >
                <span className="flex items-center">
                  <QrCode className="w-5 h-5 mr-3 text-green-400" />
                  UPI QR Scan Code
                </span>
              </button>
            </div>

            <button
              onClick={() => {
                if (selectedMethod === "gateway") handleOpenGateway();
                if (selectedMethod === "qr") handleGenerateQR();
                if (selectedMethod === "upi") setStatus(PaymentStatus.OPENING_GATEWAY); // switches view to collect
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              Continue Checkout
            </button>
          </div>
        )}

        {status === PaymentStatus.OPENING_GATEWAY && selectedMethod === "upi" && (
          <UPIPayment
            amount={amount}
            onSubmit={handleUPIRequest}
            onCancel={() => setStatus(PaymentStatus.ORDER_CREATED)}
          />
        )}

        {status === PaymentStatus.AWAITING_PAYMENT && selectedMethod === "qr" && qrData && (
          <QRPayment
            qrData={qrData}
            onConfirm={handleConfirmManualQR}
            onCancel={() => setStatus(PaymentStatus.ORDER_CREATED)}
          />
        )}

        {status === PaymentStatus.AWAITING_PAYMENT && selectedMethod === "gateway" && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm font-semibold text-gray-300">Gateway dialog opened. Awaiting payment...</p>
          </div>
        )}

        {status === PaymentStatus.VERIFICATION_PENDING && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
            <p className="text-sm font-semibold text-gray-300">Verifying payment signature...</p>
          </div>
        )}

        {status === PaymentStatus.COMPLETED && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xl font-bold animate-bounce">
              ✓
            </div>
            <p className="text-lg font-bold text-white">Payment Confirmed!</p>
            <p className="text-xs text-gray-400">Your trip booking has been verified successfully.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;

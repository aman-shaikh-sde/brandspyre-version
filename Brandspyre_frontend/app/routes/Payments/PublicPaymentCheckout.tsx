import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { ShieldCheck, Loader2, CheckCircle2, XCircle, AlertCircle, IndianRupee, Building2 } from "lucide-react";
import { loadRazorpayScript } from "~/utils/razorpay";
import { organizationPaymentApi } from "src/services/organizationPaymentService";

type CheckoutState = "loading" | "ready" | "processing" | "success" | "error" | "not_found" | "paid" | "expired";

export default function PublicPaymentCheckout() {
  const { token } = useParams();
  const [state, setState] = useState<CheckoutState>("loading");
  const [requestData, setRequestData] = useState<any>(null);
  const [receiverData, setReceiverData] = useState<any>(null);
  const [receiptInfo, setReceiptInfo] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) { setState("not_found"); return; }
    const load = async () => {
      try {
        const res = await organizationPaymentApi.getPublicPaymentRequest(token);
        const { request, receiver } = res.data?.data || {};
        if (!request) { setState("not_found"); return; }
        setRequestData(request);
        setReceiverData(receiver);
        if (request.status === "PAID") { setState("paid"); return; }
        if (request.status === "CANCELLED" || request.status === "EXPIRED") { setState("expired"); return; }
        setState("ready");
      } catch {
        setState("not_found");
      }
    };
    load();
  }, [token]);

  const handlePay = async () => {
    if (!token || !requestData) return;
    setState("processing");

    try {
      const orderRes = await organizationPaymentApi.createPublicCheckoutOrder(token, {
        name: requestData.payer_name,
        email: requestData.payer_email,
        phone: requestData.payer_phone
      });

      const orderData = orderRes.data?.data;
      if (!orderData?.order_id) {
        setErrorMsg("Could not create checkout order. Please try again.");
        setState("error");
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setErrorMsg("Payment gateway could not be loaded. Check your internet connection.");
        setState("error");
        return;
      }

      const rzp = new window.Razorpay({
        key: orderData.key_id,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency || "INR",
        name: receiverData?.name || "Organization",
        description: orderData.description || orderData.title || "Payment",
        order_id: orderData.order_id,
        prefill: orderData.prefill || {},
        theme: { color: "#6366f1" },
        handler: async (response: any) => {
          try {
            const verifyRes = await organizationPaymentApi.verifyPublicPayment(token!, {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });
            setReceiptInfo(verifyRes.data?.data || {});
            setState("success");
          } catch (err: any) {
            setErrorMsg(err.response?.data?.error || "Payment verification failed.");
            setState("error");
          }
        },
        modal: {
          ondismiss: () => { setState("ready"); }
        }
      });
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to initiate checkout.");
      setState("error");
    }
  };

  const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 16px",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        width: "100%",
        maxWidth: 480,
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          padding: "28px 28px 24px",
          color: "#fff",
          textAlign: "center"
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IndianRupee size={24} />
            </div>
          </div>
          <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>
            {state === "loading" ? "Loading..." : state === "not_found" ? "Invalid Link" : "Secure Payment"}
          </h1>
          {receiverData?.name && (
            <div style={{ fontSize: 13, opacity: 0.85, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Building2 size={14} /> {receiverData.name}
              {receiverData.isVerified && <ShieldCheck size={14} style={{ color: "#a5f3fc" }} />}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "28px" }}>
          {state === "loading" && (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "#6b7280" }}>
              <Loader2 className="animate-spin" size={32} style={{ margin: "0 auto 12px", display: "block" }} />
              <p>Loading payment details...</p>
            </div>
          )}

          {state === "not_found" && (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <XCircle size={48} style={{ color: "#ef4444", margin: "0 auto 12px", display: "block" }} />
              <h3 style={{ margin: "0 0 8px" }}>Payment Link Not Found</h3>
              <p style={{ color: "#6b7280", fontSize: 14 }}>This payment link may be invalid or has expired.</p>
            </div>
          )}

          {state === "paid" && (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <CheckCircle2 size={48} style={{ color: "#10b981", margin: "0 auto 12px", display: "block" }} />
              <h3 style={{ margin: "0 0 8px", color: "#10b981" }}>Already Paid</h3>
              <p style={{ color: "#6b7280", fontSize: 14 }}>This payment request has been fulfilled. Thank you!</p>
            </div>
          )}

          {state === "expired" && (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <AlertCircle size={48} style={{ color: "#f59e0b", margin: "0 auto 12px", display: "block" }} />
              <h3 style={{ margin: "0 0 8px" }}>{requestData?.status === "CANCELLED" ? "Request Cancelled" : "Request Expired"}</h3>
              <p style={{ color: "#6b7280", fontSize: 14 }}>This payment request is no longer active. Please contact the organization.</p>
            </div>
          )}

          {(state === "ready" || state === "processing") && requestData && (
            <>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{requestData.title}</h3>
                {requestData.description && <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 12px" }}>{requestData.description}</p>}
                {requestData.invoice_number && (
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Invoice: {requestData.invoice_number}</div>
                )}
                {requestData.due_date && (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Due: {new Date(requestData.due_date).toLocaleDateString()}</div>
                )}
              </div>

              <div style={{ background: "#f9fafb", borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: "#6b7280" }}>Total Amount</span>
                  <span style={{ fontWeight: 600 }}>{fmt(requestData.total_amount)}</span>
                </div>
                {requestData.paid_amount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: "#6b7280" }}>Already Paid</span>
                    <span style={{ color: "#10b981", fontWeight: 500 }}>- {fmt(requestData.paid_amount)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid #e5e7eb", fontSize: 15 }}>
                  <span style={{ fontWeight: 700 }}>Amount Due</span>
                  <span style={{ fontWeight: 700, color: "#6366f1" }}>{fmt(requestData.balance_due)}</span>
                </div>
              </div>

              <button
                onClick={handlePay}
                disabled={state === "processing"}
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  background: state === "processing" ? "#a5b4fc" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: state === "processing" ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)"
                }}
              >
                {state === "processing" ? <><Loader2 className="animate-spin" size={18} /> Processing...</> : <><ShieldCheck size={18} /> Pay {fmt(requestData.balance_due)}</>}
              </button>

              <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <ShieldCheck size={12} /> Secured by Razorpay • 256-bit SSL Encryption
              </div>
            </>
          )}

          {state === "success" && (
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <CheckCircle2 size={56} style={{ color: "#10b981", margin: "0 auto 16px", display: "block" }} />
              <h3 style={{ margin: "0 0 8px", color: "#10b981" }}>Payment Successful!</h3>
              <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>Your payment has been received and verified.</p>
              {receiptInfo?.receiptNumber && (
                <div style={{ background: "#f9fafb", borderRadius: 8, padding: "12px 16px", fontSize: 13, textAlign: "left" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "#6b7280" }}>Receipt</span>
                    <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{receiptInfo.receiptNumber}</span>
                  </div>
                  {receiptInfo.transactionCode && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ color: "#6b7280" }}>Transaction</span>
                      <span style={{ fontFamily: "monospace", fontSize: 12 }}>{receiptInfo.transactionCode}</span>
                    </div>
                  )}
                  {receiptInfo.amount && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#6b7280" }}>Amount</span>
                      <span style={{ fontWeight: 600 }}>{fmt(receiptInfo.amount)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {state === "error" && (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <XCircle size={48} style={{ color: "#ef4444", margin: "0 auto 12px", display: "block" }} />
              <h3 style={{ margin: "0 0 8px" }}>Payment Failed</h3>
              <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>{errorMsg || "Something went wrong."}</p>
              <button
                onClick={() => setState("ready")}
                style={{
                  padding: "10px 24px", background: "#6366f1", color: "#fff", border: "none",
                  borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer"
                }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

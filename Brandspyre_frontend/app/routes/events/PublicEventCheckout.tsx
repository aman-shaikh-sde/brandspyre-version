import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck,
  ArrowLeft,
  CreditCard,
  Ticket,
  User,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import eventService from "~/services/eventService";
import { loadRazorpayScript } from "~/utils/razorpay";

export default function PublicEventCheckout() {
  const { slugOrId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [cart, setCart] = useState<any>(null);

  // Buyer Info
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Policy Modal & Inline View State
  const [policyModal, setPolicyModal] = useState<"terms" | "refund" | null>(null);
  const [showInlinePolicies, setShowInlinePolicies] = useState(false);

  // Per-ticket attendee info & questions
  const [attendeeList, setAttendeeList] = useState<Array<{
    ticket_id: string;
    ticket_name: string;
    name: string;
    email: string;
    phone: string;
    answers: Record<string, any>;
  }>>([]);

  useEffect(() => {
    // Preload Razorpay SDK securely
    loadRazorpayScript();

    const savedCart = sessionStorage.getItem("brandspyre_event_cart");
    if (!savedCart) {
      navigate(`/explore-events/${slugOrId}`);
      return;
    }

    try {
      const parsed = JSON.parse(savedCart);
      setCart(parsed);
      loadEventAndSetup(parsed);
    } catch (err) {
      navigate(`/explore-events/${slugOrId}`);
    }
  }, [slugOrId]);

  const loadEventAndSetup = async (currentCart: any) => {
    try {
      setLoading(true);
      const res = await eventService.getPublicEventDetails(slugOrId!);
      if (res.success) {
        setEventData(res.data);
        const { tickets = [] } = res.data;

        // Build flat attendee input list for each selected ticket
        const flatList: any[] = [];
        for (const [tId, qty] of Object.entries(currentCart.selectedTickets || {})) {
          const t = tickets.find((tk: any) => tk._id === tId);
          for (let i = 0; i < (qty as number); i++) {
            flatList.push({
              ticket_id: tId,
              ticket_name: t?.name || "General Admission",
              name: "",
              email: "",
              phone: "",
              answers: {}
            });
          }
        }
        setAttendeeList(flatList);
      }
    } catch (err) {
      console.error("Failed to load checkout event data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBuyerInfo = (index: number) => {
    setAttendeeList(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        name: customerName,
        email: customerEmail,
        phone: customerPhone
      };
      return copy;
    });
  };

  const updateAttendeeField = (index: number, field: string, value: any) => {
    setAttendeeList(prev => {
      const copy = [...prev];
      (copy[index] as any)[field] = value;
      return copy;
    });
  };

  const updateAttendeeAnswer = (index: number, questionId: string, value: any) => {
    setAttendeeList(prev => {
      const copy = [...prev];
      copy[index].answers = {
        ...copy[index].answers,
        [questionId]: value
      };
      return copy;
    });
  };

  if (loading || !eventData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const { event, tickets = [], addons = [] } = eventData;

  // Calculate Subtotals
  let grossTickets = 0;
  for (const [tId, qty] of Object.entries(cart?.selectedTickets || {})) {
    const t = tickets.find((tk: any) => tk._id === tId);
    if (t) grossTickets += t.price * (qty as number);
  }

  let grossAddons = 0;
  for (const [aId, item] of Object.entries(cart?.selectedAddons || {})) {
    const a = addons.find((ad: any) => ad._id === aId);
    if (a) {
      let uPrice = a.price;
      const addObj = item as any;
      if (addObj.variant && a.variants) {
        const mv = a.variants.find((v: any) => v.name === addObj.variant);
        if (mv) uPrice += mv.price_modifier;
      }
      grossAddons += uPrice * addObj.quantity;
    }
  }

  const totalPayable = grossTickets + grossAddons;

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!customerName.trim() || !customerEmail.trim()) {
      setErrorMessage("Please enter customer name and email address.");
      return;
    }

    if (!acceptTerms) {
      setErrorMessage("Please accept the terms and conditions to proceed.");
      return;
    }

    // Build items payload
    const itemsPayload: any[] = [];
    let attendeeIdx = 0;

    for (const [tId, qty] of Object.entries(cart?.selectedTickets || {})) {
      const count = qty as number;
      for (let i = 0; i < count; i++) {
        const att = attendeeList[attendeeIdx] || {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          answers: {}
        };

        itemsPayload.push({
          type: "TICKET",
          item_id: tId,
          quantity: 1,
          attendee_info: {
            name: att.name.trim() || customerName.trim(),
            email: att.email.trim() || customerEmail.trim(),
            phone: att.phone.trim() || customerPhone.trim(),
            answers: att.answers
          }
        });
        attendeeIdx++;
      }
    }

    // Addons payload
    for (const [aId, item] of Object.entries(cart?.selectedAddons || {})) {
      const addObj = item as any;
      itemsPayload.push({
        type: "ADDON",
        item_id: aId,
        variant_name: addObj.variant,
        quantity: addObj.quantity
      });
    }

    try {
      setSubmitting(true);
      const res = await eventService.initiateCheckout({
        event_id: event._id,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim().toLowerCase(),
        customer_phone: customerPhone.trim() || undefined,
        items: itemsPayload
      });

      if (!res.success) {
        setErrorMessage(res.message || "Checkout failed. Please check inventory.");
        setSubmitting(false);
        return;
      }

      // Free Order Flow
      if (res.is_free_order) {
        sessionStorage.removeItem("brandspyre_event_cart");
        navigate(`/tickets/confirmation/${res.order_id}`);
        return;
      }

      // Paid Razorpay Gateway Modal
      const razorpayKey =
        res.razorpay_key_id ||
        res.key_id ||
        (import.meta as any).env?.VITE_RAZORPAY_KEY_ID ||
        (window as any).RAZORPAY_KEY_ID ||
        "rzp_test_TQ4Ilwgyi4tFiz";

      const options = {
        key: razorpayKey,
        amount: Math.round(res.total_payable * 100),
        currency: res.currency || "INR",
        name: "Brandspyre Events",
        description: `Booking for ${event.title}`,
        order_id: res.razorpay_order?.id,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone
        },
        theme: {
          color: "#4f46e5"
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await eventService.verifyCheckoutPayment({
              order_id: res.order_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.success) {
              sessionStorage.removeItem("brandspyre_event_cart");
              navigate(`/tickets/confirmation/${res.order_id}`);
            } else {
              setErrorMessage(verifyRes.message || "Payment signature verification failed.");
              setSubmitting(false);
            }
          } catch (verErr: any) {
            setErrorMessage("Payment verification failed. Please contact support.");
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          }
        }
      };

      // Ensure Razorpay SDK is loaded
      const loaded = await loadRazorpayScript();
      if (!loaded || !(window as any).Razorpay) {
        setErrorMessage("Secure payment gateway could not be loaded. Please check your internet connection and try again.");
        setSubmitting(false);
        return;
      }

      // Open Razorpay Standard Checkout popup
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (failedRes: any) => {
        console.error("Razorpay payment failed:", failedRes.error);
        setErrorMessage(failedRes.error?.description || "Payment failed. Please try a different payment method.");
        setSubmitting(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error("Checkout submission error:", err);
      setErrorMessage(err.response?.data?.message || err.message || "Checkout failed.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          to={`/explore-events/${slugOrId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Event Details
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Checkout</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {event.title}
            </h1>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-slate-400">Total Amount</p>
            <p className="text-2xl font-black text-red-600 dark:text-red-400">
              {totalPayable === 0 ? "Free" : `₹${totalPayable.toLocaleString("en-IN")}`}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle size={16} /> {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmitCheckout} className="space-y-8">
          {/* STEP 1: Buyer Contact Information */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User size={18} className="text-red-600" /> Buyer Contact Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Full Name *</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <User size={16} className="text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-transparent text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email Address *</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <Mail size={16} className="text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-transparent text-sm focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Tickets and QR codes will be delivered to this email.</p>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Phone Number (Optional)</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 max-w-sm">
                  <Phone size={16} className="text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-transparent text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: Individual Attendee Details */}
          {attendeeList.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Ticket size={18} className="text-red-600" /> Attendee Information ({attendeeList.length} tickets)
                </h3>
              </div>

              <div className="space-y-4">
                {attendeeList.map((att, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-600 dark:text-red-400">
                        Ticket #{idx + 1}: {att.ticket_name}
                      </span>
                      {idx === 0 && customerName && (
                        <button
                          type="button"
                          onClick={() => handleCopyBuyerInfo(0)}
                          className="text-[11px] text-red-600 hover:text-red-700 hover:underline font-semibold"
                        >
                          Use my buyer details
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Attendee Name"
                          value={att.name}
                          onChange={(e) => updateAttendeeField(idx, "name", e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          placeholder="Attendee Email"
                          value={att.email}
                          onChange={(e) => updateAttendeeField(idx, "email", e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Dynamic Event Custom Registration Questions */}
                    {event.registration_questions && event.registration_questions.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
                        {event.registration_questions.map((q: any) => (
                          <div key={q.id} className="space-y-1">
                            <label className="text-[11px] font-medium text-slate-500">
                              {q.label} {q.is_required && "*"}
                            </label>
                            {q.field_type === "SELECT" ? (
                              <select
                                required={q.is_required}
                                value={att.answers?.[q.id] || ""}
                                onChange={(e) => updateAttendeeAnswer(idx, q.id, e.target.value)}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                              >
                                <option value="">Select option...</option>
                                {(q.options || []).map((opt: string, oIdx: number) => (
                                  <option key={oIdx} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                required={q.is_required}
                                value={att.answers?.[q.id] || ""}
                                onChange={(e) => updateAttendeeAnswer(idx, q.id, e.target.value)}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Terms & Payment Action */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setPolicyModal("terms");
                    }}
                    className="font-bold text-red-600 dark:text-red-400 hover:underline inline-block cursor-pointer"
                  >
                    Terms of Admission
                  </button>{" "}
                  and acknowledge the organizer's{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setPolicyModal("refund");
                    }}
                    className="font-bold text-red-600 dark:text-red-400 hover:underline inline-block cursor-pointer"
                  >
                    Refund Policy
                  </button>{" "}
                  for this event.
                </span>
              </label>

              {/* Quick Inline View Toggle */}
              <div className="pl-6">
                <button
                  type="button"
                  onClick={() => setShowInlinePolicies(!showInlinePolicies)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {showInlinePolicies ? (
                    <>
                      <ChevronUp size={13} /> Hide event policies & terms
                    </>
                  ) : (
                    <>
                      <ChevronDown size={13} /> Read event terms & refund policy details
                    </>
                  )}
                </button>

                {showInlinePolicies && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-4 text-xs">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck size={15} /> Refund & Cancellation Policy
                      </h4>
                      <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed pl-5 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        {event.refund_policy || "Refunds are subject to organizer approval. Please contact the organizer for cancellation requests."}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1.5 text-xs text-red-600 dark:text-red-400">
                        <FileText size={15} /> Terms & Admission Conditions
                      </h4>
                      <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed pl-5 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        {event.terms_and_conditions || "Attendees must present a valid government-issued ID and ticket QR code at entry. Badges must be worn at all times."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-lg shadow-red-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                "Processing Registration..."
              ) : totalPayable === 0 ? (
                "Confirm Free Registration"
              ) : (
                `Pay ₹${totalPayable.toLocaleString("en-IN")} & Complete Booking`
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Policy & Terms Modal */}
      {policyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPolicyModal("terms")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    policyModal === "terms"
                      ? "bg-red-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Terms of Admission
                </button>
                <button
                  type="button"
                  onClick={() => setPolicyModal("refund")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    policyModal === "refund"
                      ? "bg-red-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Refund Policy
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPolicyModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {policyModal === "terms" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
                    <FileText size={16} /> Terms & Conditions of Admission
                  </div>
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    {event.terms_and_conditions || "Attendees must present a valid government-issued ID and ticket QR code at entry. Badges must be worn at all times. Organizers reserve the right to refuse admission or remove attendees violating event decorum."}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <ShieldCheck size={16} /> Refund & Cancellation Policy
                  </div>
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    {event.refund_policy || "Cancellations requested at least 48 hours prior to event start are eligible for refunds according to organizer guidelines. Platform commission and payment processing fees may be non-refundable."}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setPolicyModal(null)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-red-600/20 transition-colors cursor-pointer"
              >
                Close & Return to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

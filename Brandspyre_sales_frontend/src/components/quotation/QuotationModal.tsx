import React, { useState } from 'react';
import { X, FileSpreadsheet, CheckCircle2, Building2, Send, Loader2, AlertCircle } from 'lucide-react';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ProductImage } from '../common/ProductImage';
import api from '../../services/api';

interface QuotationModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { buyer } = useAuth();

  const [requestedQuantity, setRequestedQuantity] = useState<number>(25);
  const [targetUnitPrice, setTargetUnitPrice] = useState<string>('');
  const [neededByDate, setNeededByDate] = useState<string>('');
  const [deliveryLocation, setDeliveryLocation] = useState<string>('');
  const [buyerName, setBuyerName] = useState<string>(buyer?.name || '');
  const [buyerEmail, setBuyerEmail] = useState<string>(buyer?.email || '');
  const [buyerPhone, setBuyerPhone] = useState<string>(buyer?.phone || '');
  const [buyerCompany, setBuyerCompany] = useState<string>(buyer?.company_name || '');
  const [notes, setNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<any | null>(null);

  if (!isOpen || !product) return null;

  const sellerName = product.tenant_id?.company_name || product.tenant_id?.name || 'Verified Vendor';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!requestedQuantity || requestedQuantity < 1) {
      setErrorMsg('Please specify a valid requested quantity.');
      return;
    }
    if (!buyerName || !buyerEmail || !buyerPhone) {
      setErrorMsg('Your Name, Email, and Phone number are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        product_id: product._id,
        requested_quantity: requestedQuantity,
        target_unit_price: targetUnitPrice ? Number(targetUnitPrice) : undefined,
        needed_by_date: neededByDate || undefined,
        delivery_location: deliveryLocation,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone,
        buyer_company: buyerCompany,
        notes
      };

      const res = await api.post('/quotations/request', payload);
      if (res.data?.success) {
        setSubmittedData(res.data.data);
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.data?.error || 'Failed to submit quotation enquiry.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit quotation enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedData(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 transition-opacity"
        onClick={handleReset}
      />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 my-8">
        {/* Fixed Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Request Purchase Quotation (RFQ)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Inquire wholesale price & custom delivery directly with the seller</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedData ? (
          /* Success Screen */
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h4 className="text-lg font-bold text-slate-900">Quotation Enquiry Submitted!</h4>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Your inquiry has been directly routed to <span className="font-bold text-slate-900">{sellerName}</span>.
              The business owner has received an alert in their business workspace.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-sm mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Quotation Enquiry #:</span>
                <span className="font-mono font-bold text-slate-900">{submittedData.enquiry_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Product:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[180px]">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Qty:</span>
                <span className="font-bold text-slate-900">{submittedData.requested_quantity} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Unit Price:</span>
                <span className="font-bold text-slate-900">
                  {submittedData.target_unit_price ? `₹${submittedData.target_unit_price}` : 'As Quoted by Seller'}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleReset}
                className="crm-btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* RFQ Submission Form */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Target Product Summary */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="w-14 h-14 rounded-md border border-slate-200 shrink-0 overflow-hidden bg-white">
                <ProductImage
                  src={product.image_url || product.images?.[0]}
                  alt={product.name}
                  iconSize="sm"
                  className="w-full h-full"
                  imgClassName="w-full h-full object-contain p-1"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 truncate">{product.name}</h4>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Sold by: <span className="font-semibold text-slate-700">{sellerName}</span>
                </p>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  Catalog Price: ₹{product.selling_price.toLocaleString()} / unit
                </p>
              </div>
            </div>

            {/* Quantity and Target Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Requested Quantity <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={requestedQuantity}
                  onChange={(e) => setRequestedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="crm-input font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Price / Unit (₹) <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  placeholder={`e.g. ${Math.round(product.selling_price * 0.9)}`}
                  value={targetUnitPrice}
                  onChange={(e) => setTargetUnitPrice(e.target.value)}
                  className="crm-input"
                />
              </div>
            </div>

            {/* Delivery Date & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required By Date
                </label>
                <input
                  type="date"
                  value={neededByDate}
                  onChange={(e) => setNeededByDate(e.target.value)}
                  className="crm-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery City / Pincode
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai 400001"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  className="crm-input"
                />
              </div>
            </div>

            {/* Buyer Contact Details */}
            <div className="border-t border-slate-100 pt-3">
              <h5 className="text-xs font-bold text-slate-800 mb-2">Your Contact Information</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="crm-input text-xs"
                    required
                  />
                </div>

                <div>
                  <input
                    type="email"
                    placeholder="Work / Personal Email *"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="crm-input text-xs"
                    required
                  />
                </div>

                <div>
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="crm-input text-xs"
                    required
                  />
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Company / Enterprise Name (Optional)"
                    value={buyerCompany}
                    onChange={(e) => setBuyerCompany(e.target.value)}
                    className="crm-input text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Custom Notes / Specs */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custom Specifications or Delivery Instructions
              </label>
              <textarea
                rows={2}
                placeholder="Mention specific packaging, quality requirements, sample requests, or commercial terms..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="crm-input h-auto py-2 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={handleReset}
                className="crm-btn-secondary"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="crm-btn-primary"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    <span>Routing to Seller...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1.5" />
                    <span>Send Purchase Quotation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default QuotationModal;

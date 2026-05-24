import { AppIcon } from "shared/ui/AppIcon";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import * as service from "../services/subscription.service";
import type { Plan } from "../services/subscription.service";

export function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan as Plan;

  const [file, setFile] = useState<File | null>(null);
  const [smsText, setSmsText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!plan) {
      navigate("/admin/subscription");
    }
  }, [plan, navigate]);

  if (!plan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !smsText) {
      alert("Please upload a screenshot or paste the SMS text.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await service.submitPaymentProof({
        plan_id: plan.id,
        transaction_id: smsText.slice(0, 50) || "FILE_" + (file?.name || Date.now()),
        amount: plan.price,
        notes: smsText,
        screenshot_url: file ? "https://placeholder.com/" + file.name : "",
      });

      if (res.ok) {
        alert("Payment proof submitted successfully! Super Admin will verify it shortly.");
        navigate("/admin/subscription");
      } else {
        alert(res.error?.message || "Failed to submit payment proof.");
      }
    } catch (err) {
      alert("An error occurred while submitting payment proof.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SchoolShell eyebrow="Subscription" title={`Upgrade to ${plan.display_name}`}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-10 text-white">
            <h2 className="text-3xl font-bold">Complete Your Payment</h2>
            <p className="text-blue-100 mt-2 text-lg">Follow the instructions below to activate your {plan.display_name}.</p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Payment Methods */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <AppIcon name="Landmark" className="text-blue-600" />
                    Payment Methods
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Alfalah Bank */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 relative overflow-hidden group hover:border-blue-300 transition-all shadow-sm">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center p-1 overflow-hidden">
                          <img 
                            src="https://logo.clearbit.com/bankalfalah.com" 
                            alt="Alfalah Bank" 
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://www.bankalfalah.com/favicon.ico";
                            }}
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">Alfalah Bank</h4>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Bank Transfer</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Account Name:</span>
                          <span className="font-bold text-gray-900">Ali Moavia</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Account Number:</span>
                          <span className="font-mono font-bold text-blue-600 text-base tracking-wider">59705002080213</span>
                        </div>
                      </div>
                    </div>

                    {/* Easypaisa */}
                    <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 relative overflow-hidden group hover:border-emerald-300 transition-all shadow-sm">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center p-2 text-emerald-600">
                          <AppIcon name="Wallet" size={36} className="font-bold" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">Easypaisa</h4>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Mobile Wallet</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Account Name:</span>
                          <span className="font-bold text-gray-900">Ali moavia</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Mobile Number:</span>
                          <span className="font-mono font-bold text-emerald-700 text-base tracking-wider">03064944326</span>
                        </div>
                      </div>
                    </div>

                    {/* Habib Metro Bank */}
                    <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 relative overflow-hidden group hover:border-blue-300 transition-all shadow-sm">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center p-1 overflow-hidden">
                          <img 
                            src="https://logo.clearbit.com/habibmetro.com" 
                            alt="Habib Metro Bank" 
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://www.habibmetro.com/favicon.ico";
                            }}
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">Habib Metro Bank</h4>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Bank Transfer</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Account Name:</span>
                          <span className="font-bold text-gray-900">Ali moavia</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Account Number:</span>
                          <span className="font-mono font-bold text-blue-700 text-base tracking-wider leading-none break-all">6984729308714105093</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                  <AppIcon name="Info" size={24} className="text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-900 mb-1">Payment Amount</p>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      Please transfer <span className="font-black text-amber-900">PKR {plan.price.toLocaleString()}</span> to any of the accounts above. Once done, submit the proof in the form.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submission Form */}
              <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                    <AppIcon name="CheckCircle" className="text-indigo-600" />
                    Submit Proof
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Upload Screenshot</label>
                    <div 
                      className={`border-3 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                        file ? "border-blue-500 bg-blue-50/50" : "border-gray-200 bg-white hover:border-blue-400 hover:bg-slate-50"
                      }`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
                      }}
                    >
                      <input 
                        type="file" 
                        id="ss-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) setFile(e.target.files[0]);
                        }}
                      />
                      <label htmlFor="ss-upload" className="cursor-pointer">
                        {file ? (
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                              <AppIcon name="CheckCircle2" size={36} className="text-blue-600" />
                            </div>
                            <p className="text-base font-bold text-blue-900 truncate max-w-[250px]">{file.name}</p>
                            <button 
                              type="button" 
                              onClick={(e) => { e.preventDefault(); setFile(null); }}
                              className="mt-3 text-sm text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
                            >
                              <AppIcon name="Trash2" size={14} />
                              Remove File
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                              <AppIcon name="CloudUpload" size={36} className="text-slate-400" />
                            </div>
                            <p className="text-base text-gray-700 font-bold">Click to upload or drag & drop</p>
                            <p className="text-xs text-gray-400 mt-2">PNG, JPG or PDF up to 10MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs font-black uppercase tracking-[0.3em]">
                      <span className="bg-slate-50/50 px-4 text-gray-400">OR</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="sms-text" className="block text-sm font-bold text-gray-700 mb-3">Paste Transaction SMS</label>
                    <textarea
                      id="sms-text"
                      rows={5}
                      className="w-full rounded-2xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm placeholder:text-gray-400 p-4 transition-all"
                      placeholder="Paste the SMS you received from your bank/wallet here..."
                      value={smsText}
                      onChange={(e) => setSmsText(e.target.value)}
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || (!file && !smsText)}
                      className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98] text-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <AppIcon name="Send" size={24} />
                          Submit Verification
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/admin/subscription")}
                      className="w-full mt-4 py-3 text-gray-500 font-bold hover:text-gray-700 transition-colors text-sm"
                    >
                      Cancel and Go Back
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SchoolShell>
  );
}

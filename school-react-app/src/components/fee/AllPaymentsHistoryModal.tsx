import { AppIcon } from "shared/ui/AppIcon";
import { useEffect, useState, useMemo } from "react";
import { serviceRequest } from "@/services/service-client";
import { Badge, Skeleton, DataState } from "@/components/ui";
import { exportFeeReceipt } from "@/utils/fee-receipt";
import { useSettings } from "@/modules/settings/hooks/useSettings";

interface AllPaymentsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaymentRecord {
  _id: string;
  receipt_no: string;
  student_id: string;
  class_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_no?: string;
  notes?: string;
}

interface StudentMapItem {
  id: string;
  name: string;
  rollNo: string;
  classId: string;
}

export function AllPaymentsHistoryModal({ isOpen, onClose }: AllPaymentsHistoryModalProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<string, StudentMapItem>>({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { state: settingsState } = useSettings();
  const settings = settingsState.data;

  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch all students to map IDs to Names and Roll Numbers
        // Limit 10000 ensures we load all student records in memory for quick mapping
        const studentsRes = await serviceRequest<any>(`/api/students?limit=10000`);
        const sMap: Record<string, StudentMapItem> = {};
        if (studentsRes.success) {
          const sItems = Array.isArray(studentsRes.data)
            ? studentsRes.data
            : Array.isArray(studentsRes.data?.items)
            ? studentsRes.data.items
            : [];
          sItems.forEach((s: any) => {
            sMap[s._id] = {
              id: s._id,
              name: `${s.first_name} ${s.last_name}`,
              rollNo: s.admission_no,
              classId: s.class_id,
            };
          });
        }
        setStudentsMap(sMap);

        // 2. Fetch Centralized Payments List
        const paymentsRes = await serviceRequest<any>(`/api/fees/payments?limit=500`);
        if (!paymentsRes.success) {
          throw new Error(paymentsRes.message || "Failed to load payment logs");
        }
        const payItems = Array.isArray(paymentsRes.data)
          ? paymentsRes.data
          : Array.isArray(paymentsRes.data?.items)
          ? paymentsRes.data.items
          : [];
        setPayments(payItems);
      } catch (err: any) {
        console.error("Error loading centralized payments:", err);
        setError(err.message || "Could not retrieve transaction logs");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOpen]);

  // Filter payments by search query (receipt number, student name, roll number, class)
  const filteredPayments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return payments;

    return payments.filter((p) => {
      const student = studentsMap[p.student_id];
      const receiptNo = (p.receipt_no || "").toLowerCase();
      const studentName = student ? student.name.toLowerCase() : "";
      const rollNo = student ? student.rollNo.toLowerCase() : "";
      const classId = (p.class_id || "").toLowerCase();
      const notes = (p.notes || "").toLowerCase();
      const method = (p.payment_method || "").toLowerCase();

      return (
        receiptNo.includes(q) ||
        studentName.includes(q) ||
        rollNo.includes(q) ||
        classId.includes(q) ||
        notes.includes(q) ||
        method.includes(q)
      );
    });
  }, [payments, studentsMap, searchQuery]);

  function handlePrintReceipt(payment: PaymentRecord) {
    const student = studentsMap[payment.student_id];
    exportFeeReceipt(
      {
        receipt_no: payment.receipt_no,
        date: new Date(payment.payment_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        amount: payment.amount,
        fee_type: "School Fee Payment",
        method: payment.payment_method,
        status: "paid",
      },
      {
        name: student ? student.name : "Unknown Student",
        className: student ? student.classId : payment.class_id || "N/A",
        rollNo: student ? student.rollNo : "N/A",
        academicYear: "",
      },
      {
        schoolName: settings?.academy_name || "Eduplexo School",
        logoUrl: settings?.logo_url || "/logo.jpeg",
        schoolAddress: [settings?.academy_address, settings?.academy_phone, settings?.academy_email]
          .filter(Boolean)
          .join(" · ") || undefined,
        principal: settings?.principal_name || "Principal",
        currency: "Rs.",
      }
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <AppIcon name="Receipt" size={20} />
            </div>
            <div>
              <h2 className="text-md font-black text-slate-800 tracking-tight leading-none">
                Centralized Fee History Log
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                Showing all student payment records and transactions
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl border border-slate-200/80 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            <AppIcon name="X" size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white">
          <div className="relative w-full">
            <AppIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by receipt no, student name, roll number, class or payment method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-semibold text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Logs Table Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full rounded-xl" />
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <DataState variant="error" title="Error retrieving transaction history" message={error} />
          ) : filteredPayments.length === 0 ? (
            <DataState variant="empty" title="No transaction records" message="No matching student payments were found in the history log." />
          ) : (
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Receipt No</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Student Details</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Class</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Date</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Method</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Amount</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((pay) => {
                    const student = studentsMap[pay.student_id];
                    return (
                      <tr key={pay._id} className="hover:bg-slate-50/30">
                        <td className="p-3 font-mono font-bold text-slate-800">
                          {pay.receipt_no}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-800">{student ? student.name : "Unknown Student"}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                            {student ? `Roll: ${student.rollNo}` : `ID: ${pay.student_id}`}
                          </p>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-[9px] font-extrabold uppercase px-2 py-0.5">
                            {student ? student.classId : pay.class_id || "N/A"}
                          </Badge>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">
                          {new Date(pay.payment_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="p-3 capitalize font-semibold text-slate-600">
                          {pay.payment_method}
                        </td>
                        <td className="p-3 font-black text-emerald-600">
                          Rs. {pay.amount.toLocaleString()}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handlePrintReceipt(pay)}
                            className="inline-flex h-7 px-3 rounded-lg border border-blue-200 bg-blue-50 text-[9px] font-black uppercase tracking-widest text-blue-700 hover:bg-blue-100 transition-all items-center gap-1 active:scale-95"
                            title="Print Receipt Voucher"
                          >
                            <AppIcon name="Print" size={12} />
                            Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

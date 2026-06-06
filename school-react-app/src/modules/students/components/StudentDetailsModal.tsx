import { AppIcon } from "shared/ui/AppIcon";
import { useEffect, useState, useMemo } from "react";
import { serviceRequest } from "@/services/service-client";
import { Badge, Skeleton, DataState } from "@/components/ui";
import { StudentRow } from "../types/student.types";

interface StudentDetailsModalProps {
  isOpen: boolean;
  studentId: string | null;
  onClose: () => void;
}

interface FeeInvoice {
  id: string;
  amount: number;
  paid: number;
  status: string;
  month: string;
  year: number;
  discount_amount?: number;
  components?: Array<{
    fee_type: string;
    amount: number;
    paid_amount: number;
  }>;
}

interface FeePayment {
  id: string;
  receipt_no: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_no?: string;
  notes?: string;
}

interface AttendanceRecord {
  _id: string;
  date: string;
  status: "present" | "absent" | "late" | "leave";
  note?: string;
}

export function StudentDetailsModal({ isOpen, studentId, onClose }: StudentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "fees" | "attendance">("profile");
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<StudentRow | null>(null);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !studentId) {
      setStudent(null);
      setInvoices([]);
      setPayments([]);
      setAttendance([]);
      setError(null);
      return;
    }

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch Student Profile
        const studentRes = await serviceRequest<StudentRow>(`/api/students/${studentId}`);
        if (!studentRes.success) {
          throw new Error(studentRes.message || "Failed to load student profile");
        }
        setStudent(studentRes.data);

        // 2. Fetch Fee Invoices
        const feesRes = await serviceRequest<any[]>(`/api/fees?student_id=${studentId}`);
        if (feesRes.success && Array.isArray(feesRes.data)) {
          setInvoices(feesRes.data);
        }

        // 3. Fetch Payments
        const paymentsRes = await serviceRequest<any>(`/api/fees/payments?student_id=${studentId}`);
        if (paymentsRes.success) {
          // If response is paginated (has items) or is direct array
          const paymentList = Array.isArray(paymentsRes.data)
            ? paymentsRes.data
            : Array.isArray(paymentsRes.data?.items)
            ? paymentsRes.data.items
            : [];
          setPayments(paymentList);
        }

        // 4. Fetch Attendance records
        const attendanceRes = await serviceRequest<AttendanceRecord[]>(`/api/attendance?student_id=${studentId}`);
        if (attendanceRes.success && Array.isArray(attendanceRes.data)) {
          setAttendance(attendanceRes.data);
        }
      } catch (err: any) {
        console.error("Error loading student details:", err);
        setError(err.message || "An error occurred while fetching student details");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOpen, studentId]);

  // Attendance metrics
  const attendanceMetrics = useMemo(() => {
    if (!attendance.length) return { present: 0, absent: 0, late: 0, leave: 0, percentage: 0 };
    let present = 0, absent = 0, late = 0, leave = 0;
    attendance.forEach((r) => {
      const status = r.status?.toLowerCase();
      if (status === "present") present++;
      else if (status === "absent") absent++;
      else if (status === "late") {
        late++;
        present++; // late counts as present
      } else if (status === "leave") leave++;
    });

    const activeDays = present + absent + late;
    const percentage = activeDays > 0 ? Math.round(( (present + late) / activeDays) * 100) : 100;
    return { present, absent, late, leave, percentage };
  }, [attendance]);

  // Fee metrics
  const feeMetrics = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paid || 0), 0);
    const balance = Math.max(0, totalInvoiced - totalPaid);
    return { totalInvoiced, totalPaid, balance };
  }, [invoices]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/25">
              {student ? `${student.first_name[0]}${student.last_name[0] || ""}`.toUpperCase() : <AppIcon name="User" size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">
                  {student ? `${student.first_name} ${student.last_name}` : "Student Details"}
                </h2>
                {student && (
                  <Badge variant={student.status === "active" ? "success" : "gray"} className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5">
                    {student.status}
                  </Badge>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {student ? `Roll: ${student.admission_no} • Class: ${student.class_id} (${student.section || "N/A"})` : "Loading information..."}
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

        {/* Tab Selection */}
        <div className="px-6 border-b border-slate-100 flex gap-4 bg-white">
          {(["profile", "fees", "attendance"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3.5 px-2 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all relative ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              {tab === "profile" && "Personal Profile"}
              {tab === "fees" && "Fee Records"}
              {tab === "attendance" && "Attendance History"}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3 rounded-lg" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          ) : error ? (
            <DataState variant="error" title="Unable to retrieve student profile" message={error} />
          ) : student ? (
            <>
              {/* PROFILE TAB */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Student Info Card */}
                    <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/30 flex flex-col justify-between">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        Academic Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                          <span className="text-slate-400">Class & Section</span>
                          <span className="font-bold text-slate-700">{student.class_id} - {student.section}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                          <span className="text-slate-400">Admission No / Roll</span>
                          <span className="font-bold font-mono text-slate-700">{student.admission_no}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Subjects Enrolled</span>
                          <span className="font-semibold text-slate-700">
                            {student.subjects && student.subjects.length > 0
                              ? student.subjects.join(", ")
                              : "All General Subjects"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Guardian Info Card */}
                    <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/30 flex flex-col justify-between">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        Guardian / Parent Info
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                          <span className="text-slate-400">Primary Contact Name</span>
                          <span className="font-bold text-slate-700">{student.guardian?.name}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                          <span className="text-slate-400">Mobile Phone</span>
                          <span className="font-bold text-slate-700">{student.guardian?.phone}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Email Address</span>
                          <span className="font-bold text-blue-600">{student.guardian?.email || "No email registered"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* FEES TAB */}
              {activeTab === "fees" && (
                <div className="space-y-6">
                  {/* Fee Summary Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Total Invoiced</p>
                      <h4 className="text-xl font-black text-blue-900 mt-1">Rs. {feeMetrics.totalInvoiced.toLocaleString()}</h4>
                    </div>
                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Total Paid</p>
                      <h4 className="text-xl font-black text-emerald-900 mt-1">Rs. {feeMetrics.totalPaid.toLocaleString()}</h4>
                    </div>
                    <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl">
                      <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Remaining Balance</p>
                      <h4 className="text-xl font-black text-rose-900 mt-1">Rs. {feeMetrics.balance.toLocaleString()}</h4>
                    </div>
                  </div>

                  {/* Monthly Invoices List */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Monthly Invoices
                    </h3>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Month</th>
                            <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Invoiced</th>
                            <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Discount</th>
                            <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Paid</th>
                            <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Remaining</th>
                            <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {invoices.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-slate-400 font-medium">
                                No fee invoices generated for this student.
                              </td>
                            </tr>
                          ) : (
                            invoices.map((inv) => {
                              const remaining = Math.max(0, inv.amount - inv.paid);
                              return (
                                <tr key={inv.id} className="hover:bg-slate-50/30">
                                  <td className="p-3 font-semibold text-slate-700 capitalize">
                                    {inv.month} {inv.year}
                                  </td>
                                  <td className="p-3 font-medium text-slate-700">Rs. {inv.amount.toLocaleString()}</td>
                                  <td className="p-3 text-amber-600 font-medium">
                                    Rs. {(inv.discount_amount || 0).toLocaleString()}
                                  </td>
                                  <td className="p-3 text-emerald-600 font-medium">Rs. {inv.paid.toLocaleString()}</td>
                                  <td className="p-3 font-bold text-slate-800">Rs. {remaining.toLocaleString()}</td>
                                  <td className="p-3">
                                    <Badge
                                      variant={
                                        inv.status === "paid"
                                          ? "success"
                                          : inv.status === "partial"
                                          ? "warning"
                                          : "error"
                                      }
                                      className="text-[9px] font-extrabold uppercase px-2 py-0.5"
                                    >
                                      {inv.status}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Payment History List */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Payment Logs (Centralized Receipts)
                    </h3>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Date</th>
                            <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Receipt No</th>
                            <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Method</th>
                            <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Amount</th>
                            <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {payments.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-400 font-medium">
                                No payment records found.
                              </td>
                            </tr>
                          ) : (
                            payments.map((pay) => (
                              <tr key={pay.id} className="hover:bg-slate-50/30">
                                <td className="p-3 text-slate-600">
                                  {new Date(pay.payment_date).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </td>
                                <td className="p-3 font-mono font-bold text-slate-800">{pay.receipt_no}</td>
                                <td className="p-3 capitalize font-medium text-slate-600">{pay.payment_method}</td>
                                <td className="p-3 font-bold text-emerald-600">Rs. {pay.amount.toLocaleString()}</td>
                                <td className="p-3 text-slate-400 italic max-w-xs truncate" title={pay.notes}>
                                  {pay.notes || "—"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ATTENDANCE TAB */}
              {activeTab === "attendance" && (
                <div className="space-y-6">
                  {/* Attendance Stats Cards */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex flex-col justify-between">
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Attendance Rate</p>
                      <h4 className="text-xl font-black text-indigo-900 mt-1">{attendanceMetrics.percentage}%</h4>
                    </div>
                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex flex-col justify-between">
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Days Present</p>
                      <h4 className="text-xl font-black text-emerald-900 mt-1">{attendanceMetrics.present} days</h4>
                    </div>
                    <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl flex flex-col justify-between">
                      <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Days Absent</p>
                      <h4 className="text-xl font-black text-rose-900 mt-1">{attendanceMetrics.absent} days</h4>
                    </div>
                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex flex-col justify-between">
                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Leaves / Off</p>
                      <h4 className="text-xl font-black text-amber-900 mt-1">{attendanceMetrics.leave} days</h4>
                    </div>
                  </div>

                  {/* Attendance History Log */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Attendance History Log
                    </h3>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white max-h-[350px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10">
                          <tr>
                            <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Date</th>
                            <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Attendance Status</th>
                            <th className="p-3 font-bold uppercase tracking-wider text-slate-500 text-[10px]">Note / Remark</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {attendance.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="p-6 text-center text-slate-400 font-medium">
                                No attendance records found for this student.
                              </td>
                            </tr>
                          ) : (
                            [...attendance]
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((rec) => (
                                <tr key={rec._id} className="hover:bg-slate-50/30">
                                  <td className="p-3 font-semibold text-slate-700">
                                    {new Date(rec.date).toLocaleDateString("en-US", {
                                      weekday: "short",
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </td>
                                  <td className="p-3">
                                    <Badge
                                      variant={
                                        rec.status?.toLowerCase() === "present"
                                          ? "success"
                                          : rec.status?.toLowerCase() === "absent"
                                          ? "error"
                                          : rec.status?.toLowerCase() === "late"
                                          ? "warning"
                                          : "gray"
                                      }
                                      className="text-[9px] font-extrabold uppercase px-2.5 py-0.5"
                                    >
                                      {rec.status}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-slate-400 italic">
                                    {rec.note || "—"}
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <DataState variant="empty" title="Profile not found" message="No details are available for this student." />
          )}
        </div>
      </div>
    </div>
  );
}

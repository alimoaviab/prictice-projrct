import React from "react";

export interface StudentData {
  id: string;
  studentName: string;
  fatherName?: string;
  rollNumber?: string | number;
  className?: string;
  section?: string;
  phoneNumber?: string;
  address?: string;
  feeMonth?: string;
  dueDate?: string;
  issueDate?: string;
  status: "PAID" | "UNPAID" | "PARTIAL";
  
  // Fee Breakdown
  admissionFee: number;
  monthlyFee: number;
  examFee: number;
  transportFee: number;
  fine: number;
  previousBalance: number;
  totalAmount: number;
  paidAmount: number;
  remainingDue: number;
  
  notes?: string;
  copyLabel?: string;
}

interface Props {
  student: StudentData;
  schoolName?: string;
  schoolLogoUrl?: string;
  schoolAddress?: string;
  scale?: number;
  showLogo?: boolean;
  showNotes?: boolean;
  showSignature?: boolean;
}

const SchoolCrestSVG = () => (
  <svg className="w-10 h-10 text-blue-700 shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 4L8 14v20c0 14.8 10.4 23.6 24 26 13.6-2.4 24-11.2 24-26V14L32 4z" fill="#1e3a8a" />
    <path d="M32 8L12 16.3v17.7c0 12.3 8.3 19.8 20 22 11.7-2.2 20-9.7 20-22V16.3L32 8z" fill="#ffffff" />
    <path d="M32 14c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm0 4v4h-4v2h4v4h2v-4h4v-2h-4v-4h-2z" fill="#1e3a8a" />
    <path d="M22 38h20v4H22z" fill="#1e3a8a" />
    <path d="M26 44h12v3H26z" fill="#1e3a8a" />
  </svg>
);

const BarcodeSVG = () => (
  <svg className="w-32 h-7 text-slate-800" viewBox="0 0 120 30" fill="currentColor">
    <rect x="0" y="0" width="3" height="30" />
    <rect x="5" y="0" width="1" height="30" />
    <rect x="8" y="0" width="2" height="30" />
    <rect x="12" y="0" width="4" height="30" />
    <rect x="18" y="0" width="1" height="30" />
    <rect x="21" y="0" width="3" height="30" />
    <rect x="26" y="0" width="2" height="30" />
    <rect x="30" y="0" width="1" height="30" />
    <rect x="33" y="0" width="4" height="30" />
    <rect x="39" y="0" width="2" height="30" />
    <rect x="43" y="0" width="1" height="30" />
    <rect x="46" y="0" width="3" height="30" />
    <rect x="51" y="0" width="2" height="30" />
    <rect x="55" y="0" width="4" height="30" />
    <rect x="61" y="0" width="1" height="30" />
    <rect x="64" y="0" width="3" height="30" />
    <rect x="69" y="0" width="2" height="30" />
    <rect x="73" y="0" width="1" height="30" />
    <rect x="76" y="0" width="4" height="30" />
    <rect x="82" y="0" width="2" height="30" />
    <rect x="86" y="0" width="1" height="30" />
    <rect x="89" y="0" width="3" height="30" />
    <rect x="94" y="0" width="2" height="30" />
    <rect x="98" y="0" width="4" height="30" />
    <rect x="104" y="0" width="1" height="30" />
    <rect x="107" y="0" width="3" height="30" />
    <rect x="112" y="0" width="2" height="30" />
    <rect x="116" y="0" width="4" height="30" />
  </svg>
);

const QRCodeSVG = () => (
  <svg className="w-12 h-12 text-slate-800 shrink-0" viewBox="0 0 29 29" fill="currentColor">
    <rect x="0" y="0" width="7" height="7" />
    <rect x="1" y="1" width="5" height="5" fill="white" />
    <rect x="2" y="2" width="3" height="3" />
    
    <rect x="22" y="0" width="7" height="7" />
    <rect x="23" y="1" width="5" height="5" fill="white" />
    <rect x="24" y="2" width="3" height="3" />
    
    <rect x="0" y="22" width="7" height="7" />
    <rect x="1" y="23" width="5" height="5" fill="white" />
    <rect x="2" y="24" width="3" height="3" />
    
    <rect x="9" y="1" width="2" height="2" />
    <rect x="13" y="0" width="1" height="3" />
    <rect x="16" y="2" width="3" height="1" />
    <rect x="20" y="1" width="1" height="4" />
    
    <rect x="9" y="6" width="3" height="1" />
    <rect x="14" y="5" width="2" height="3" />
    <rect x="18" y="7" width="1" height="1" />
    
    <rect x="1" y="9" width="3" height="2" />
    <rect x="6" y="10" width="2" height="1" />
    <rect x="9" y="9" width="1" height="4" />
    <rect x="12" y="11" width="4" height="2" />
    <rect x="18" y="10" width="2" height="3" />
    <rect x="21" y="9" width="3" height="1" />
    <rect x="26" y="10" width="2" height="2" />
    
    <rect x="0" y="14" width="2" height="1" />
    <rect x="3" y="15" width="4" height="2" />
    <rect x="9" y="15" width="2" height="1" />
    <rect x="15" y="14" width="2" height="4" />
    <rect x="19" y="16" width="1" height="1" />
    <rect x="22" y="14" width="3" height="2" />
    <rect x="27" y="15" width="1" height="3" />
    
    <rect x="1" y="18" width="1" height="3" />
    <rect x="4" y="19" width="2" height="1" />
    <rect x="8" y="18" width="4" height="4" fill="none" stroke="currentColor" strokeWidth="1" />
    <rect x="10" y="20" width="1" height="1" />
    <rect x="13" y="20" width="2" height="1" />
    <rect x="21" y="18" width="4" height="2" />
    <rect x="26" y="19" width="2" height="1" />
    
    <rect x="9" y="23" width="2" height="2" />
    <rect x="13" y="22" width="1" height="4" />
    <rect x="16" y="24" width="3" height="2" />
    <rect x="20" y="23" width="1" height="1" />
    <rect x="23" y="22" width="4" height="2" />
  </svg>
);

export const VoucherCard: React.FC<Props> = ({
  student,
  schoolName = "Highlands International School",
  schoolLogoUrl,
  schoolAddress = "Sector F-10, Islamabad, Pakistan",
  scale = 1,
  showLogo = true,
  showNotes = true,
  showSignature = true,
}) => {
  const getStatusBadge = (status: "PAID" | "UNPAID" | "PARTIAL") => {
    switch (status) {
      case "PAID":
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200">
            PAID
          </span>
        );
      case "UNPAID":
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider border bg-rose-50 text-rose-700 border-rose-200">
            UNPAID
          </span>
        );
      case "PARTIAL":
        return (
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider border bg-amber-50 text-amber-700 border-amber-200">
            PARTIAL
          </span>
        );
    }
  };

  return (
    <div
      className="voucher-card bg-white border border-slate-300 rounded-xl p-4 text-slate-900 shadow-sm print:shadow-none print:border-slate-400 flex flex-col justify-between h-full relative overflow-hidden"
      style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
    >
      {/* Top Banner Accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-700 print:bg-slate-700" />

      {/* Header Block */}
      <div className="border-b border-slate-200 pb-2 mb-2 pt-1 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {showLogo && <SchoolCrestSVG />}
          <div className="min-w-0">
            <h3 className="text-xs font-black text-slate-950 uppercase tracking-tight truncate">
              {schoolName}
            </h3>
            <p className="text-[9px] text-slate-500 leading-tight truncate">
              {schoolAddress}
            </p>
            {student.phoneNumber && (
              <p className="text-[9px] text-slate-400 leading-none">
                Tel: {student.phoneNumber}
              </p>
            )}
          </div>
        </div>

        {/* Copy Label & Invoice No */}
        <div className="text-right shrink-0">
          <div className="inline-flex items-center gap-1.5 mb-0.5">
            {getStatusBadge(student.status)}
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black tracking-wider rounded">
              {student.copyLabel || "STUDENT COPY"}
            </span>
          </div>
          <p className="text-[9px] font-bold text-slate-500 uppercase">
            Voucher No: <span className="font-mono text-slate-800 text-[10px]">VCHR-{student.id}</span>
          </p>
          <p className="text-[9px] text-slate-400 leading-none">
            Month: <span className="font-semibold text-slate-700">{student.feeMonth || "May 2026"}</span>
          </p>
        </div>
      </div>

      {/* Student Details Grid */}
      <div className="bg-slate-50 rounded-lg p-2 mb-2 grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1.5 text-[10px] border border-slate-100">
        <div>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Student Name</span>
          <span className="font-black text-slate-900 truncate block">{student.studentName}</span>
        </div>
        <div>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Father Name</span>
          <span className="font-bold text-slate-800 truncate block">{student.fatherName || "—"}</span>
        </div>
        <div>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">ID / Roll No</span>
          <span className="font-mono font-bold text-slate-800 block">{student.rollNumber || "—"}</span>
        </div>
        <div>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Class & Section</span>
          <span className="font-bold text-slate-800 block">
            {student.className || "—"} - {student.section || "—"}
          </span>
        </div>
        {student.address && (
          <div className="col-span-2">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Address</span>
            <span className="font-medium text-slate-600 truncate block">{student.address}</span>
          </div>
        )}
        <div>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Issue Date</span>
          <span className="font-bold text-slate-700 block">{student.issueDate || "—"}</span>
        </div>
        <div>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Due Date</span>
          <span className="font-black text-rose-700 block">{student.dueDate || "—"}</span>
        </div>
      </div>

      {/* Fee Breakdown Table */}
      <div className="overflow-hidden border border-slate-200 rounded-lg mb-2">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              <th className="text-left py-1.5 px-2 font-bold text-slate-700 uppercase tracking-wider">Fee Description</th>
              <th className="text-right py-1.5 px-2 font-bold text-slate-700 uppercase tracking-wider">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {student.admissionFee > 0 && (
              <tr>
                <td className="py-1 px-2 text-slate-600">Admission Fee</td>
                <td className="py-1 px-2 text-right text-slate-900 font-medium">{student.admissionFee.toLocaleString()}</td>
              </tr>
            )}
            <tr>
              <td className="py-1 px-2 text-slate-600">Monthly Tuition Fee</td>
              <td className="py-1 px-2 text-right text-slate-900 font-medium">{student.monthlyFee.toLocaleString()}</td>
            </tr>
            {student.examFee > 0 && (
              <tr>
                <td className="py-1 px-2 text-slate-600">Examination Fee</td>
                <td className="py-1 px-2 text-right text-slate-900 font-medium">{student.examFee.toLocaleString()}</td>
              </tr>
            )}
            {student.transportFee > 0 && (
              <tr>
                <td className="py-1 px-2 text-slate-600">Transport Facility Fee</td>
                <td className="py-1 px-2 text-right text-slate-900 font-medium">{student.transportFee.toLocaleString()}</td>
              </tr>
            )}
            {student.fine > 0 && (
              <tr>
                <td className="py-1 px-2 text-slate-600">Late Payment Fine / Arrears</td>
                <td className="py-1 px-2 text-right text-rose-600 font-semibold">{student.fine.toLocaleString()}</td>
              </tr>
            )}
            {student.previousBalance > 0 && (
              <tr>
                <td className="py-1 px-2 text-slate-600">Previous Outstanding Balance</td>
                <td className="py-1 px-2 text-right text-slate-900 font-medium">{student.previousBalance.toLocaleString()}</td>
              </tr>
            )}
            {/* Total Row */}
            <tr className="bg-slate-50 font-bold border-t border-slate-200">
              <td className="py-1 px-2 text-slate-800">Total Payable Amount</td>
              <td className="py-1 px-2 text-right text-slate-950 font-black">{student.totalAmount.toLocaleString()}</td>
            </tr>
            {student.paidAmount > 0 && (
              <tr className="text-emerald-700">
                <td className="py-1 px-2">Amount Paid (To Date)</td>
                <td className="py-1 px-2 text-right font-bold">-{student.paidAmount.toLocaleString()}</td>
              </tr>
            )}
            {/* Remaining Due Row */}
            <tr className="bg-blue-50/50 print:bg-slate-100 border-t border-slate-200 font-black">
              <td className="py-1.5 px-2 text-blue-900 print:text-slate-900">Remaining Balance Due</td>
              <td className={`py-1.5 px-2 text-right text-[11px] ${student.remainingDue > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                PKR {student.remainingDue.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Barcode & QR Code Section */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <BarcodeSVG />
        <QRCodeSVG />
      </div>

      {/* Notes / Instructions */}
      {showNotes && (
        <div className="text-[8px] leading-relaxed text-slate-500 border-t border-slate-100 pt-1.5 mb-2.5">
          <p className="font-bold text-slate-600">Important Instructions:</p>
          <p>{student.notes || "Please pay before due date to avoid late fee. Check cleared at designated branches only."}</p>
        </div>
      )}

      {/* Signature & Stamp Row */}
      <div className="flex items-end justify-between gap-4 pt-1.5 mt-auto">
        <div className="text-center w-28 shrink-0">
          <div className="h-6 border-b border-dashed border-slate-400" />
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mt-1">Parent Signature</span>
        </div>

        {/* School Stamp Placeholder */}
        <div className="h-10 w-10 border border-dashed border-slate-300 rounded-full flex items-center justify-center shrink-0 text-slate-300 font-bold text-[7px] text-center p-0.5 select-none pointer-events-none">
          OFFICIAL STAMP
        </div>

        <div className="text-center w-32 shrink-0">
          {showSignature && (
            <>
              <div className="h-6 border-b border-dashed border-slate-400" />
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mt-1">Authorized Stamp</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoucherCard;

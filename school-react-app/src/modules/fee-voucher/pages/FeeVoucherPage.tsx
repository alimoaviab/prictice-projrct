import { AppIcon } from "shared/ui/AppIcon";
import React, { useRef, useState } from "react";
import VoucherGrid from "../components/VoucherGrid";
import type { StudentData } from "../components/VoucherCard";
import { useSettings } from "@/modules/settings/hooks/useSettings";

export const FeeVoucherPage: React.FC = () => {
  const { state: settingsState } = useSettings();
  
  // Custom interactive states
  const [voucherCount, setVoucherCount] = useState<number>(4); // Default to 4 vouchers per page
  const [multiMode, setMultiMode] = useState<boolean>(false); // Default to Single Student Copies Mode
  const [scale, setScale] = useState<number>(1.0);
  const [showLogo, setShowLogo] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [showSignature, setShowSignature] = useState(true);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const settings = settingsState.data;
  const schoolName = settings?.academy_name || "Highlands International School";
  const schoolLogoUrl = settings?.logo_url || "/logo.jpeg";
  const schoolAddress = [settings?.academy_address, settings?.academy_phone, settings?.academy_email].filter(Boolean).join(" · ") || "Official Fee Document";

  // Production-grade rich mock data for Pakistan School Dues
  const students: StudentData[] = [
    {
      id: "10294",
      studentName: "Ali Khan",
      fatherName: "Ahmed Khan",
      rollNumber: "STD-2026-051",
      className: "Class 5",
      section: "Section A",
      phoneNumber: "+92 300 1234567",
      address: "House 24-B, Sector F-10/2, Islamabad, Pakistan",
      feeMonth: "May 2026",
      issueDate: "2026-05-19",
      dueDate: "2026-06-05",
      status: "UNPAID",
      admissionFee: 0,
      monthlyFee: 4500,
      examFee: 500,
      transportFee: 1200,
      fine: 150,
      previousBalance: 3000,
      totalAmount: 9350,
      paidAmount: 0,
      remainingDue: 9350,
      notes: "Please pay before due date at any designated bank branch to avoid an additional late fee of PKR 500.",
    },
    {
      id: "10295",
      studentName: "Sara Iqbal",
      fatherName: "Ilyas Iqbal",
      rollNumber: "STD-2026-083",
      className: "Class 6",
      section: "Section B",
      phoneNumber: "+92 321 9876543",
      address: "Flat 4, Khyber Plaza, G-9 Markaz, Islamabad, Pakistan",
      feeMonth: "May 2026",
      issueDate: "2026-05-19",
      dueDate: "2026-06-05",
      status: "PAID",
      admissionFee: 15000,
      monthlyFee: 5000,
      examFee: 500,
      transportFee: 0,
      fine: 0,
      previousBalance: 0,
      totalAmount: 20500,
      paidAmount: 20500,
      remainingDue: 0,
      notes: "Fee paid successfully. Thank you for your timely contribution.",
    },
    {
      id: "10296",
      studentName: "Zayd Malik",
      fatherName: "Haris Malik",
      rollNumber: "STD-2026-112",
      className: "Class 8",
      section: "Section C",
      phoneNumber: "+92 312 4567890",
      address: "Street 8, Sector H-13, Islamabad, Pakistan",
      feeMonth: "May 2026",
      issueDate: "2026-05-19",
      dueDate: "2026-06-05",
      status: "PARTIAL",
      admissionFee: 0,
      monthlyFee: 5500,
      examFee: 500,
      transportFee: 1500,
      fine: 0,
      previousBalance: 0,
      totalAmount: 7500,
      paidAmount: 4000,
      remainingDue: 3500,
      notes: "Partial payment received. Remaining amount must be cleared before the extended due date.",
    },
    {
      id: "10297",
      studentName: "Ayesha Noor",
      fatherName: "Noor Muhammad",
      rollNumber: "STD-2026-044",
      className: "Class 10",
      section: "Section A",
      phoneNumber: "+92 333 7654321",
      address: "House 102, Street 3, G-11/1, Islamabad, Pakistan",
      feeMonth: "May 2026",
      issueDate: "2026-05-19",
      dueDate: "2026-06-05",
      status: "UNPAID",
      admissionFee: 0,
      monthlyFee: 6000,
      examFee: 500,
      transportFee: 1500,
      fine: 350,
      previousBalance: 1500,
      totalAmount: 9850,
      paidAmount: 0,
      remainingDue: 9850,
      notes: "Arrears are added from the previous month. Please clear all dues immediately to prevent suspension of transport services.",
    }
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    try {
      // Dynamic import of html2pdf.js
      const html2pdf = (await import('html2pdf.js')).default;
      const element = previewRef.current;
      const opt = {
        margin: 6,
        filename: `fee-voucher-${multiMode ? 'batch' : students[0].studentName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: (voucherCount === 2 ? 'landscape' : 'portrait') as "portrait" | "landscape"
        }
      };
      html2pdf().from(element).set(opt).save();
    } catch (err) {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 no-print">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Glowing Gradient Header */}
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-800 to-blue-900 p-6 sm:p-8 text-white shadow-xl overflow-hidden">
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none select-none">
            <AppIcon name="CreditCard" size={180} className="absolute right-[-20px] bottom-[-40px]" />
          </div>
          <div className="relative z-10 space-y-2">
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-blue-200 border border-white/5">
              Billing & Invoicing
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
              School Fee Voucher Module
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl font-medium">
              Create premium, official, and print-optimized fee bills in single copies or multi-student batches. Fully optimized for A4 paper.
            </p>
          </div>
        </div>

        {/* Premium Interactive Dashboard Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Voucher Count Dropdown */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Vouchers Per Page
              </label>
              <div className="relative">
                <select
                  value={voucherCount}
                  onChange={(e) => setVoucherCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all appearance-none cursor-pointer"
                >
                  <option value={1}>1 Voucher (Individual A4 Portrait)</option>
                  <option value={2}>2 Vouchers (Side-by-Side Landscape Split)</option>
                  <option value={4}>4 Vouchers (A4 Portrait 2x2 Grid)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <AppIcon name="ChevronsUpDown" size={18} />
                </div>
              </div>
            </div>

            {/* Print Mode Switcher */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Print Content Mode
              </label>
              <div className="relative">
                <select
                  value={multiMode ? "multi" : "single"}
                  onChange={(e) => setMultiMode(e.target.value === "multi")}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all appearance-none cursor-pointer"
                >
                  <option value="single">Single Student (Student/Bank/School Copies)</option>
                  <option value="multi">Multiple Students (Batch Class Printing)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <AppIcon name="ChevronsUpDown" size={18} />
                </div>
              </div>
            </div>

            {/* Dynamic Scale Control */}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 flex justify-between">
                <span>Print Scale Adjust</span>
                <span className="text-blue-600 font-black">{Math.round(scale * 100)}%</span>
              </label>
              <div className="flex items-center gap-3 pt-1.5">
                <input
                  type="range"
                  min="0.5"
                  max="1.2"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

          </div>

          {/* Quick Option Toggles */}
          <div className="border-t border-slate-100 pt-5 flex flex-wrap items-center gap-x-8 gap-y-4">
            
            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showLogo}
                onChange={(e) => setShowLogo(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              Show School Crest
            </label>

            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showNotes}
                onChange={(e) => setShowNotes(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              Show Instructions & Notes
            </label>

            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showSignature}
                onChange={(e) => setShowSignature(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              Show Authorized Signature
            </label>

            {/* Print & PDF Action Buttons */}
            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
              >
                <AppIcon name="Download" size={16} />
                Download PDF
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-md"
              >
                <AppIcon name="Printer" size={16} />
                Print Vouchers
              </button>
            </div>

          </div>
        </div>

        {/* Voucher Printing A4 Preview Area */}
        <div className="bg-slate-200/50 rounded-3xl border border-slate-300 p-8 shadow-inner overflow-x-auto flex justify-center">
          <div
            ref={previewRef}
            className="print-area bg-white border border-slate-300 shadow-2xl p-6 min-w-[794px] max-w-[1123px] overflow-hidden"
            style={{
              width: voucherCount === 2 ? "1123px" : "794px",
              minHeight: voucherCount === 2 ? "794px" : "1123px",
            }}
          >
            <VoucherGrid
              students={students}
              perPage={voucherCount}
              scale={scale}
              schoolName={schoolName}
              schoolLogoUrl={schoolLogoUrl}
              schoolAddress={schoolAddress}
              showLogo={showLogo}
              showNotes={showNotes}
              showSignature={showSignature}
              multiMode={multiMode}
            />
          </div>
        </div>

      </div>

      {/* Screen View Print-Only Hide Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #ffffff !important;
          }
          .print-area {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FeeVoucherPage;

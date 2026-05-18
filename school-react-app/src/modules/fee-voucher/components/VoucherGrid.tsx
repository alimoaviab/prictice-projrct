import React from "react";
import VoucherCard, { StudentData } from "./VoucherCard";

interface Props {
  students: StudentData[];
  perPage: number; // 1, 2, or 4 vouchers per page
  scale: number;
  schoolName?: string;
  schoolLogoUrl?: string;
  schoolAddress?: string;
  showLogo?: boolean;
  showNotes?: boolean;
  showSignature?: boolean;
  multiMode?: boolean; // false = duplicate copies for same student, true = multiple students
}

export const VoucherGrid: React.FC<Props> = ({
  students,
  perPage,
  scale,
  schoolName = "Highlands International School",
  schoolLogoUrl,
  schoolAddress = "Sector F-10, Islamabad, Pakistan",
  showLogo = true,
  showNotes = true,
  showSignature = true,
  multiMode = false,
}) => {
  // Build the list of vouchers to render on this page
  const items: StudentData[] = [];
  const copyLabels = ["STUDENT COPY", "BANK COPY", "SCHOOL COPY", "OFFICE COPY"];

  if (multiMode) {
    // Multi student mode: render different students
    for (let i = 0; i < perPage; i++) {
      const student = students[i % students.length];
      if (student) {
        items.push({
          ...student,
          copyLabel: student.copyLabel || copyLabels[i % copyLabels.length],
        });
      }
    }
  } else {
    // Single student mode: render duplicate copies of the first student
    const s = students[0];
    if (s) {
      for (let i = 0; i < perPage; i++) {
        items.push({
          ...s,
          copyLabel: copyLabels[i % copyLabels.length],
        });
      }
    }
  }

  // Generate dynamic CSS overrides for printing
  const getPagePrintStyle = () => {
    if (perPage === 2) {
      return `
        @media print {
          @page {
            size: A4 landscape;
            margin: 4mm 6mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-area {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
          }
          .voucher-card {
            border: 1.5px solid #64748b !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            padding: 12px !important;
          }
        }
      `;
    }
    // 1 or 4 mode (portrait)
    return `
      @media print {
        @page {
          size: A4 portrait;
          margin: 4mm 6mm;
        }
        body {
          background: #ffffff !important;
          color: #000000 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .print-area {
          background: #ffffff !important;
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
        }
        .voucher-card {
          border: 1.5px solid #64748b !important;
          border-radius: 8px !important;
          box-shadow: none !important;
          padding: 12px !important;
        }
      }
    `;
  };

  // Outer container alignment and classes based on voucher count
  const getContainerClasses = () => {
    if (perPage === 1) {
      return "max-w-2xl mx-auto py-8 px-4";
    }
    if (perPage === 2) {
      return "w-full max-w-7xl mx-auto py-4 px-2 grid grid-cols-2 gap-8 relative";
    }
    // perPage === 4
    return "w-full max-w-7xl mx-auto py-4 px-2 grid grid-cols-2 grid-rows-2 gap-x-8 gap-y-6 relative";
  };

  return (
    <div className={`voucher-grid-wrapper relative bg-white print:bg-white`}>
      {/* Inject print-specific page setup style overrides */}
      <style dangerouslySetInnerHTML={{ __html: getPagePrintStyle() }} />

      <div className={getContainerClasses()}>
        {/* Render Cutting Guides in 2 and 4 modes */}
        {perPage === 2 && (
          <div className="absolute left-1/2 top-0 bottom-0 w-0 border-l-2 border-dashed border-slate-300 transform -translate-x-1/2 pointer-events-none select-none no-print" />
        )}
        {perPage === 4 && (
          <>
            <div className="absolute left-1/2 top-0 bottom-0 w-0 border-l-2 border-dashed border-slate-300 transform -translate-x-1/2 pointer-events-none select-none no-print" />
            <div className="absolute top-1/2 left-0 right-0 h-0 border-t-2 border-dashed border-slate-300 transform -translate-y-1/2 pointer-events-none select-none no-print" />
          </>
        )}

        {items.map((st, i) => (
          <div
            key={i}
            className={`break-inside-avoid ${
              perPage === 4 ? "p-1 scale-95 origin-top-left" : ""
            }`}
          >
            <VoucherCard
              student={st}
              schoolName={schoolName}
              schoolLogoUrl={schoolLogoUrl}
              schoolAddress={schoolAddress}
              scale={scale}
              showLogo={showLogo}
              showNotes={showNotes}
              showSignature={showSignature}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoucherGrid;

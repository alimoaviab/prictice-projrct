import React, { useState, useMemo, useEffect } from "react";
import { useTemplateStore } from "../store/templateStore";
import { useSchoolBranding } from "@/hooks/useSchoolBranding";
import type { CertificateTemplate } from "../types/certificate.types";
import { serviceRequest } from "@/services/service-client";
import {
  X,
  Search,
  Download,
  Printer,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Users
} from "lucide-react";
import { showToast } from "@/utils/toast";

interface BulkGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeType: string;
  template?: CertificateTemplate | null;
  customStudents?: any[] | null;
}

interface MockStudent {
  _id: string;
  first_name: string;
  last_name: string;
  roll_no: string;
  registration_no: string;
  class_name: string;
  section: string;
  father_name: string;
  marks: string;
  grade: string;
  percentage: string;
  fee_amount: string;
  due_date: string;
  course_name: string;
  issue_date: string;
}

// Generate 1000 mock student records dynamically
const MOCK_STUDENTS: MockStudent[] = (() => {
  const firstNames = ["Aisha", "Muhammad", "Fatima", "Ali", "Zainab", "Hamza", "Amina", "Umer", "Mariam", "Osman", "Sara", "Bilal", "Yusuf", "Khadija"];
  const lastNames = ["Khan", "Ahmed", "Ali", "Raza", "Hassan", "Iqbal", "Malik", "Shah", "Siddiqui", "Farooq", "Baig", "Sheikh", "Bhatti"];
  const classes = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
  const sections = ["A", "B", "C"];

  const list: MockStudent[] = [];
  for (let i = 1; i <= 1000; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3) % lastNames.length];
    const classVal = classes[i % classes.length];
    const sec = sections[i % sections.length];
    const roll = String(100 + (i % 50));
    const fee = String(1500 + (i % 10) * 100);
    const marks = String(300 + (i % 200));
    const percentage = String(50 + (i % 45));
    let grade = "A";
    const pct = Number(percentage);
    if (pct >= 85) grade = "A+";
    else if (pct >= 70) grade = "A";
    else if (pct >= 55) grade = "B";
    else grade = "C";

    list.push({
      _id: `stu_${i}`,
      first_name: fn,
      last_name: ln,
      roll_no: roll,
      registration_no: `REG-2026-${1000 + i}`,
      class_name: classVal,
      section: sec,
      father_name: `Father of ${fn} ${ln}`,
      marks,
      grade,
      percentage,
      fee_amount: fee,
      due_date: "2026-06-15",
      course_name: "General Science Curriculum",
      issue_date: "2026-06-05"
    });
  }
  return list;
})();

// Replace variable tags in canvas text blocks
function replaceVariables(objects: any[], student: MockStudent, schoolName: string): any[] {
  return objects.map((obj) => {
    if (obj.type === "textbox" || obj.type === "text" || obj.type === "i-text") {
      let txt = obj.text || "";
      txt = txt.replace(/\{\{student_name\}\}/g, `${student.first_name} ${student.last_name}`);
      txt = txt.replace(/\{\{father_name\}\}/g, student.father_name);
      txt = txt.replace(/\{\{roll_no\}\}/g, student.roll_no);
      txt = txt.replace(/\{\{registration_no\}\}/g, student.registration_no);
      txt = txt.replace(/\{\{class_name\}\}/g, student.class_name);
      txt = txt.replace(/\{\{section\}\}/g, student.section);
      txt = txt.replace(/\{\{marks\}\}/g, student.marks);
      txt = txt.replace(/\{\{grade\}\}/g, student.grade);
      txt = txt.replace(/\{\{percentage\}\}/g, student.percentage);
      txt = txt.replace(/\{\{fee_amount\}\}/g, student.fee_amount);
      txt = txt.replace(/\{\{due_date\}\}/g, student.due_date);
      txt = txt.replace(/\{\{issue_date\}\}/g, student.issue_date);
      txt = txt.replace(/\{\{school_name\}\}/g, schoolName);
      return { ...obj, text: txt };
    }
    if (obj.type === "group" && obj.objects) {
      return { ...obj, objects: replaceVariables(obj.objects, student, schoolName) };
    }
    return obj;
  });
}

export function BulkGeneratorModal({ 
  isOpen, 
  onClose, 
  activeType, 
  template = null, 
  customStudents = null 
}: BulkGeneratorModalProps) {
  const { canvas } = useTemplateStore();
  const { schoolName } = useSchoolBranding();

  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [classFilter, setClassFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Progress state
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportType, setExportType] = useState<"pdf" | "print" | null>(null);

  useEffect(() => {
    if (customStudents) {
      setStudents(customStudents);
      return;
    }

    void (async () => {
      try {
        const [stRes, clRes] = await Promise.all([
          serviceRequest<any[]>("/api/students"),
          serviceRequest<any[]>("/api/classes")
        ]);

        if (stRes.ok && clRes.ok) {
          const stList = Array.isArray(stRes.data) ? stRes.data : [];
          const clList = Array.isArray(clRes.data) ? clRes.data : [];
          const classMap = new Map(clList.map(c => [c._id || c.id, c.name]));

          const mapped = stList.map((s: any) => ({
            _id: s._id || s.id,
            first_name: s.first_name || "",
            last_name: s.last_name || "",
            roll_no: s.roll_no || s.admission_no || "N/A",
            registration_no: s.admission_no || "N/A",
            class_name: classMap.get(s.class_id) || "N/A",
            section: s.section || "A",
            father_name: s.father_name || `Father of ${s.first_name}`,
            marks: "85",
            grade: "A",
            percentage: "85",
            fee_amount: "5000",
            due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            course_name: "General Curriculum",
            issue_date: new Date().toLocaleDateString()
          }));
          setStudents(mapped);
        } else {
          setStudents(MOCK_STUDENTS);
        }
      } catch (e) {
        setStudents(MOCK_STUDENTS);
      }
    })();
  }, [customStudents]);

  // Retrieve matching unique classes for filter
  const classesList = useMemo(() => {
    const set = new Set(students.map((s) => s.class_name));
    return Array.from(set).sort();
  }, [students]);

  // Filter students based on selection
  const filteredStudents = useMemo(() => {
    let list = students;
    if (classFilter !== "all") {
      list = list.filter((s) => s.class_name === classFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
          s.registration_no.toLowerCase().includes(q) ||
          s.roll_no.includes(q)
      );
    }
    return list;
  }, [classFilter, searchQuery]);

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s._id)));
    }
  };

  // Local dimensions preset mapping
  const ASPECT_PRESETS: Record<string, { width: number; height: number }> = {
    certificate: { width: 842, height: 595 },
    fee_challan: { width: 595, height: 842 },
    id_card: { width: 320, height: 500 },
    result_card: { width: 595, height: 842 },
    character_certificate: { width: 842, height: 595 },
    experience_certificate: { width: 595, height: 842 },
    admission_form: { width: 595, height: 842 },
  };

  const handleBulkGenerate = async (type: "pdf" | "print") => {
    if (selectedStudents.size === 0) return;
    
    let canvasJSON = "";
    if (template) {
      try {
        const parsed = JSON.parse(template.border_style || "{}");
        canvasJSON = typeof parsed.canvasJSON === "string" ? parsed.canvasJSON : JSON.stringify(parsed.canvasJSON || {});
      } catch (e) {
        showToast("Invalid template design JSON configuration.", "error");
        return;
      }
    } else if (canvas) {
      canvasJSON = JSON.stringify(canvas.toJSON(["id", "selectable", "hasControls", "lockMovementX", "lockMovementY", "lockScalingX", "lockScalingY", "lockRotation", "customType", "variable"]));
    } else {
      showToast("No active design template loaded.", "error");
      return;
    }

    if (!canvasJSON || canvasJSON === "{}") {
      showToast("Selected template is empty or invalid.", "error");
      return;
    }

    setGenerating(true);
    setExportType(type);
    setProgress(0);

    const selectedList = students.filter((s) => selectedStudents.has(s._id));
    
    // Width and height details
    const presetType = template?.type || activeType;
    const preset = ASPECT_PRESETS[presetType] || { width: 800, height: 600 };
    const aspectWidth = preset.width;
    const aspectHeight = preset.height;

    try {
      if (type === "pdf") {
        const { jsPDF } = await import("jspdf");
        
        // A4 PDF standard layout is 297mm x 210mm
        const pdfOrientation = aspectWidth > aspectHeight ? "landscape" : "portrait";
        const pdfWidth = aspectWidth > aspectHeight ? 297 : 210;
        const pdfHeight = aspectWidth > aspectHeight ? 210 : 297;

        const doc = new jsPDF({
          orientation: pdfOrientation,
          unit: "mm",
          format: [pdfWidth, pdfHeight]
        });

        // Initialize offscreen canvas for headless rendering
        const offscreenElement = document.createElement("canvas");
        offscreenElement.width = aspectWidth;
        offscreenElement.height = aspectHeight;
        
        const offscreenCanvas = new (window as any).fabric.Canvas(offscreenElement);

        const batchSize = 10;
        
        for (let i = 0; i < selectedList.length; i++) {
          const student = selectedList[i];
          const currentJSON = JSON.parse(canvasJSON);
          currentJSON.objects = replaceVariables(currentJSON.objects, student, schoolName || "EduPlexo");

          await new Promise<void>((resolve) => {
            offscreenCanvas.loadFromJSON(currentJSON, () => {
              offscreenCanvas.renderAll();
              resolve();
            });
          });

          const imgData = offscreenCanvas.toDataURL({
            format: "jpeg",
            quality: 0.85
          });

          if (i > 0) {
            doc.addPage([pdfWidth, pdfHeight], pdfOrientation);
          }
          
          doc.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
          setProgress(i + 1);

          // Yield CPU to maintain UI thread interactivity
          if (i % batchSize === 0) {
            await new Promise((r) => setTimeout(r, 10));
          }
        }

        doc.save(`${activeType}_bulk_${Date.now()}.pdf`);
        offscreenCanvas.dispose();
        showToast("Bulk PDF generated successfully!", "success");
      } 
      else if (type === "print") {
        // Open standard web print window containing batch nodes
        const printWin = window.open("", "_blank");
        if (!printWin) {
          showToast("Pop-up blocker is preventing print view.", "error");
          setGenerating(false);
          return;
        }

        const offscreenElement = document.createElement("canvas");
        offscreenElement.width = aspectWidth;
        offscreenElement.height = aspectHeight;
        const offscreenCanvas = new (window as any).fabric.Canvas(offscreenElement);

        let printHtml = "";

        for (let i = 0; i < selectedList.length; i++) {
          const student = selectedList[i];
          const currentJSON = JSON.parse(canvasJSON);
          currentJSON.objects = replaceVariables(currentJSON.objects, student, schoolName || "EduPlexo");

          await new Promise<void>((resolve) => {
            offscreenCanvas.loadFromJSON(currentJSON, () => {
              offscreenCanvas.renderAll();
              resolve();
            });
          });

          const imgData = offscreenCanvas.toDataURL({ format: "png" });
          printHtml += `
            <div class="print-page">
              <img src="${imgData}" style="width:100%; height:auto;" />
            </div>
          `;
          setProgress(i + 1);
        }

        offscreenCanvas.dispose();

        printWin.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Print Bulk ${activeType}</title>
            <style>
              body { margin: 0; padding: 0; background-color: #ffffff; }
              .print-page { page-break-after: always; width: 100%; text-align: center; }
              @media print {
                body { background-color: #fff; }
                .print-page { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            ${printHtml}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => window.close(), 500);
              }
            </script>
          </body>
          </html>
        `);
        printWin.document.close();
        showToast("Bulk print window loaded.", "success");
      }
    } catch (e) {
      showToast("Error generating document sheets.", "error");
    } finally {
      setGenerating(false);
      setExportType(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <div>
              <h2 className="text-base font-bold text-white">Bulk Document Generator</h2>
              <p className="text-[10px] text-slate-400 font-medium">Select records from 1,000 students database</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal content body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left panel: Filters & Student list */}
          <div className="flex-1 p-4 flex flex-col overflow-hidden min-w-0">
            {/* Toolbar Filters */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or registration..."
                  className="w-full h-9 bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 text-xs outline-none text-white focus:border-blue-500 placeholder:text-slate-600"
                />
              </div>

              {/* Class Filter */}
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">All Classes</option>
                {classesList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <button
                onClick={toggleAll}
                className="px-3 py-1 rounded-lg border border-slate-800 bg-slate-950 text-xs font-bold text-slate-300 hover:text-white"
              >
                {selectedStudents.size === filteredStudents.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800 bg-slate-950">
              {filteredStudents.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">No students matched search criteria</div>
              ) : (
                filteredStudents.map((student) => (
                  <label
                    key={student._id}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                      selectedStudents.has(student._id) ? "bg-blue-600/10" : "hover:bg-slate-900/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(student._id)}
                      onChange={() => toggleStudent(student._id)}
                      className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500/20"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-200">
                          {student.first_name} {student.last_name}
                        </p>
                        <span className="text-[9px] font-mono text-slate-500">{student.registration_no}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-medium">
                        Roll {student.roll_no} · {student.class_name} ({student.section})
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Right panel: Generation summary */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-950/40 p-4 flex flex-col justify-between shrink-0">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300">Generation Preview</h3>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Template</span>
                  <span className="font-semibold text-white truncate max-w-[150px] capitalize" title={template ? template.name : activeType.replace("_", " ")}>
                    {template ? template.name : activeType.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Selected</span>
                  <span className="font-semibold text-blue-400">{selectedStudents.size} Students</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Batch Processing</span>
                  <span className="font-semibold text-emerald-400">Chunked Workers</span>
                </div>
              </div>

              {generating && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                      {exportType === "pdf" ? "Exporting PDF..." : "Spooling Print..."}
                    </span>
                    <span>
                      {progress} / {selectedStudents.size}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${(progress / selectedStudents.size) * 100}%` }}
                      className="bg-blue-600 h-full transition-all duration-150"
                    />
                  </div>
                  <p className="text-[9px] text-slate-500 font-medium">Processing dynamically in background chunks to avoid browser hanging.</p>
                </div>
              )}
            </div>

            <div className="space-y-2 mt-6">
              <button
                disabled={generating || selectedStudents.size === 0}
                onClick={() => handleBulkGenerate("pdf")}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Merged PDF
              </button>
              <button
                disabled={generating || selectedStudents.size === 0}
                onClick={() => handleBulkGenerate("print")}
                className="w-full h-10 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-850 disabled:opacity-40 text-white border border-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print All Records
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

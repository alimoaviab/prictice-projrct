import React, { useEffect, useRef, useState, useMemo } from "react";
import { fabric } from "fabric";
import { useTemplateStore, type TemplateType } from "../store/templateStore";
import { useSchoolBranding } from "@/hooks/useSchoolBranding";
import { BulkGeneratorModal } from "./BulkGeneratorModal";
import { ASSETS_CATALOG, type AssetMetadata } from "../utils/assetsLibrary";
import {
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Grid,
  FileText,
  Square,
  Circle,
  Triangle,
  Type,
  Image as ImageIcon,
  QrCode,
  Tag,
  Palette,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Layers,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ChevronLeft,
  Settings,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Search,
  UploadCloud,
  Heart,
  Clock,
  Wand2,
  Sliders,
  Paintbrush
} from "lucide-react";
import { showToast } from "@/utils/toast";

interface TemplateDesignerProps {
  initialData?: any;
  onSave: (data: {
    name: string;
    type: TemplateType;
    orientation: "landscape" | "portrait";
    border_style: string;
    elements: any[];
    body_text: string;
  }) => Promise<void>;
  saving?: boolean;
}

// Canvas dimension presets
const ASPECT_PRESETS: Record<TemplateType, { width: number; height: number; orientation: "landscape" | "portrait"; label: string }> = {
  certificate: { width: 842, height: 595, orientation: "landscape", label: "A4 Landscape (Certificate)" },
  fee_challan: { width: 595, height: 842, orientation: "portrait", label: "A4 Portrait (Fee Challan)" },
  id_card: { width: 320, height: 500, orientation: "portrait", label: "CR80 Portrait (ID Card)" },
  result_card: { width: 595, height: 842, orientation: "portrait", label: "A4 Portrait (Result Card)" },
  character_certificate: { width: 842, height: 595, orientation: "landscape", label: "A4 Landscape (Character Cert)" },
  experience_certificate: { width: 595, height: 842, orientation: "portrait", label: "A4 Portrait (Experience Cert)" },
  admission_form: { width: 595, height: 842, orientation: "portrait", label: "A4 Portrait (Admission Form)" },
};

const FONTS_LIST = [
  "Inter", "Cinzel", "Playfair Display", "Baskerville", "Cormorant Garamond", 
  "Georgia", "Times New Roman", "Montserrat", "Libre Baskerville", "Merriweather", 
  "Great Vibes", "Alex Brush", "Allura", "Parisienne", "Pinyon Script", "Tangerine", "EB Garamond"
];

// 13 element categories from library
const ASSET_CATEGORIES = [
  "Premium Borders", "Certificate Seals", "Award Ribbons", "Decorative Corners", 
  "Award Icons", "Laurel Wreath Collection", "Signature Elements", "Watermarks", 
  "Background Collection", "QR & Verification", "Frames", "Decorative Lines", "Badges"
];

export function TemplateDesigner({ initialData, onSave, saving = false }: TemplateDesignerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    canvas,
    zoom,
    showGrid,
    snapToGrid,
    snapToGuides,
    activeType,
    activeSide,
    selectedObject,
    undoStack,
    redoStack,
    favorites,
    recentAssets,
    setCanvas,
    setZoom,
    setShowGrid,
    setSnapToGrid,
    setSnapToGuides,
    setActiveType,
    setActiveSide,
    setSelectedObject,
    toggleFavorite,
    addRecentAsset,
    saveState,
    undo,
    redo,
    resetHistory
  } = useTemplateStore();

  const { schoolName, logoUrl } = useSchoolBranding();

  // Component UI States
  const [templateName, setTemplateName] = useState(initialData?.name || "Untitled Template");
  const [activeTab, setActiveTab] = useState<"templates" | "elements" | "uploads" | "text" | "variables" | "background" | "ai_generator">("templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [customUploads, setCustomUploads] = useState<string[]>([]);
  
  // AI Generator Form States
  const [aiCertType, setAiCertType] = useState("Certificate of Achievement");
  const [aiSchoolName, setAiSchoolName] = useState(schoolName || "EduPlexo Academy");
  const [aiTheme, setAiTheme] = useState<"gold" | "navy" | "crimson" | "emerald">("gold");

  // Alignment guides helpers
  const guidesRef = useRef<{ h: number | null; v: number | null }>({ h: null, v: null });

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    // Determine target size based on active type
    const preset = ASPECT_PRESETS[activeType];
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: preset.width,
      height: preset.height,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
    });

    setCanvas(fabricCanvas);
    resetHistory();

    // Event listeners
    const handleSelection = () => {
      setSelectedObject(fabricCanvas.getActiveObject() || null);
    };

    fabricCanvas.on("selection:created", handleSelection);
    fabricCanvas.on("selection:updated", handleSelection);
    fabricCanvas.on("selection:cleared", () => setSelectedObject(null));
    
    // Snapping logic during dragging
    fabricCanvas.on("object:moving", (options) => {
      const obj = options.target;
      if (!obj) return;

      const canvasWidth = fabricCanvas.width || 0;
      const canvasHeight = fabricCanvas.height || 0;
      const snapThreshold = 12;

      let snappedX = false;
      let snappedY = false;

      // Snap to Grid
      if (snapToGrid) {
        const grid = 20;
        const left = obj.left || 0;
        const top = obj.top || 0;
        obj.set({
          left: Math.round(left / grid) * grid,
          top: Math.round(top / grid) * grid
        }).setCoords();
      }

      // Snap to Center / Guides
      if (snapToGuides && !snapToGrid) {
        const objCenter = obj.getCenterPoint();
        
        // Vertical center line snap
        if (Math.abs(objCenter.x - canvasWidth / 2) < snapThreshold) {
          obj.set({ left: canvasWidth / 2 - (obj.width! * obj.scaleX!) / 2 }).setCoords();
          guidesRef.current.v = canvasWidth / 2;
          snappedX = true;
        } else {
          guidesRef.current.v = null;
        }

        // Horizontal center line snap
        if (Math.abs(objCenter.y - canvasHeight / 2) < snapThreshold) {
          obj.set({ top: canvasHeight / 2 - (obj.height! * obj.scaleY!) / 2 }).setCoords();
          guidesRef.current.h = canvasHeight / 2;
          snappedY = true;
        } else {
          guidesRef.current.h = null;
        }
      }

      fabricCanvas.requestRenderAll();
    });

    fabricCanvas.on("object:modified", () => {
      saveState();
      guidesRef.current = { h: null, v: null };
    });

    // Custom rendering of guidelines & grids
    fabricCanvas.on("after:render", () => {
      const ctx = fabricCanvas.getContext();
      ctx.save();

      const width = fabricCanvas.width || 0;
      const height = fabricCanvas.height || 0;

      // Draw dynamic grids if enabled
      if (showGrid) {
        ctx.strokeStyle = "rgba(226, 232, 240, 0.8)"; // slate-200
        ctx.lineWidth = 0.5;
        const gridSize = 20;

        for (let i = gridSize; i < width; i += gridSize) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, height);
          ctx.stroke();
        }
        for (let i = gridSize; i < height; i += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(width, i);
          ctx.stroke();
        }
      }

      // Draw dynamic snaps guides
      if (snapToGuides) {
        ctx.strokeStyle = "#ec4899"; // Pink-500
        ctx.lineWidth = 1.2;

        if (guidesRef.current.v !== null) {
          ctx.beginPath();
          ctx.moveTo(guidesRef.current.v, 0);
          ctx.lineTo(guidesRef.current.v, height);
          ctx.stroke();
        }

        if (guidesRef.current.h !== null) {
          ctx.beginPath();
          ctx.moveTo(0, guidesRef.current.h);
          ctx.lineTo(width, guidesRef.current.h);
          ctx.stroke();
        }
      }

      ctx.restore();
    });

    // Load initial layout data if present
    if (initialData) {
      setTemplateName(initialData.name || "Untitled Template");
      setActiveType((initialData.type as TemplateType) || "certificate");
      
      let parsedStyle: any = null;
      if (initialData.border_style) {
        try {
          parsedStyle = JSON.parse(initialData.border_style);
        } catch (e) {}
      }

      if (parsedStyle && parsedStyle.canvasJSON) {
        fabricCanvas.loadFromJSON(parsedStyle.canvasJSON, () => {
          fabricCanvas.requestRenderAll();
          saveState();
        });
      } else {
        saveState();
      }
    } else {
      loadDefaultLayoutPreset(fabricCanvas, activeType);
      saveState();
    }

    // Keybindings listener
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeObj = fabricCanvas.getActiveObject();
      if (!activeObj) return;

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (activeObj as any).isEditing) {
        return;
      }

      const step = e.shiftKey ? 10 : 1;

      switch (e.key) {
        case "Backspace":
        case "Delete":
          fabricCanvas.remove(activeObj);
          fabricCanvas.discardActiveObject();
          saveState();
          break;
        case "ArrowLeft":
          activeObj.set("left", (activeObj.left || 0) - step).setCoords();
          fabricCanvas.requestRenderAll();
          break;
        case "ArrowRight":
          activeObj.set("left", (activeObj.left || 0) + step).setCoords();
          fabricCanvas.requestRenderAll();
          break;
        case "ArrowUp":
          activeObj.set("top", (activeObj.top || 0) - step).setCoords();
          fabricCanvas.requestRenderAll();
          break;
        case "ArrowDown":
          activeObj.set("top", (activeObj.top || 0) + step).setCoords();
          fabricCanvas.requestRenderAll();
          break;
        case "d":
        case "D":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            duplicateObject(fabricCanvas, activeObj);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      fabricCanvas.dispose();
      setCanvas(null);
    };
  }, [activeType, snapToGrid, snapToGuides]);

  // Sync template type changes to canvas preset size
  const handleTypeChange = (type: TemplateType) => {
    setActiveType(type);
    const canvasObj = useTemplateStore.getState().canvas;
    if (canvasObj) {
      const preset = ASPECT_PRESETS[type];
      canvasObj.setWidth(preset.width);
      canvasObj.setHeight(preset.height);
      canvasObj.clear();
      loadDefaultLayoutPreset(canvasObj, type);
      saveState();
    }
  };

  // Helper to seed a default layout for document type
  const loadDefaultLayoutPreset = (canvasObj: fabric.Canvas, type: TemplateType) => {
    const width = canvasObj.width || 800;
    const height = canvasObj.height || 600;

    if (type === "certificate" || type === "character_certificate" || type === "experience_certificate") {
      // Standard outer border
      const border = new fabric.Rect({
        left: 20,
        top: 20,
        width: width - 40,
        height: height - 40,
        fill: "transparent",
        stroke: "#d4a853",
        strokeWidth: 4,
        rx: 8,
        ry: 8,
        selectable: false,
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true,
      });
      canvasObj.add(border);

      // Document title
      const dTitle = type === "certificate" ? "CERTIFICATE OF APPRECIATION" :
                   type === "character_certificate" ? "CHARACTER CERTIFICATE" : 
                   "EXPERIENCE CERTIFICATE";

      const title = new fabric.Textbox(dTitle, {
        left: width / 2,
        top: 80,
        width: width - 100,
        fontSize: 30,
        fontFamily: "Cinzel",
        fontWeight: "bold",
        fill: "#1e40af",
        textAlign: "center",
        originX: "center",
      });
      canvasObj.add(title);

      // Student name variable tag
      const studentName = new fabric.Textbox("{{student_name}}", {
        left: width / 2,
        top: 180,
        width: width - 200,
        fontSize: 40,
        fontFamily: "Great Vibes",
        fill: "#d4a853",
        textAlign: "center",
        originX: "center",
      });
      canvasObj.add(studentName);

      // Description Body
      const body = new fabric.Textbox(
        type === "experience_certificate"
          ? "This document verifies that {{student_name}} has completed course requirements under the {{course_name}} program at {{school_name}} with outstanding records of performance."
          : "has successfully demonstrated excellent character, high academic standing, and outstanding leadership qualities in class {{class_name}} section {{section}} during the academic session.",
        {
          left: width / 2,
          top: 260,
          width: width - 180,
          fontSize: 14,
          fontFamily: "EB Garamond",
          fill: "#334155",
          textAlign: "center",
          originX: "center",
          lineHeight: 1.4,
        }
      );
      canvasObj.add(body);

      // Principal Signature
      const line1 = new fabric.Line([120, height - 100, 260, height - 100], {
        stroke: "#94a3b8",
        strokeWidth: 1.2,
        selectable: false,
      });
      const text1 = new fabric.Textbox("Principal", {
        left: 190,
        top: height - 90,
        fontSize: 10,
        fontFamily: "Inter",
        textAlign: "center",
        originX: "center",
        fill: "#64748b",
      });
      canvasObj.add(line1, text1);

      // Class Teacher Signature
      const line2 = new fabric.Line([width - 260, height - 100, width - 120, height - 100], {
        stroke: "#94a3b8",
        strokeWidth: 1.2,
        selectable: false,
      });
      const text2 = new fabric.Textbox("Class Teacher", {
        left: width - 190,
        top: height - 90,
        fontSize: 10,
        fontFamily: "Inter",
        textAlign: "center",
        originX: "center",
        fill: "#64748b",
      });
      canvasObj.add(line2, text2);
    } 
    else if (type === "id_card") {
      // ID Card Default elements
      const headerBlock = new fabric.Rect({
        left: 0,
        top: 0,
        width: width,
        height: 90,
        fill: "#1e40af",
        selectable: false,
      });
      canvasObj.add(headerBlock);

      const schoolText = new fabric.Textbox(schoolName || "EDUPLEXO HIGH SCHOOL", {
        left: width / 2,
        top: 25,
        width: width - 20,
        fontSize: 14,
        fontFamily: "Montserrat",
        fontWeight: "bold",
        fill: "#ffffff",
        textAlign: "center",
        originX: "center",
      });
      canvasObj.add(schoolText);

      const cardLabel = new fabric.Textbox("STUDENT ID CARD", {
        left: width / 2,
        top: 50,
        width: width - 20,
        fontSize: 9,
        fontFamily: "Inter",
        fontWeight: "bold",
        fill: "#ffe875",
        textAlign: "center",
        originX: "center",
      });
      canvasObj.add(cardLabel);

      // Photo placeholder
      const photoBorder = new fabric.Rect({
        left: width / 2 - 45,
        top: 120,
        width: 90,
        height: 100,
        fill: "#f8fafc",
        stroke: "#cbd5e1",
        strokeWidth: 1,
        rx: 4,
        ry: 4,
      });
      const photoText = new fabric.Textbox("Photo", {
        left: width / 2,
        top: 160,
        fontSize: 11,
        fontFamily: "Inter",
        fill: "#94a3b8",
        textAlign: "center",
        originX: "center",
      });
      canvasObj.add(photoBorder, photoText);

      // Student name details
      const nameText = new fabric.Textbox("{{student_name}}", {
        left: width / 2,
        top: 240,
        width: width - 30,
        fontSize: 15,
        fontFamily: "Montserrat",
        fontWeight: "bold",
        fill: "#1e293b",
        textAlign: "center",
        originX: "center",
      });
      canvasObj.add(nameText);

      const rollText = new fabric.Textbox("Roll: {{roll_no}} · Class: {{class_name}}", {
        left: width / 2,
        top: 275,
        width: width - 40,
        fontSize: 11,
        fontFamily: "Inter",
        fill: "#475569",
        textAlign: "center",
        originX: "center",
      });
      canvasObj.add(rollText);

      const emergText = new fabric.Textbox("Emergency: {{father_name}}", {
        left: width / 2,
        top: 305,
        width: width - 30,
        fontSize: 9,
        fontFamily: "Inter",
        fill: "#ef4444",
        textAlign: "center",
        originX: "center",
      });
      canvasObj.add(emergText);
    }
    else if (type === "fee_challan") {
      // 3 copies layout details
      const stripeWidth = width / 3;

      for (let i = 1; i <= 2; i++) {
        const line = new fabric.Line([stripeWidth * i, 0, stripeWidth * i, height], {
          stroke: "#cbd5e1",
          strokeWidth: 1.5,
          strokeDashArray: [5, 5],
          selectable: false,
        });
        canvasObj.add(line);
      }

      const copies = ["BANK COPY", "OFFICE COPY", "STUDENT COPY"];
      copies.forEach((hName, idx) => {
        const offset = stripeWidth * idx;

        const headerBox = new fabric.Rect({
          left: offset + 10,
          top: 15,
          width: stripeWidth - 20,
          height: 30,
          fill: "#1e40af",
          rx: 4,
          ry: 4,
          selectable: false,
        });
        const label = new fabric.Textbox(hName, {
          left: offset + stripeWidth / 2,
          top: 22,
          width: stripeWidth - 30,
          fontSize: 11,
          fontFamily: "Montserrat",
          fontWeight: "bold",
          fill: "#ffffff",
          textAlign: "center",
          originX: "center",
        });
        canvasObj.add(headerBox, label);

        const details = new fabric.Textbox(
          `Challan: {{registration_no}}\nSchool: {{school_name}}\nStudent: {{student_name}}\nClass: {{class_name}} ({{section}})`,
          {
            left: offset + 20,
            top: 65,
            width: stripeWidth - 40,
            fontSize: 10,
            fontFamily: "Inter",
            lineHeight: 1.4,
            fill: "#334155",
          }
        );
        canvasObj.add(details);

        // Fee Item Table Rows
        const items = new fabric.Textbox(
          `Tuition Fee\nAdmission Fine\n-------------------------------\nTotal:`,
          {
            left: offset + 20,
            top: 180,
            width: stripeWidth - 40,
            fontSize: 10,
            fontFamily: "Inter",
            lineHeight: 1.5,
          }
        );
        const amounts = new fabric.Textbox(
          `{{fee_amount}}\n0.00\n\n{{fee_amount}}`,
          {
            left: offset + stripeWidth - 80,
            top: 180,
            width: 60,
            fontSize: 10,
            fontFamily: "Inter",
            lineHeight: 1.5,
            textAlign: "right",
          }
        );
        canvasObj.add(items, amounts);
      });
    }
    else {
      // General Portrait builders (Result Cards & Admission Forms)
      const border = new fabric.Rect({
        left: 20,
        top: 20,
        width: width - 40,
        height: height - 40,
        fill: "transparent",
        stroke: "#1e40af",
        strokeWidth: 2.5,
        selectable: false,
      });
      canvasObj.add(border);

      const title = new fabric.Textbox(type === "result_card" ? "STUDENT REPORT CARD" : "ADMISSION FORM", {
        left: width / 2,
        top: 50,
        width: width - 100,
        fontSize: 24,
        fontFamily: "Montserrat",
        fontWeight: "bold",
        fill: "#1e40af",
        textAlign: "center",
        originX: "center",
      });
      canvasObj.add(title);

      const info = new fabric.Textbox(
        `Student Name: {{student_name}}\nFather Name:  {{father_name}}\nRegistration: {{registration_no}}\nClass Group:  {{class_name}} · Roll No: {{roll_no}}`,
        {
          left: 50,
          top: 140,
          width: width - 100,
          fontSize: 12,
          fontFamily: "Inter",
          lineHeight: 1.6,
          fill: "#1e293b",
        }
      );
      canvasObj.add(info);
    }

    canvasObj.requestRenderAll();
  };

  // Duplicate active canvas element
  const duplicateObject = (c: fabric.Canvas, obj: fabric.Object) => {
    obj.clone((cloned: fabric.Object) => {
      cloned.set({
        left: (obj.left || 0) + 15,
        top: (obj.top || 0) + 15,
        evented: true,
      });
      
      if (cloned.type === "activeSelection") {
        cloned.canvas = c;
        (cloned as any).forEachObject((o: fabric.Object) => {
          c.add(o);
        });
        cloned.setCoords();
      } else {
        c.add(cloned);
      }
      
      c.setActiveObject(cloned);
      c.requestRenderAll();
      saveState();
      showToast("Element duplicated.", "success");
    });
  };

  // Shape adders
  const addShape = (shapeType: "rect" | "circle" | "triangle" | "line") => {
    if (!canvas) return;
    let shape: fabric.Object;

    switch (shapeType) {
      case "rect":
        shape = new fabric.Rect({ left: 100, top: 100, width: 80, height: 80, fill: "#3b82f6" });
        break;
      case "circle":
        shape = new fabric.Circle({ left: 100, top: 100, radius: 40, fill: "#10b981" });
        break;
      case "triangle":
        shape = new fabric.Triangle({ left: 100, top: 100, width: 80, height: 80, fill: "#f59e0b" });
        break;
      case "line":
        shape = new fabric.Line([50, 100, 200, 100], { stroke: "#64748b", strokeWidth: 3 });
        break;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.requestRenderAll();
    saveState();
  };

  // Drag and Drop dynamic SVG asset from assets library
  const addSVGAsset = (asset: AssetMetadata) => {
    if (!canvas) return;
    
    // Pick theme colors
    const primary = "#1e40af";
    const secondary = "#d4a853";
    const svgCode = asset.generateSVG(primary, secondary);

    fabric.loadSVGFromString(svgCode, (objects, options) => {
      const obj = fabric.util.groupSVGElements(objects, options);
      obj.set({
        left: 150,
        top: 150,
        customType: "svg-asset",
        id: asset.id
      } as any);
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
      
      // Save state and logs
      addRecentAsset(asset.id);
      saveState();
      showToast(`Added ${asset.name} to canvas`, "success");
    });
  };

  const addQRBarcode = (type: "qr" | "barcode") => {
    if (!canvas) return;

    if (type === "qr") {
      const qrRect = new fabric.Rect({
        left: 100, top: 100, width: 80, height: 80, fill: "#ffffff", stroke: "#000000", strokeWidth: 1.5,
      });
      const qrLabel = new fabric.Textbox("QR CODE", {
        left: 140, top: 130, fontSize: 10, fontFamily: "monospace", fontWeight: "bold", textAlign: "center", originX: "center",
      });
      const group = new fabric.Group([qrRect, qrLabel], { left: 100, top: 100, customType: "qr" } as any);
      canvas.add(group);
      canvas.setActiveObject(group);
    } else {
      const barLines = new fabric.Rect({
        left: 100, top: 100, width: 140, height: 40,
        fill: "repeating-linear-gradient(90deg, #000, #000 3px, #fff 3px, #fff 6px)",
        stroke: "#000000", strokeWidth: 1,
      });
      const barLabel = new fabric.Textbox("*BARCODE*", {
        left: 170, top: 145, fontSize: 9, fontFamily: "monospace", textAlign: "center", originX: "center",
      });
      const group = new fabric.Group([barLines, barLabel], { left: 100, top: 100, customType: "barcode" } as any);
      canvas.add(group);
      canvas.setActiveObject(group);
    }

    canvas.requestRenderAll();
    saveState();
  };

  // AI Certificate Auto Design Generator Engine
  const handleAIGenerate = () => {
    if (!canvas) return;
    canvas.clear();

    // Theme color settings
    let primary = "#d4a853"; // Gold
    let secondary = "#1e3a8a"; // Royal Blue
    
    if (aiTheme === "navy") {
      primary = "#1e3a8a";
      secondary = "#d4a853";
    } else if (aiTheme === "crimson") {
      primary = "#991b1b"; // Crimson
      secondary = "#d4a853";
    } else if (aiTheme === "emerald") {
      primary = "#065f46"; // Emerald
      secondary = "#d4a853";
    }

    const w = canvas.width || 842;
    const h = canvas.height || 595;

    // 1. Add Parametric Border SVG
    const borderSVG = ASSETS_CATALOG.find((a) => a.id === "border_1")!.generateSVG(primary, secondary);
    fabric.loadSVGFromString(borderSVG, (objects, options) => {
      const obj = fabric.util.groupSVGElements(objects, options);
      obj.set({
        left: 0,
        top: 0,
        width: w,
        height: h,
        selectable: false,
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true,
      });
      canvas.add(obj);
      canvas.sendToBack(obj);
    });

    // 2. Add Laurel Wreath SVG at bottom center
    const wreathSVG = ASSETS_CATALOG.find((a) => a.id === "wreath_1")!.generateSVG(primary);
    fabric.loadSVGFromString(wreathSVG, (objects, options) => {
      const obj = fabric.util.groupSVGElements(objects, options);
      obj.set({
        left: w / 2 - 50,
        top: h - 190,
        scaleX: 1.0,
        scaleY: 1.0,
      });
      canvas.add(obj);
    });

    // 3. Add Premium Seal in middle of wreath
    const sealSVG = ASSETS_CATALOG.find((a) => a.id === "seal_1")!.generateSVG(secondary);
    fabric.loadSVGFromString(sealSVG, (objects, options) => {
      const obj = fabric.util.groupSVGElements(objects, options);
      obj.set({
        left: w / 2 - 30,
        top: h - 170,
        scaleX: 0.6,
        scaleY: 0.6,
      });
      canvas.add(obj);
    });

    // 4. Add Typography Text
    const schoolText = new fabric.Textbox(aiSchoolName.toUpperCase(), {
      left: w / 2,
      top: 70,
      width: w - 100,
      fontSize: 16,
      fontFamily: "Montserrat",
      fontWeight: "bold",
      fill: primary,
      textAlign: "center",
      originX: "center",
    });
    canvas.add(schoolText);

    const typeText = new fabric.Textbox(aiCertType.toUpperCase(), {
      left: w / 2,
      top: 105,
      width: w - 100,
      fontSize: 32,
      fontFamily: "Cinzel",
      fontWeight: "bold",
      fill: secondary,
      textAlign: "center",
      originX: "center",
    });
    canvas.add(typeText);

    const prText = new fabric.Textbox("THIS IS PROUDLY PRESENTED TO", {
      left: w / 2,
      top: 165,
      width: w - 100,
      fontSize: 10,
      fontFamily: "Inter",
      fontWeight: "bold",
      fill: "#64748b",
      textAlign: "center",
      originX: "center",
    });
    canvas.add(prText);

    const nameText = new fabric.Textbox("{{student_name}}", {
      left: w / 2,
      top: 190,
      width: w - 100,
      fontSize: 42,
      fontFamily: "Great Vibes",
      fill: primary,
      textAlign: "center",
      originX: "center",
    });
    canvas.add(nameText);

    const descText = new fabric.Textbox(
      "for demonstrating outstanding excellence, exemplary academic performance, and high character standing during the academic term at this institution.",
      {
        left: w / 2,
        top: 265,
        width: w - 200,
        fontSize: 13,
        fontFamily: "EB Garamond",
        fill: "#475569",
        textAlign: "center",
        originX: "center",
        lineHeight: 1.5,
      }
    );
    canvas.add(descText);

    // 5. Add Signature Blocks
    const sig1 = new fabric.Line([100, h - 90, 240, h - 90], { stroke: "#cbd5e1", strokeWidth: 1.2, selectable: false });
    const textSig1 = new fabric.Textbox("Principal", {
      left: 170, top: h - 80, fontSize: 10, fontFamily: "Inter", fill: "#64748b", textAlign: "center", originX: "center",
    });
    canvas.add(sig1, textSig1);

    const sig2 = new fabric.Line([w - 240, h - 90, w - 100, h - 90], { stroke: "#cbd5e1", strokeWidth: 1.2, selectable: false });
    const textSig2 = new fabric.Textbox("Class Teacher", {
      left: w - 170, top: h - 80, fontSize: 10, fontFamily: "Inter", fill: "#64748b", textAlign: "center", originX: "center",
    });
    canvas.add(sig2, textSig2);

    // 6. Verification stamp block
    const qrBox = new fabric.Rect({
      left: w - 110, top: 60, width: 45, height: 45, fill: "#ffffff", stroke: "#cbd5e1", strokeWidth: 1,
    });
    const qrText = new fabric.Textbox("VERIFIED\nID: {{roll_no}}", {
      left: w - 87, top: 72, fontSize: 6, fontFamily: "monospace", textAlign: "center", originX: "center",
    });
    const qrGroup = new fabric.Group([qrBox, qrText], { left: w - 110, top: 60, customType: "qr" } as any);
    canvas.add(qrGroup);

    canvas.requestRenderAll();
    saveState();
    showToast("AI Certificate Layout generated!", "success");
  };

  // Add textbox element
  const addText = (preset: "heading" | "body") => {
    if (!canvas) return;
    const textbox = new fabric.Textbox(
      preset === "heading" ? "Add Heading" : "Add paragraph text",
      {
        left: 100,
        top: 150,
        width: 200,
        fontSize: preset === "heading" ? 28 : 14,
        fontFamily: preset === "heading" ? "Montserrat" : "Inter",
        fill: "#1e293b",
        fontWeight: preset === "heading" ? "bold" : "normal",
      }
    );
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.requestRenderAll();
    saveState();
  };

  // Insert Variable helper
  const insertVariable = (variable: string) => {
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    
    if (activeObj && (activeObj.type === "textbox" || activeObj.type === "text" || activeObj.type === "i-text")) {
      const textbox = activeObj as fabric.Textbox;
      const text = textbox.text || "";
      const cursorPosition = textbox.selectionStart || text.length;
      
      const updatedText = text.slice(0, cursorPosition) + variable + text.slice(cursorPosition);
      textbox.set("text", updatedText);
      canvas.requestRenderAll();
      saveState();
      showToast(`Inserted ${variable}`, "success");
    } else {
      const textbox = new fabric.Textbox(variable, {
        left: 150,
        top: 200,
        width: 150,
        fontSize: 18,
        fontFamily: "Inter",
        fill: "#1e40af",
        fontWeight: "bold",
      });
      canvas.add(textbox);
      canvas.setActiveObject(textbox);
      canvas.requestRenderAll();
      saveState();
    }
  };

  // Image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;
      setCustomUploads((prev) => [dataUrl, ...prev]);

      fabric.Image.fromURL(dataUrl, (img) => {
        img.scaleToWidth(150);
        img.set({ left: 100, top: 100 });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
        saveState();
      });
    };
    reader.readAsDataURL(file);
  };

  const addImageFromUrl = (url: string) => {
    if (!canvas) return;
    fabric.Image.fromURL(url, (img) => {
      img.scaleToWidth(120);
      img.set({ left: 120, top: 120 });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
      saveState();
    });
  };

  const applyBackground = (color: string) => {
    if (!canvas) return;
    canvas.setBackgroundColor(color, () => {
      canvas.requestRenderAll();
      saveState();
    });
  };

  // Inspector color modifiers
  const updateActiveTextProp = (prop: string, value: any) => {
    if (!canvas || !selectedObject) return;
    selectedObject.set(prop as any, value);
    canvas.requestRenderAll();
    saveState();
  };

  const updateObjectColor = (color: string, stroke: boolean = false) => {
    if (!canvas || !selectedObject) return;
    if (selectedObject.type === "group") {
      const group = selectedObject as fabric.Group;
      group.forEachObject((o) => {
        o.set(stroke ? "stroke" : "fill", color);
      });
    } else {
      selectedObject.set(stroke ? "stroke" : "fill", color);
    }
    canvas.requestRenderAll();
    saveState();
  };

  const handleAlign = (alignment: "left" | "center" | "right") => {
    if (!canvas || !selectedObject) return;
    if (selectedObject.type === "textbox" || selectedObject.type === "text" || selectedObject.type === "i-text") {
      (selectedObject as any).set("textAlign", alignment);
      canvas.requestRenderAll();
      saveState();
    }
  };

  const handleOrder = (action: "front" | "back" | "forward" | "backward") => {
    if (!canvas || !selectedObject) return;
    switch (action) {
      case "front": canvas.bringToFront(selectedObject); break;
      case "back": canvas.sendToBack(selectedObject); break;
      case "forward": canvas.bringForward(selectedObject); break;
      case "backward": canvas.sendBackwards(selectedObject); break;
    }
    canvas.requestRenderAll();
    saveState();
  };

  const toggleLock = () => {
    if (!canvas || !selectedObject) return;
    const isLocked = selectedObject.lockMovementX;
    selectedObject.set({
      lockMovementX: !isLocked,
      lockMovementY: !isLocked,
      lockScalingX: !isLocked,
      lockScalingY: !isLocked,
      lockRotation: !isLocked,
      hasControls: isLocked,
    });
    canvas.requestRenderAll();
    saveState();
  };

  const handleSave = async () => {
    if (!canvas) return;
    const canvasJSON = JSON.stringify(canvas.toJSON(["id", "selectable", "hasControls", "lockMovementX", "lockMovementY", "lockScalingX", "lockScalingY", "lockRotation", "customType", "variable"]));
    const orientation = ASPECT_PRESETS[activeType].orientation;

    const data = {
      name: templateName,
      type: activeType,
      orientation,
      border_style: JSON.stringify({ canvasJSON }),
      elements: [],
      body_text: "Default dynamic variable canvas template",
    };

    await onSave(data);
  };

  // Filter dynamic assets list based on query and tabs
  const filteredAssets = useMemo(() => {
    let list = ASSETS_CATALOG;
    
    // Filters based on search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a: AssetMetadata) => a.name.toLowerCase().includes(q) || a.tags.some((t: string) => t.includes(q)));
    }
    return list;
  }, [searchQuery]);

  // Context tags specific to active template type
  const activeTags = useMemo(() => {
    const isCert = activeType.includes("certificate");
    const isFee = activeType === "fee_challan";
    const isResult = activeType === "result_card";

    return [
      { tag: "{{student_name}}", label: "Student Full Name", show: true },
      { tag: "{{father_name}}", label: "Father Name", show: true },
      { tag: "{{roll_no}}", label: "Roll Number", show: !isFee },
      { tag: "{{registration_no}}", label: "Registration No", show: true },
      { tag: "{{class_name}}", label: "Class Name", show: true },
      { tag: "{{section}}", label: "Section", show: true },
      { tag: "{{marks}}", label: "Marks Score", show: isResult || isCert },
      { tag: "{{grade}}", label: "Result Grade", show: isResult || isCert },
      { tag: "{{percentage}}", label: "Percentage Score", show: isResult || isCert },
      { tag: "{{fee_amount}}", label: "Monthly Fee", show: isFee },
      { tag: "{{due_date}}", label: "Fee Due Date", show: isFee },
      { tag: "{{issue_date}}", label: "Issue Date", show: true },
      { tag: "{{school_name}}", label: "School Name", show: true }
    ].filter((t) => t.show);
  }, [activeType]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-100 text-slate-800 font-sans">
      
      {/* Sleek Light Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-slate-200 bg-white shadow-sm z-20 shrink-0">
        <div className="flex items-center gap-3">
          <ChevronLeft className="w-5 h-5 text-slate-500 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => window.history.back()} />
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-600 focus:bg-slate-50 rounded-lg px-2 py-1 text-sm font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400"
            placeholder="Challan or Certificate Title..."
          />
          <span className="h-4 w-px bg-slate-200" />
          
          <select
            value={activeType}
            onChange={(e) => handleTypeChange(e.target.value as TemplateType)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1 text-xs font-bold text-slate-600 focus:outline-none transition-colors"
          >
            {Object.entries(ASPECT_PRESETS).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
        </div>

        {/* Action controllers */}
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
          <span className="h-4 w-px bg-slate-200" />
          
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-600 min-w-[36px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(2.0, zoom + 0.1))}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="h-4 w-px bg-slate-200" />

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-md transition-colors ${showGrid ? "text-blue-600 bg-blue-50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`}
            title="Toggle Grid Lines"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSnapToGuides(!snapToGuides)}
            className={`p-1.5 rounded-md text-xs font-semibold px-2 py-1.5 border border-slate-200 transition-colors ${snapToGuides ? "text-pink-600 bg-pink-50 border-pink-100" : "text-slate-500 hover:text-slate-900"}`}
            title="Toggle Snap Alignment Guides"
          >
            Snap Guides
          </button>
        </div>

        {/* CTA Save Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-700/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Bulk Print
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-700/10"
          >
            {saving ? "Saving..." : "Save Template"}
          </button>
        </div>
      </div>

      {/* Main Designer Grid */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side Tab Navigation Panel */}
        <div className="w-[72px] border-r border-slate-200 bg-white flex flex-col items-center py-4 gap-4 z-10 shrink-0 shadow-sm">
          {[
            { id: "templates", icon: FileText, label: "Presets" },
            { id: "ai_generator", icon: Wand2, label: "AI Design" },
            { id: "elements", icon: Square, label: "Elements" },
            { id: "text", icon: Type, label: "Text" },
            { id: "variables", icon: Tag, label: "Tags" },
            { id: "uploads", icon: UploadCloud, label: "Uploads" },
            { id: "background", icon: Palette, label: "Colors" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all gap-1.5 group ${
                activeTab === tab.id ? "text-blue-600 bg-blue-50/50" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <tab.icon className="w-5 h-5 group-hover:scale-105 transition-transform" />
              <span className="text-[9px] font-bold tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Sidebar Drawer */}
        <div className="w-68 border-r border-slate-200 bg-white flex flex-col z-10 shrink-0 shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              {activeTab.replace("_", " ")}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* AI Generator Tab */}
            {activeTab === "ai_generator" && (
              <div className="space-y-4">
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Enter certificate credentials to auto-generate a professional, color-harmonized vector layout instantly:
                </p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Certificate Type</label>
                    <input
                      type="text"
                      value={aiCertType}
                      onChange={(e) => setAiCertType(e.target.value)}
                      placeholder="e.g. Appreciation Certificate"
                      className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-800 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">School Name</label>
                    <input
                      type="text"
                      value={aiSchoolName}
                      onChange={(e) => setAiSchoolName(e.target.value)}
                      placeholder="e.g. Eduplexo High"
                      className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-800 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Select Theme Palette</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: "gold", label: "Luxury Gold", color: "bg-amber-500" },
                        { id: "navy", label: "Royal Blue", color: "bg-blue-900" },
                        { id: "crimson", label: "Crimson Red", color: "bg-red-800" },
                        { id: "emerald", label: "Emerald Mint", color: "bg-emerald-800" }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setAiTheme(t.id as any)}
                          className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[10px] font-bold text-left transition-colors ${
                            aiTheme === t.id ? "border-blue-500 bg-blue-50 text-blue-600" : "border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          <span className={`w-3 h-3 rounded-full ${t.color} shrink-0`} />
                          <span className="truncate">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleAIGenerate}
                    className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-600/10"
                  >
                    <Wand2 className="w-4 h-4" />
                    AI Auto Design
                  </button>
                </div>
              </div>
            )}

            {/* Presets Tab content */}
            {activeTab === "templates" && (
              <div className="space-y-3">
                <p className="text-[10px] text-slate-400 font-medium">Select a quick document preset to start editing:</p>
                {Object.entries(ASPECT_PRESETS).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => handleTypeChange(key as TemplateType)}
                    className={`w-full p-2.5 rounded-lg border text-left text-xs font-bold transition-all block ${
                      activeType === key ? "bg-blue-50 border-blue-200 text-blue-600" : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                    }`}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            )}

            {/* Expanded SVG Assets & Shapes Library */}
            {activeTab === "elements" && (
              <div className="space-y-4">
                
                {/* Search Elements */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search premium SVGs..."
                    className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 text-[11px] outline-none text-slate-800 focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* Base Shapes */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Shapes</h4>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: "rect", icon: Square, label: "Rect" },
                      { id: "circle", icon: Circle, label: "Circle" },
                      { id: "triangle", icon: Triangle, label: "Triangle" }
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => addShape(s.id as any)}
                        className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600"
                      >
                        <s.icon className="w-4 h-4 mb-1 text-slate-500" />
                        <span className="text-[9px] font-bold">{s.label}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => addQRBarcode("qr")}
                      className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600"
                    >
                      <QrCode className="w-4 h-4 mb-1 text-slate-500" />
                      <span className="text-[9px] font-bold">QR</span>
                    </button>
                  </div>
                </div>

                <span className="block h-px bg-slate-100" />

                {/* Categorized SVG elements */}
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {ASSET_CATEGORIES.map((cat) => {
                    const assets = filteredAssets.filter((a: AssetMetadata) => a.category === cat);
                    if (assets.length === 0) return null;

                    return (
                      <div key={cat} className="space-y-2">
                        <h4 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{cat}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {assets.map((asset: AssetMetadata) => {
                            const isFav = favorites.includes(asset.id);
                            return (
                              <div
                                key={asset.id}
                                className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex flex-col items-center justify-between relative group hover:border-slate-300 transition-colors"
                              >
                                {/* Favorite button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(asset.id);
                                  }}
                                  className="absolute top-1 right-1 p-0.5 rounded-full hover:bg-slate-200 text-rose-500 transition-colors"
                                >
                                  <Heart className="w-3.5 h-3.5" fill={isFav ? "currentColor" : "none"} />
                                </button>

                                <div 
                                  onClick={() => addSVGAsset(asset)}
                                  className="w-16 h-16 flex items-center justify-center cursor-pointer overflow-hidden p-1"
                                  dangerouslySetInnerHTML={{ __html: asset.generateSVG("#475569", "#d4a853") }}
                                />
                                <span className="text-[9px] font-semibold text-slate-500 truncate w-full text-center mt-1">
                                  {asset.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Text Tab content */}
            {activeTab === "text" && (
              <div className="space-y-3">
                <button
                  onClick={() => addText("heading")}
                  className="w-full py-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-center font-bold text-sm text-slate-800 shadow-sm"
                >
                  Add Heading
                </button>
                <button
                  onClick={() => addText("body")}
                  className="w-full py-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-center font-medium text-xs text-slate-600 shadow-sm"
                >
                  Add Paragraph Text
                </button>
              </div>
            )}

            {/* Type-Specific Filtered Variables Tags list */}
            {activeTab === "variables" && (
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Click variable tags to insert inside your template layout. Only fields relevant to <span className="font-bold text-blue-600">{activeType.replace("_", " ")}</span> are listed:
                </p>
                <div className="flex flex-col gap-1.5">
                  {activeTags.map((item: { tag: string; label: string; show: boolean }) => (
                    <button
                      key={item.tag}
                      onClick={() => insertVariable(item.tag)}
                      className="w-full p-2 text-left rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 flex items-center justify-between transition-colors"
                    >
                      <span>{item.label}</span>
                      <span className="text-[9px] font-mono text-blue-600 font-normal bg-blue-50 px-1 py-0.5 rounded">{item.tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Uploads drawer */}
            {activeTab === "uploads" && (
              <div className="space-y-4">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center text-slate-500"
                >
                  <UploadCloud className="w-6 h-6 mb-2 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">Upload Custom Image</span>
                  <span className="text-[9px] text-slate-400 mt-1">Logo, Student Photo, Signature...</span>
                </button>

                {logoUrl && (
                  <div className="p-2 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                      <span className="text-[10px] font-bold text-slate-700">School Logo</span>
                    </div>
                    <button
                      onClick={() => addImageFromUrl(logoUrl)}
                      className="text-[9px] font-bold text-blue-600 hover:underline"
                    >
                      Insert
                    </button>
                  </div>
                )}

                {customUploads.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Uploaded Files</h4>
                    <div className="grid grid-cols-3 gap-1.5">
                      {customUploads.map((src, i) => (
                        <div key={i} className="aspect-square bg-slate-50 rounded-lg overflow-hidden border border-slate-200 relative group">
                          <img src={src} className="w-full h-full object-cover" />
                          <button
                            onClick={() => addImageFromUrl(src)}
                            className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-bold text-white transition-opacity"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Colors drawer */}
            {activeTab === "background" && (
              <div className="space-y-3">
                <p className="text-[10px] text-slate-400 font-medium">Select a canvas background color:</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    "#ffffff", "#f8fafc", "#f1f5f9", "#cbd5e1",
                    "#1e40af", "#1e3a8a", "#0f172a", "#090d16",
                    "#fef08a", "#fef9c3", "#ffedd5", "#fee2e2"
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => applyBackground(color)}
                      style={{ backgroundColor: color }}
                      className="w-full aspect-square rounded-md border border-slate-300 transition-transform active:scale-95 shadow-sm"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Infinite Workspace Viewport */}
        <div className="flex-1 overflow-auto bg-slate-100 relative flex items-center justify-center p-8 select-none">
          {/* Rulers */}
          <div className="absolute top-0 left-12 right-0 h-6 bg-white border-b border-slate-200 flex items-end select-none pointer-events-none z-10">
            <div className="flex w-full px-4 text-[7px] text-slate-400 font-bold justify-between">
              <span>0mm</span><span>50mm</span><span>100mm</span><span>150mm</span><span>200mm</span><span>250mm</span>
            </div>
          </div>
          <div className="absolute top-6 left-0 bottom-0 w-6 bg-white border-r border-slate-200 flex flex-col justify-between py-4 text-[7px] text-slate-400 font-bold text-center select-none pointer-events-none z-10">
            <span>0mm</span><span>50mm</span><span>100mm</span><span>150mm</span><span>200mm</span>
          </div>

          <div
            ref={containerRef}
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
            className="shadow-xl rounded-lg bg-white relative transition-transform duration-75 border border-slate-200"
          >
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* Right Side Panel: Settings & Layer Inspector */}
        <div className="w-72 border-l border-slate-200 bg-white flex flex-col z-10 shrink-0 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">Inspector Panel</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {selectedObject ? (
              <div className="space-y-5">
                
                {/* Lock elements */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Type: {selectedObject.type}</span>
                  </div>
                  <button
                    onClick={toggleLock}
                    className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
                  >
                    {selectedObject.lockMovementX ? <Lock className="w-3.5 h-3.5 text-blue-600" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Vector Shape / SVG Fill & Stroke Color Inspector */}
                {(selectedObject.type === "rect" || 
                  selectedObject.type === "circle" || 
                  selectedObject.type === "triangle" || 
                  selectedObject.type === "path" || 
                  selectedObject.type === "group" ||
                  (selectedObject as any).customType === "svg-asset") && (
                  <div className="space-y-3 border-b border-slate-100 pb-4">
                    <h4 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                      <Paintbrush className="w-3.5 h-3.5" />
                      Shape Styling
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">Fill Color</label>
                        <input
                          type="color"
                          value={typeof selectedObject.fill === "string" ? selectedObject.fill : "#3b82f6"}
                          onChange={(e) => updateObjectColor(e.target.value, false)}
                          className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-1 py-0.5 outline-none cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">Stroke Color</label>
                        <input
                          type="color"
                          value={selectedObject.stroke || "#000000"}
                          onChange={(e) => updateObjectColor(e.target.value, true)}
                          className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-1 py-0.5 outline-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Stroke Width ({selectedObject.strokeWidth || 0}px)</label>
                      <input
                        type="range"
                        min="0"
                        max="15"
                        value={selectedObject.strokeWidth || 0}
                        onChange={(e) => {
                          selectedObject.set("strokeWidth", parseInt(e.target.value));
                          canvas?.requestRenderAll();
                          saveState();
                        }}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Typography controls */}
                {(selectedObject.type === "textbox" || selectedObject.type === "text" || selectedObject.type === "i-text") && (
                  <div className="space-y-3 border-b border-slate-100 pb-4">
                    <h4 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Typography</h4>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Font Family</label>
                      <select
                        value={(selectedObject as any).fontFamily}
                        onChange={(e) => updateActiveTextProp("fontFamily", e.target.value)}
                        className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-bold text-slate-700 focus:outline-none"
                      >
                        {FONTS_LIST.map((font) => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">Font Size</label>
                        <input
                          type="number"
                          value={(selectedObject as any).fontSize}
                          onChange={(e) => updateActiveTextProp("fontSize", parseInt(e.target.value) || 12)}
                          className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-slate-800 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">Text Color</label>
                        <input
                          type="color"
                          value={(selectedObject as any).fill || "#000000"}
                          onChange={(e) => updateActiveTextProp("fill", e.target.value)}
                          className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-1 py-0.5 outline-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateActiveTextProp("fontWeight", (selectedObject as any).fontWeight === "bold" ? "normal" : "bold")}
                          className={`h-7 px-2.5 rounded-lg border text-xs font-bold transition-all ${(selectedObject as any).fontWeight === "bold" ? "bg-blue-600 border-blue-500 text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                        >
                          B
                        </button>
                        <button
                          onClick={() => updateActiveTextProp("fontStyle", (selectedObject as any).fontStyle === "italic" ? "normal" : "italic")}
                          className={`h-7 px-2.5 rounded-lg border text-xs font-bold italic transition-all ${(selectedObject as any).fontStyle === "italic" ? "bg-blue-600 border-blue-500 text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                        >
                          I
                        </button>
                        <button
                          onClick={() => updateActiveTextProp("underline", !(selectedObject as any).underline)}
                          className={`h-7 px-2.5 rounded-lg border text-xs font-bold underline transition-all ${(selectedObject as any).underline ? "bg-blue-600 border-blue-500 text-white" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                        >
                          U
                        </button>
                      </div>

                      <div className="flex gap-1 bg-slate-50 rounded-lg border border-slate-200 p-0.5">
                        {(["left", "center", "right"] as const).map((align) => (
                          <button
                            key={align}
                            onClick={() => handleAlign(align)}
                            className={`p-1 rounded transition-colors ${
                              (selectedObject as any).textAlign === align ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            {align === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                            {align === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                            {align === "right" && <AlignRight className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Opacity slider */}
                <div className="space-y-1.5 border-b border-slate-100 pb-4">
                  <label className="text-[10px] font-bold text-slate-500 block">Opacity ({Math.round(selectedObject.opacity! * 100)}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedObject.opacity || 1}
                    onChange={(e) => {
                      selectedObject.set("opacity", parseFloat(e.target.value));
                      canvas?.requestRenderAll();
                    }}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                {/* Dimension Coordinates */}
                <div className="space-y-3 border-b border-slate-100 pb-4">
                  <h4 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Position</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500">X (Left)</span>
                      <input
                        type="number"
                        value={Math.round(selectedObject.left || 0)}
                        onChange={(e) => {
                          selectedObject.set("left", parseInt(e.target.value) || 0).setCoords();
                          canvas?.requestRenderAll();
                        }}
                        className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-mono font-bold text-slate-800 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500">Y (Top)</span>
                      <input
                        type="number"
                        value={Math.round(selectedObject.top || 0)}
                        onChange={(e) => {
                          selectedObject.set("top", parseInt(e.target.value) || 0).setCoords();
                          canvas?.requestRenderAll();
                        }}
                        className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-mono font-bold text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Arrangement order */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Arrange Layers</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOrder("forward")}
                      className="flex items-center gap-1.5 justify-center py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 shadow-sm"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      Bring Forward
                    </button>
                    <button
                      onClick={() => handleOrder("backward")}
                      className="flex items-center gap-1.5 justify-center py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 shadow-sm"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                      Send Backward
                    </button>
                    <button
                      onClick={() => handleOrder("front")}
                      className="flex items-center justify-center py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 shadow-sm col-span-2"
                    >
                      Bring to Front
                    </button>
                    <button
                      onClick={() => handleOrder("back")}
                      className="flex items-center justify-center py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 shadow-sm col-span-2"
                    >
                      Send to Back
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => duplicateObject(canvas!, selectedObject)}
                    className="flex items-center gap-1.5 justify-center py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold border border-blue-200 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      canvas?.remove(selectedObject);
                      canvas?.discardActiveObject();
                      saveState();
                      showToast("Element deleted.", "success");
                    }}
                    className="flex items-center gap-1.5 justify-center py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs flex flex-col items-center gap-2">
                <Settings className="w-6 h-6 text-slate-300 animate-pulse" />
                <p>Click any element on the canvas to inspect its style or arrange its layering.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Generator modal */}
      {isBulkOpen && (
        <BulkGeneratorModal
          isOpen={isBulkOpen}
          onClose={() => setIsBulkOpen(false)}
          activeType={activeType}
        />
      )}
    </div>
  );
}

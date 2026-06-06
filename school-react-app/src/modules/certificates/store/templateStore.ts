import { create } from "zustand";
import { fabric } from "fabric";

export type TemplateType =
  | "certificate"
  | "fee_challan"
  | "id_card"
  | "result_card"
  | "character_certificate"
  | "experience_certificate"
  | "admission_form";

export interface TemplateStore {
  canvas: fabric.Canvas | null;
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
  snapToGuides: boolean;
  activeType: TemplateType;
  activeSide: "front" | "back";
  selectedObject: fabric.Object | null;
  undoStack: string[];
  redoStack: string[];
  favorites: string[];
  recentAssets: string[];
  setCanvas: (canvas: fabric.Canvas | null) => void;
  setZoom: (zoom: number) => void;
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  setSnapToGuides: (snap: boolean) => void;
  setActiveType: (type: TemplateType) => void;
  setActiveSide: (side: "front" | "back") => void;
  setSelectedObject: (obj: fabric.Object | null) => void;
  toggleFavorite: (assetId: string) => void;
  addRecentAsset: (assetId: string) => void;
  saveState: () => void;
  undo: () => void;
  redo: () => void;
  resetHistory: () => void;
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  canvas: null,
  zoom: 1.0,
  showGrid: true,
  snapToGrid: false,
  snapToGuides: true,
  activeType: "certificate",
  activeSide: "front",
  selectedObject: null,
  undoStack: [],
  redoStack: [],
  favorites: [],
  recentAssets: [],

  setCanvas: (canvas) => set({ canvas }),
  setZoom: (zoom) => {
    const canvas = get().canvas;
    if (canvas) {
      canvas.setZoom(zoom);
      canvas.requestRenderAll();
    }
    set({ zoom });
  },
  setShowGrid: (showGrid) => {
    set({ showGrid });
    const canvas = get().canvas;
    if (canvas) {
      canvas.requestRenderAll();
    }
  },
  setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
  setSnapToGuides: (snapToGuides) => set({ snapToGuides }),
  setActiveType: (activeType) => set({ activeType }),
  setActiveSide: (activeSide) => set({ activeSide }),
  setSelectedObject: (selectedObject) => set({ selectedObject }),
  toggleFavorite: (assetId) => {
    const favs = get().favorites;
    const nextFavs = favs.includes(assetId)
      ? favs.filter((id) => id !== assetId)
      : [...favs, assetId];
    set({ favorites: nextFavs });
  },
  addRecentAsset: (assetId) => {
    const recents = get().recentAssets;
    const nextRecents = [assetId, ...recents.filter((id) => id !== assetId)].slice(0, 12);
    set({ recentAssets: nextRecents });
  },

  saveState: () => {
    const { canvas, undoStack } = get();
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON(["id", "selectable", "hasControls", "lockMovementX", "lockMovementY", "lockScalingX", "lockScalingY", "lockRotation", "customType", "variable"]));
    
    // Limit stack size to 30 to avoid high memory usage
    const nextStack = [...undoStack, json].slice(-30);
    set({ undoStack: nextStack, redoStack: [] });
  },

  undo: () => {
    const { canvas, undoStack, redoStack } = get();
    if (!canvas || undoStack.length === 0) return;
    
    const current = JSON.stringify(canvas.toJSON(["id", "selectable", "hasControls", "lockMovementX", "lockMovementY", "lockScalingX", "lockScalingY", "lockRotation", "customType", "variable"]));
    const previous = undoStack[undoStack.length - 1];
    
    canvas.loadFromJSON(previous, () => {
      canvas.requestRenderAll();
      set({
        undoStack: undoStack.slice(0, -1),
        redoStack: [...redoStack, current],
        selectedObject: null
      });
    });
  },

  redo: () => {
    const { canvas, undoStack, redoStack } = get();
    if (!canvas || redoStack.length === 0) return;
    
    const current = JSON.stringify(canvas.toJSON(["id", "selectable", "hasControls", "lockMovementX", "lockMovementY", "lockScalingX", "lockScalingY", "lockRotation", "customType", "variable"]));
    const next = redoStack[redoStack.length - 1];
    
    canvas.loadFromJSON(next, () => {
      canvas.requestRenderAll();
      set({
        undoStack: [...undoStack, current],
        redoStack: redoStack.slice(0, -1),
        selectedObject: null
      });
    });
  },

  resetHistory: () => set({ undoStack: [], redoStack: [] })
}));

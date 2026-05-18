import React from "react";

interface Props {
  copies: number;
  setCopies: (n: number) => void;
  perPage: number;
  setPerPage: (n: number) => void;
  orientation: "portrait" | "landscape";
  setOrientation: (o: "portrait" | "landscape") => void;
  paperSize: string;
  setPaperSize: (s: string) => void;
  scale: number;
  setScale: (s: number) => void;
  showLogo: boolean;
  setShowLogo: (b: boolean) => void;
  showNotes: boolean;
  setShowNotes: (b: boolean) => void;
  showSignature: boolean;
  setShowSignature: (b: boolean) => void;
}

export const PrintToolbar: React.FC<Props> = ({ copies, setCopies, perPage, setPerPage, orientation, setOrientation, paperSize, setPaperSize, scale, setScale, showLogo, setShowLogo, showNotes, setShowNotes, showSignature, setShowSignature }) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2 text-sm">
          Copies:
          <select value={copies} onChange={(e) => setCopies(Number(e.target.value))} className="ml-2 border rounded px-2 py-1">
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          Students / Page:
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="ml-2 border rounded px-2 py-1">
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          Orientation:
          <select value={orientation} onChange={(e) => setOrientation(e.target.value as any)} className="ml-2 border rounded px-2 py-1">
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          Paper:
          <select value={paperSize} onChange={(e) => setPaperSize(e.target.value)} className="ml-2 border rounded px-2 py-1">
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
            <option value="Legal">Legal</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          Scale:
          <input type="range" min={50} max={120} value={Math.round(scale*100)} onChange={(e) => setScale(Number(e.target.value)/100)} className="ml-2" />
          <span className="ml-2 text-xs">{Math.round(scale*100)}%</span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} /> Show Logo
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showNotes} onChange={(e) => setShowNotes(e.target.checked)} /> Show Notes
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showSignature} onChange={(e) => setShowSignature(e.target.checked)} /> Show Signature
        </label>
      </div>
    </div>
  );
};

export default PrintToolbar;

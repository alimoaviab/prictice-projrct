"use client";
import { AIAssistant } from "../../components/ai/AIAssistant";
import { useState } from "react";

export default function TestAIPage() {
  const [show, setShow] = useState(true);
  return (
    <div className="min-h-screen bg-slate-100 p-10 relative">
      <h1 className="text-3xl font-bold text-slate-800 mb-4">AI Assistant Visual Test</h1>
      <button
        onClick={() => setShow(!show)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm"
      >
        Toggle Assistant
      </button>

      {show && <AIAssistant onClose={() => setShow(false)} />}
    </div>
  );
}

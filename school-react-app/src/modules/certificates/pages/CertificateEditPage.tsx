import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import * as service from "../services/certificate.service";
import { useCertificateTemplates } from "../hooks/useCertificates";
import { TemplateDesigner } from "../components/TemplateDesigner";
import { type CertificateTemplate } from "../types/certificate.types";
import { Skeleton } from "@/components/ui";

export function CertificateEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateTemplate } = useCertificateTemplates();
  const [saving, setSaving] = useState(false);

  const { state: templateState, run: runTemplate } = useSafeAsync<CertificateTemplate>();

  useEffect(() => {
    if (!id) return;
    void runTemplate(async () => {
      const result = await service.getTemplate(id);
      if (!result.ok) throw new Error(result.error?.message || "Failed to load template");
      return result.data;
    });
  }, [id, runTemplate]);

  const handleSave = async (data: {
    name: string;
    type: any;
    orientation: "landscape" | "portrait";
    border_style: string;
    elements: any[];
    body_text: string;
  }) => {
    if (!id) return;
    setSaving(true);
    try {
      const result = await updateTemplate(id, {
        name: data.name,
        type: data.type,
        orientation: data.orientation,
        border_style: data.border_style,
        elements: data.elements,
        body_text: data.body_text,
      });
      if (result && result.ok) {
        navigate("/admin/certificates");
      }
    } finally {
      setSaving(false);
    }
  };

  if (templateState.status === "loading" || templateState.status === "idle") {
    return (
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        <Skeleton className="h-10 w-48 rounded" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  if (templateState.status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <p className="text-sm font-semibold">Failed to load template layout.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-900">
      <TemplateDesigner
        initialData={templateState.data}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
export default CertificateEditPage;

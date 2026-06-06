import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCertificateTemplates } from "../hooks/useCertificates";
import { TemplateDesigner } from "../components/TemplateDesigner";

export function CertificateCreatePage() {
  const navigate = useNavigate();
  const { createTemplate } = useCertificateTemplates();
  const [saving, setSaving] = useState(false);

  const handleSave = async (data: {
    name: string;
    type: any;
    orientation: "landscape" | "portrait";
    border_style: string;
    elements: any[];
    body_text: string;
  }) => {
    setSaving(true);
    try {
      const result = await createTemplate({
        name: data.name,
        type: data.type,
        orientation: data.orientation,
        border_style: data.border_style,
        elements: data.elements,
        body_text: data.body_text,
        is_default: false,
      });
      if (result && result.ok) {
        navigate("/admin/certificates");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-900">
      <TemplateDesigner onSave={handleSave} saving={saving} />
    </div>
  );
}
export default CertificateCreatePage;

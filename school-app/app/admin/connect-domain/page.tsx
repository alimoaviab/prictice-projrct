"use client";

import { useState } from "react";
import { SchoolShell } from "../../../layouts/SchoolShell";

export default function ConnectDomainPage() {
  const [formData, setFormData] = useState({
    domain: "",
    serverIP: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/domain/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Reset form on success
        setFormData({
          domain: "",
          serverIP: "",
          email: "",
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Failed to connect domain",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <SchoolShell title="Connect Domain" eyebrow="Domain Management">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <span className="material-symbols-outlined text-blue-600">language</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Connect Custom Domain</h2>
                <p className="text-sm text-slate-500">
                  Setup your custom domain with automatic DNS and SSL configuration
                </p>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="border-b border-slate-200 bg-blue-50 px-6 py-4">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-blue-600 text-xl">info</span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  What happens when you connect a domain?
                </h3>
                <ul className="space-y-1 text-xs text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5">check_circle</span>
                    <span>Cloudflare DNS records will be automatically configured</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5">check_circle</span>
                    <span>Free SSL certificate from Let's Encrypt will be generated</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5">check_circle</span>
                    <span>SSL will auto-renew 30 days before expiry</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5">check_circle</span>
                    <span>Your domain will be ready to use in minutes</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Domain Input */}
            <div>
              <label htmlFor="domain" className="block text-sm font-semibold text-slate-700 mb-2">
                Domain Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  language
                </span>
                <input
                  type="text"
                  id="domain"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  placeholder="example.com"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Enter your domain without http:// or https:// (e.g., myschool.com)
              </p>
            </div>

            {/* Server IP Input */}
            <div>
              <label htmlFor="serverIP" className="block text-sm font-semibold text-slate-700 mb-2">
                Server IP Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  dns
                </span>
                <input
                  type="text"
                  id="serverIP"
                  name="serverIP"
                  value={formData.serverIP}
                  onChange={handleChange}
                  placeholder="192.168.1.1"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                The IP address where your application is hosted
              </p>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Admin Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  email
                </span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Email for SSL certificate notifications and domain management
              </p>
            </div>

            {/* Result Message */}
            {result && (
              <div
                className={`rounded-lg border p-4 ${
                  result.success
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex gap-3">
                  <span
                    className={`material-symbols-outlined ${
                      result.success ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {result.success ? "check_circle" : "error"}
                  </span>
                  <div className="flex-1">
                    <h4
                      className={`text-sm font-semibold mb-1 ${
                        result.success ? "text-green-900" : "text-red-900"
                      }`}
                    >
                      {result.success ? "Success!" : "Error"}
                    </h4>
                    <p
                      className={`text-sm ${
                        result.success ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {result.message}
                    </p>
                    {result.details && (
                      <div className="mt-2 rounded bg-white/50 p-3 text-xs font-mono">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                <span className="material-symbols-outlined text-sm align-middle mr-1">lock</span>
                Your domain will be secured with SSL automatically
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">add_link</span>
                    <span>Connect Domain</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">help</span>
            Need Help?
          </h3>
          <div className="space-y-3 text-sm text-slate-600">
            <div>
              <p className="font-medium text-slate-700 mb-1">Where do I find my Server IP?</p>
              <p className="text-xs">
                Contact your hosting provider or check your server dashboard. For cloud providers like AWS, Azure, or DigitalOcean, you'll find it in your instance details.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-700 mb-1">How long does DNS propagation take?</p>
              <p className="text-xs">
                DNS changes typically propagate within 5-30 minutes, but can take up to 48 hours in some cases.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-700 mb-1">What if the setup fails?</p>
              <p className="text-xs">
                Make sure your domain's nameservers are pointed to Cloudflare. You can check the status and retry from the domain management page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SchoolShell>
  );
}

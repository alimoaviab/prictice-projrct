/**
 * SEO Engine Page — AI-powered enterprise SEO strategy generator for eduplexo.com.
 *
 * Architecture:
 *   Frontend (this) → Backend API (/api/seo/generate) → Anthropic/OpenAI
 *   Streaming via SSE (Server-Sent Events).
 *
 * The backend handles:
 *   - API key security (never exposed to client)
 *   - Rate limiting (per IP / per session)
 *   - Response caching (Redis, 24h TTL per block)
 *   - Model routing (cost optimization)
 */

import React, { useState, useRef, useCallback } from "react";

// ─── SEO Block Definitions ───────────────────────────────────────────────

const SITE_CONTEXT = `Website: https://eduplexo.com/
Product: AI-powered School Management System / School ERP SaaS
Target Markets: Pakistan, UAE, Saudi Arabia, India, UK, USA
Competitors: MyClassCampus, Fedena, Teachmint, PowerSchool, Gradelink, Schoology, Classe365`;

interface SeoBlock {
  id: string;
  icon: string;
  label: string;
  description: string;
  color: string;
  bg: string;
  prompt: string;
}

const BLOCKS: SeoBlock[] = [
  {
    id: "onpage",
    icon: "📄",
    label: "On-Page SEO",
    description: "Title, meta, headers, keywords",
    color: "#2563eb",
    bg: "#eff6ff",
    prompt: `Analyze eduplexo.com and deliver COMPLETE On-Page SEO optimization.\n\nSITE CONTEXT:\n${SITE_CONTEXT}\n\nDELIVER:\n## 1. OPTIMIZED SEO TITLE\n3 variants (60 chars max). Mark recommended.\n\n## 2. META DESCRIPTION\n3 variants (155 chars max). Include CTA + primary keyword.\n\n## 3. OPEN GRAPH TAGS\nComplete og: meta tags code block.\n\n## 4. TWITTER CARD TAGS\nComplete twitter: meta tags code block.\n\n## 5. CANONICAL + HREFLANG\nCanonical + hreflang for en, ur, ar, hi.\n\n## 6. H1-H6 HEADER STRUCTURE\nComplete header hierarchy. H1 (1x), H2s (6-8), H3s for features.\n\n## 7. KEYWORD DENSITY PLAN\nTop 5 keywords with density targets and placement.\n\n## 8. IMAGE ALT TEXT STRATEGY\n8 specific ALT text examples for Eduplexo images.`,
  },
  {
    id: "keywords",
    icon: "🔍",
    label: "Keyword Strategy",
    description: "70+ keywords with volume & intent",
    color: "#7c3aed",
    bg: "#f5f3ff",
    prompt: `Generate a COMPLETE 70+ KEYWORD STRATEGY for Eduplexo.\n\nSITE CONTEXT:\n${SITE_CONTEXT}\n\n## 1. PRIMARY KEYWORDS (8)\n| Keyword | Volume | KD | Intent | Priority |\n\n## 2. SECONDARY KEYWORDS (12)\nSame format.\n\n## 3. LONG-TAIL KEYWORDS (15)\nHigh-intent, low-competition.\n\n## 4. TRANSACTIONAL KEYWORDS (10)\n"demo", "pricing", "free trial" variations.\n\n## 5. SEMANTIC + LSI KEYWORDS (10)\nCo-occurring terms Google expects.\n\n## 6. VOICE SEARCH KEYWORDS (5)\nConversational queries.\n\n## 7. LOCAL SEO KEYWORDS (10)\nGeo-targeted: Pakistan, UAE, Saudi, India cities.\n\n## 8. COMPETITOR GAP KEYWORDS (5)\nWhere competitors rank but Eduplexo can outrank.\n\nTotal: 75+ keywords with 2025 search trend estimates.`,
  },
  {
    id: "schema",
    icon: "🏗️",
    label: "Schema Markup",
    description: "JSON-LD structured data",
    color: "#059669",
    bg: "#ecfdf5",
    prompt: `Generate COMPLETE, VALID JSON-LD schema markup for eduplexo.com.\n\nSITE CONTEXT:\n${SITE_CONTEXT}\n\nDeliver ALL as working code blocks:\n\n## 1. SoftwareApplication Schema\nname, description, applicationCategory, offers, aggregateRating, featureList.\n\n## 2. Organization Schema\nname, url, logo, contactPoint, address, sameAs, areaServed.\n\n## 3. WebSite + SearchAction Schema\n\n## 4. FAQPage Schema\n10 real Q&A pairs for school ERP buyers.\n\n## 5. BreadcrumbList Schema\nHome > Features, Pricing, Demo, Blog.\n\n## 6. HowTo Schema\n"How to set up Eduplexo" - 5 steps.\n\nEach must be valid per schema.org and Google guidelines.`,
  },
  {
    id: "content",
    icon: "✍️",
    label: "Landing Copy",
    description: "Conversion-optimized page content",
    color: "#dc2626",
    bg: "#fef2f2",
    prompt: `Write COMPLETE landing page copy for eduplexo.com. SEO + conversion optimized.\n\nSITE CONTEXT:\n${SITE_CONTEXT}\n\n## HERO\nH1 + subheadline + CTA variants + trust line.\n\n## PROBLEM / SOLUTION\n3 pain points with Eduplexo's answer.\n\n## 6 CORE FEATURES\nEach: H3 title | icon suggestion | 40-word description | micro-CTA.\n\n## AI FEATURES\n3 AI capabilities that differentiate Eduplexo.\n\n## SOCIAL PROOF\n3 testimonial templates + trust badges + stat blocks.\n\n## PRICING CTA\nHeadline + CTA variants + risk reversal.\n\n## FAQ (10 Questions)\nReal questions Pakistani/UAE school owners ask.\n\n## FOOTER SEO TEXT\n100-word paragraph with natural keywords.`,
  },
  {
    id: "technical",
    icon: "⚙️",
    label: "Technical SEO",
    description: "Speed, crawlability, indexing",
    color: "#d97706",
    bg: "#fffbeb",
    prompt: `Deliver COMPLETE TECHNICAL SEO AUDIT for eduplexo.com.\n\nSITE CONTEXT:\n${SITE_CONTEXT}\n\n## 1. CORE WEB VITALS\nLCP, INP, CLS targets + fixes.\n\n## 2. PAGE SPEED\nActions for 90+ PageSpeed: images, CSS/JS, fonts, caching.\n\n## 3. MOBILE-FIRST\nMobile indexing checklist.\n\n## 4. URL STRUCTURE\nRecommended patterns for all pages.\n\n## 5. ROBOTS.TXT\nComplete file.\n\n## 6. XML SITEMAP\nAll URLs with priority values.\n\n## 7. INTERNAL LINKING\nHub-and-spoke model with anchor text.\n\n## 8. CDN + HOSTING\nFor Pakistan, UAE, Saudi, India low latency.`,
  },
  {
    id: "eeat",
    icon: "🏆",
    label: "EEAT Strategy",
    description: "Authority & trust building",
    color: "#0891b2",
    bg: "#ecfeff",
    prompt: `Deliver COMPLETE EEAT STRATEGY for eduplexo.com.\n\nSITE CONTEXT:\n${SITE_CONTEXT}\n\n## 1. EXPERTISE SIGNALS\nContent to create, author bios, 15 blog topics.\n\n## 2. AUTHORITATIVENESS\n20 backlink targets for Pakistan/UAE education sector.\n\n## 3. TRUSTWORTHINESS\nSecurity page, privacy, payment badges, SLA.\n\n## 4. EXPERIENCE SIGNALS\n3 case study templates, video strategy.\n\n## 5. TOPICAL AUTHORITY MAP\nPillar page + 12 cluster pages with URLs.\n\n## 6. ENTITY SEO\nKnowledge Graph strategy, Wikipedia, LinkedIn.\n\n## 7. COMPETITOR AUTHORITY GAP\nEduplexo vs MyClassCampus, Teachmint, Fedena.`,
  },
  {
    id: "roadmap",
    icon: "🗺️",
    label: "90-Day Roadmap",
    description: "Week-by-week execution plan",
    color: "#7c3aed",
    bg: "#faf5ff",
    prompt: `Create DETAILED 90-DAY SEO ROADMAP for eduplexo.com.\n\nSITE CONTEXT:\n${SITE_CONTEXT}\n\n## MONTH 1 (Weeks 1-4)\nWeekly: 5 tasks | Owner | Impact | KPI\n\n## MONTH 2 (Weeks 5-8)\nContent + authority building.\n\n## MONTH 3 (Weeks 9-12)\nScaling + optimization.\n\n## KPI DASHBOARD\n15 KPIs: baseline, month 1 target, month 3 target, tool.\n\n## TOOLS STACK\nKeyword tracking, audit, backlinks, content, analytics.\n\n## BUDGET ESTIMATE\nMonthly breakdown for Pakistan-based SaaS startup.\n\n## QUICK WINS\n5 actions for fastest ranking movement.`,
  },
];

// ─── API Configuration ───────────────────────────────────────────────────

const SEO_API_URL = import.meta.env.VITE_SEO_API_URL || "/api/seo/generate";

// ─── Component ───────────────────────────────────────────────────────────

export function SeoEnginePage() {
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runBlock = useCallback(
    async (block: SeoBlock) => {
      if (loading) {
        // Cancel current request
        abortRef.current?.abort();
        setLoading(false);
        return;
      }

      setActiveBlock(block.id);
      setOutput("");
      setDone(false);
      setError("");
      setLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(SEO_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            block_id: block.id,
            prompt: block.prompt,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ message: "Request failed" }));
          throw new Error(err.message || err.error?.message || `Error ${response.status}`);
        }

        // Stream SSE response
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  setOutput((prev) => prev + parsed.text);
                  // Auto-scroll
                  requestAnimationFrame(() => {
                    if (outputRef.current) {
                      outputRef.current.scrollTop = outputRef.current.scrollHeight;
                    }
                  });
                }
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                if ((e as Error).message && !(e as Error).message.includes("JSON")) {
                  throw e;
                }
              }
            }
          }
        }

        setDone(true);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError((e as Error).message || "Something went wrong");
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [loading]
  );

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
  };

  const currentBlock = BLOCKS.find((b) => b.id === activeBlock);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
              ⚡ AI-Powered
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              eduplexo.com
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Enterprise SEO Strategy Engine
          </h1>
          <p className="text-sm text-slate-500">
            AI generates real-time, actionable SEO strategy for Eduplexo. Select any block below.
          </p>
        </div>

        {/* Block Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {BLOCKS.map((block) => (
            <button
              key={block.id}
              onClick={() => runBlock(block)}
              disabled={loading && activeBlock !== block.id}
              className={`relative p-4 rounded-xl text-left transition-all duration-200 border-2 ${
                activeBlock === block.id
                  ? "border-current shadow-md scale-[1.02]"
                  : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
              } ${loading && activeBlock !== block.id ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
              style={{
                backgroundColor: activeBlock === block.id ? block.bg : "white",
                color: activeBlock === block.id ? block.color : undefined,
              }}
            >
              <div className="text-2xl mb-2">{block.icon}</div>
              <div className="text-xs font-bold text-slate-900" style={{ color: activeBlock === block.id ? block.color : undefined }}>
                {block.label}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                {block.description}
              </div>
              {loading && activeBlock === block.id && (
                <div className="absolute top-2 right-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Output Area */}
        {(output || loading || error) && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            {/* Output Header */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
              <span className="text-lg">{currentBlock?.icon}</span>
              <span className="text-sm font-bold" style={{ color: currentBlock?.color }}>
                {currentBlock?.label}
              </span>
              {loading && (
                <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  Generating...
                </div>
              )}
              {done && (
                <button
                  onClick={copyOutput}
                  className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Copy All
                </button>
              )}
            </div>

            {/* Content */}
            {error ? (
              <div className="p-5 text-sm text-red-600 bg-red-50">
                <strong>Error:</strong> {error}
              </div>
            ) : (
              <div
                ref={outputRef}
                className="p-6 max-h-[600px] overflow-y-auto prose prose-sm prose-slate max-w-none"
              >
                <MarkdownRenderer text={output} />
                {loading && (
                  <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse rounded-sm ml-0.5" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!output && !loading && !error && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <div className="text-4xl mb-4">🚀</div>
            <p className="text-base font-bold text-slate-900 mb-1">
              Select an SEO Block
            </p>
            <p className="text-sm text-slate-400">
              AI will generate enterprise-grade strategy for eduplexo.com
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Markdown Renderer ───────────────────────────────────────────────────

function MarkdownRenderer({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let inCode = false;
  let codeLines: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  const flushTable = () => {
    if (tableRows.length < 2) {
      tableRows = [];
      inTable = false;
      return;
    }
    const headers = tableRows[0]
      .split("|")
      .filter((c) => c.trim())
      .map((c) => c.trim());
    const dataRows = tableRows.slice(2);
    elements.push(
      <div key={`table-${i}`} className="overflow-x-auto my-3">
        <table className="w-full text-xs">
          <thead>
            <tr>
              {headers.map((h, j) => (
                <th key={j} className="px-3 py-2 text-left font-bold text-slate-600 bg-slate-50 border-b border-slate-200">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => {
              const cells = row
                .split("|")
                .filter((c) => c.trim())
                .map((c) => c.trim());
              return (
                <tr key={ri} className="border-b border-slate-100">
                  {cells.map((c, ci) => (
                    <td key={ci} className="px-3 py-2 text-slate-700">
                      {formatInline(c)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCode) {
        elements.push(
          <pre key={`code-${i}`} className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs leading-relaxed my-3">
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        inCode = false;
      } else {
        if (inTable) flushTable();
        inCode = true;
      }
      i++;
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      i++;
      continue;
    }

    if (line.startsWith("|")) {
      inTable = true;
      tableRows.push(line);
      i++;
      continue;
    }

    if (inTable) flushTable();

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-slate-900 mt-6 mb-2 pb-1 border-b border-slate-100">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-slate-800 mt-4 mb-1">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("#### ")) {
      elements.push(
        <h4 key={i} className="text-xs font-bold text-slate-600 mt-3 mb-1">
          {line.slice(5)}
        </h4>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h2 key={i} className="text-lg font-bold text-slate-900 mt-6 mb-2">
          {line.slice(2)}
        </h2>
      );
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      elements.push(
        <li key={i} className="text-sm text-slate-700 ml-4 mb-1 list-disc">
          {formatInline(line.slice(2))}
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(
        <li key={i} className="text-sm text-slate-700 ml-4 mb-1 list-decimal">
          {formatInline(line.replace(/^\d+\.\s/, ""))}
        </li>
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-3 border-slate-300 pl-3 my-2 text-sm text-slate-500 italic">
          {line.slice(2)}
        </blockquote>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-sm text-slate-700 leading-relaxed my-1">
          {formatInline(line)}
        </p>
      );
    }
    i++;
  }

  if (inTable) flushTable();
  if (inCode && codeLines.length) {
    elements.push(
      <pre key="final-code" className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs leading-relaxed my-3">
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
  }

  return <div>{elements}</div>;
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-700">{part.slice(1, -1)}</code>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

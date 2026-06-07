/**
 * SubscriptionPage — Complete subscription management UI.
 *
 * Sections:
 *   1. Current Plan Card (status, usage, expiry)
 *   2. Usage Progress Bar
 *   3. Pricing Cards (Starter, Growth, Custom)
 *   4. Subscription History
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import * as service from "../services/subscription.service";

import { useSubscription } from "../hooks/useSubscription";
import type { Plan } from "../services/subscription.service";

export function SubscriptionPage() {
  const {
    current,
    plans,
    history,
    isLoading,
    startTrial,
    upgradePlan,
    isUpgrading,
    isStartingTrial,
  } = useSubscription();

  const navigate = useNavigate();
  const [showContactModal, setShowContactModal] = useState(false);


  if (isLoading) {
    return <SubscriptionSkeleton />;
  }

  const sub = current?.subscription;
  const studentsUsed = current?.students_used ?? 0;
  const studentsLimit = current?.students_limit ?? 0;
  const usagePercent = studentsLimit > 0 ? Math.round((studentsUsed / studentsLimit) * 100) : 0;
  const isNearLimit = usagePercent >= 80;
  const daysRemaining = current?.days_remaining ?? 0;

  return (
    <SchoolShell eyebrow="Subscription" title="Subscription & Billing">
      <div className="space-y-8 p-6 max-w-7xl mx-auto">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription & Billing</h1>
        <p className="text-gray-500 mt-1">Manage your school's subscription plan and student limits</p>
      </div>

      {/* Current Plan Card + Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  {sub ? planDisplayName(sub.plan_name) : "No Active Plan"}
                </h2>
                {sub && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    sub.status === "active" ? "bg-green-100 text-green-700" :
                    sub.status === "trial" ? "bg-blue-100 text-blue-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {sub.status === "trial" ? "Free Trial" : sub.status === "active" ? "Active" : "Expired"}
                  </span>
                )}
              </div>
              {sub && (
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium text-gray-700">Valid Until:</span>{" "}
                    {new Date(sub.end_date).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Days Remaining:</span>{" "}
                    <span className={daysRemaining <= 7 ? "text-red-600 font-semibold" : ""}>
                      {daysRemaining} days
                    </span>
                  </p>
                  {sub.is_trial && (
                    <p className="text-blue-600 font-medium">
                      🎉 14-Day Free Trial — Enjoy all Growth Plan features!
                    </p>
                  )}
                  {sub.price > 0 && (
                    <p>
                      <span className="font-medium text-gray-700">Monthly Price:</span>{" "}
                      PKR {sub.price.toLocaleString()}/month
                    </p>
                  )}
                </div>
              )}
              {!sub && (
                <p className="mt-3 text-gray-500">
                  Subscribe to a plan to start managing your school.
                </p>
              )}
            </div>
            <div className="hidden sm:block">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Student Usage</h3>
          <div className="mt-4">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-gray-900">{studentsUsed}</span>
              <span className="text-gray-500 text-sm">/ {studentsLimit} students</span>
            </div>
            {/* Progress Bar */}
            <div className="mt-4 w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isNearLimit ? "bg-red-500" : "bg-blue-600"
                }`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>{usagePercent}% used</span>
              <span>{studentsLimit - studentsUsed} slots remaining</span>
            </div>
            {isNearLimit && (
              <p className="mt-3 text-xs text-red-600 font-medium">
                ⚠️ Approaching student limit. Consider upgrading.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              isCurrentPlan={sub?.plan_name === plan.name}
              canTrial={current?.can_trial ?? false}
              onStartTrial={() => startTrial()}
              onUpgrade={() => navigate("/admin/subscription/payment", { state: { plan } })}
              onContactSales={() => setShowContactModal(true)}
              isUpgrading={isUpgrading}
              isStartingTrial={isStartingTrial}
            />
          ))}
        </div>
      </div>

      {/* History — deduplicated: group same-action+same-plan consecutive entries */}
      {history.length > 0 && (() => {
        // Keep only the LATEST entry per unique (action + plan_name) combination.
        // This removes the dozens of repeated "trial" rows caused by repeated seeder runs.
        const seen = new Set<string>();
        const deduped = history.filter((entry) => {
          const key = `${entry.action}::${entry.plan_name}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Plan</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Action</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Amount</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Period</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deduped.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-50">
                      <td className="py-3 px-2 font-medium text-gray-900">{planDisplayName(entry.plan_name)}</td>
                      <td className="py-3 px-2 capitalize text-gray-600">{entry.action.replace(/_/g, " ")}</td>
                      <td className="py-3 px-2 text-gray-600">
                        {entry.amount > 0 ? `PKR ${entry.amount.toLocaleString()}` : "Free"}
                      </td>
                      <td className="py-3 px-2 text-gray-500 text-xs">
                        {new Date(entry.start_date).toLocaleDateString()} — {new Date(entry.end_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          entry.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {entry.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Contact Sales Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowContactModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900">Contact Sales</h3>
            <p className="mt-3 text-gray-600">
              For custom plans with 800+ students, dedicated support, and enterprise features, reach out to our sales team.
            </p>
            <div className="mt-6 space-y-3">
              <a href="mailto:sales@eduplexo.com" className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition">
                Email: sales@eduplexo.com
              </a>
              <a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer" className="block w-full text-center px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition">
                WhatsApp: +92 300 1234567
              </a>
            </div>
            <button onClick={() => setShowContactModal(false)} className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700">
              Close
            </button>
          </div>
        </div>
      )}
      </div>
    </SchoolShell>
  );
}

// ─── Pricing Card Component ──────────────────────────────────────────────

interface PricingCardProps {
  plan: Plan;
  isCurrentPlan: boolean;
  canTrial: boolean;
  onStartTrial: () => void;
  onUpgrade: () => void;
  onContactSales: () => void;
  isUpgrading: boolean;
  isStartingTrial: boolean;
}

function PricingCard({ plan, isCurrentPlan, canTrial, onStartTrial, onUpgrade, onContactSales, isUpgrading, isStartingTrial }: PricingCardProps) {
  return (
    <div className={`relative bg-white rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
      plan.popular ? "border-blue-500 shadow-md" : "border-gray-200"
    } ${isCurrentPlan ? "ring-2 ring-blue-200" : ""}`}>
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            Current
          </span>
        </div>
      )}

      <div className="text-center pt-2">
        <h3 className="text-lg font-bold text-gray-900">{plan.display_name}</h3>
        <div className="mt-4">
          {plan.is_custom ? (
            <div className="text-3xl font-bold text-gray-900">Contact Us</div>
          ) : (
            <>
              <span className="text-4xl font-bold text-gray-900">
                {plan.price.toLocaleString()}
              </span>
              <span className="text-gray-500 text-sm ml-1">PKR/month</span>
            </>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Up to <span className="font-semibold text-gray-700">{plan.student_limit}+</span> students
        </p>
      </div>

      {/* Features */}
      <ul className="mt-6 space-y-3">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
            <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {/* Action Button */}
      <div className="mt-8">
        {plan.is_custom ? (
          <button
            onClick={onContactSales}
            className="w-full py-3 px-4 rounded-xl font-medium border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition"
          >
            Contact Sales
          </button>
        ) : isCurrentPlan ? (
          <button disabled className="w-full py-3 px-4 rounded-xl font-medium bg-gray-100 text-gray-400 cursor-not-allowed">
            Current Plan
          </button>
        ) : canTrial && !plan.is_custom ? (
          <button
            onClick={onStartTrial}
            disabled={isStartingTrial}
            className="w-full py-3 px-4 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isStartingTrial ? "Starting..." : "Start 14-Day Free Trial"}
          </button>
        ) : (
          <button
            onClick={onUpgrade}
            disabled={isUpgrading}
            className={`w-full py-3 px-4 rounded-xl font-medium transition disabled:opacity-50 ${
              plan.popular
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            {isUpgrading ? "Upgrading..." : "Upgrade Plan"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────

function SubscriptionSkeleton() {
  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 h-48" />
        <div className="bg-white rounded-2xl border border-gray-200 p-6 h-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 h-96" />
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function planDisplayName(name: string): string {
  const map: Record<string, string> = {
    starter: "Starter School",
    growth: "Growth Plan",
    custom: "Custom Plan",
  };
  return map[name] || name;
}

export { SubscriptionPage as AdminSubscriptionPage };

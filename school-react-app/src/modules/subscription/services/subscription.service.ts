import { serviceRequest } from "@/services/service-client";

export interface Plan {
  id: string;
  name: string;
  display_name: string;
  price: number;
  currency: string;
  student_limit: number;
  features: string[];
  is_custom: boolean;
  popular: boolean;
}

export interface Subscription {
  id: string;
  school_id: string;
  plan_name: string;
  student_limit: number;
  price: number;
  currency: string;
  start_date: string;
  end_date: string;
  status: string;
  is_trial: boolean;
  trial_used: boolean;
  trial_start_date?: string;
  trial_end_date?: string;
}

export interface CurrentSubscription {
  subscription: Subscription | null;
  students_used: number;
  students_limit: number;
  days_remaining: number;
  is_expired: boolean;
  can_trial: boolean;
}

export interface HistoryEntry {
  id: string;
  plan_name: string;
  student_limit: number;
  amount: number;
  payment_status: string;
  start_date: string;
  end_date: string;
  action: string;
  created_at: string;
}

export function getCurrent() {
  return serviceRequest<CurrentSubscription>("/api/subscription/current");
}

export function getPlans() {
  return serviceRequest<Plan[]>("/api/subscription/plans");
}

export function startTrial() {
  return serviceRequest<Subscription>("/api/subscription/start-trial", { method: "POST" });
}

export function upgradePlan(planName: string, studentLimit?: number) {
  return serviceRequest<Subscription>("/api/subscription/upgrade", {
    method: "POST",
    body: JSON.stringify({ plan_name: planName, student_limit: studentLimit }),
  });
}

export function getHistory() {
  return serviceRequest<HistoryEntry[]>("/api/subscription/history");
}

export function submitPaymentProof(data: {
  plan_id: string;
  payment_method_id?: string;
  screenshot_url?: string;
  transaction_id: string;
  amount: number;
  notes?: string;
}) {
  return serviceRequest("/api/payment/upload", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

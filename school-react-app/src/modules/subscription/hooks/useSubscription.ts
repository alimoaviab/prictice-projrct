import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as service from "../services/subscription.service";
import { showToast } from "@/utils/toast";

export function useSubscription() {
  const queryClient = useQueryClient();

  const currentQuery = useQuery({
    queryKey: ["subscription", "current"],
    queryFn: async () => {
      const res = await service.getCurrent();
      if (!res.ok) throw new Error(res.error?.message || "Failed to load subscription");
      return res.data!;
    },
    staleTime: 5 * 60 * 1000,
  });

  const plansQuery = useQuery({
    queryKey: ["subscription", "plans"],
    queryFn: async () => {
      const res = await service.getPlans();
      if (!res.ok) throw new Error(res.error?.message || "Failed to load plans");
      return res.data!;
    },
    staleTime: 60 * 60 * 1000, // Plans rarely change
  });

  const historyQuery = useQuery({
    queryKey: ["subscription", "history"],
    queryFn: async () => {
      const res = await service.getHistory();
      if (!res.ok) throw new Error(res.error?.message || "Failed to load history");
      return res.data!;
    },
    staleTime: 5 * 60 * 1000,
  });

  const startTrialMutation = useMutation({
    mutationFn: service.startTrial,
    onSuccess: (res) => {
      if (res.ok) {
        showToast("Your 14-day free trial has started! Enjoy all Growth Plan features.", "success");
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
      } else {
        showToast(res.error?.message || "Failed to start trial", "error");
      }
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: ({ planName, studentLimit }: { planName: string; studentLimit?: number }) =>
      service.upgradePlan(planName, studentLimit),
    onSuccess: (res) => {
      if (res.ok) {
        showToast("Subscription upgraded successfully!", "success");
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
      } else {
        showToast(res.error?.message || "Failed to upgrade", "error");
      }
    },
  });

  return {
    current: currentQuery.data,
    plans: plansQuery.data ?? [],
    history: historyQuery.data ?? [],
    isLoading: currentQuery.isLoading || plansQuery.isLoading,
    startTrial: startTrialMutation.mutateAsync,
    upgradePlan: upgradeMutation.mutateAsync,
    isUpgrading: upgradeMutation.isPending,
    isStartingTrial: startTrialMutation.isPending,
  };
}

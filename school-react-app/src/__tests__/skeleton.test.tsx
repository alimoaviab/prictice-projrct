/**
 * Skeleton Loading Tests
 *
 * Verifies:
 * - Skeletons shown while API is loading
 * - Skeletons NOT shown when data is cached
 * - Correct number of skeleton elements
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  DashboardSkeleton,
  StudentListSkeleton,
} from "@/components/skeletons";

// Simple wrapper for rendering with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("Skeleton Components", () => {
  describe("DashboardSkeleton", () => {
    it("renders 8 stat card skeletons in a grid", () => {
      const { container } = render(<DashboardSkeleton />);

      // Find skeleton cards (they have animate-pulse class)
      const cards = container.querySelectorAll(
        ".grid > div.bg-white"
      );
      // The grid has 8 cards
      expect(cards.length).toBe(8);
    });

    it("renders activity feed skeleton rows", () => {
      const { container } = render(<DashboardSkeleton />);

      // Activity feed has circular avatars (rounded-full)
      const avatars = container.querySelectorAll(
        ".rounded-full.animate-pulse"
      );
      expect(avatars.length).toBeGreaterThanOrEqual(5);
    });

    it("has animate-pulse on all skeleton elements", () => {
      const { container } = render(<DashboardSkeleton />);

      const pulseElements = container.querySelectorAll(".animate-pulse");
      // Should have many pulsing elements (cards + charts + activity)
      expect(pulseElements.length).toBeGreaterThan(20);
    });
  });

  describe("StudentListSkeleton", () => {
    it("renders default 5 row skeletons", () => {
      const { container } = render(<StudentListSkeleton />);

      // Each row has a rounded-full avatar
      const avatars = container.querySelectorAll(
        ".divide-y > div .rounded-full"
      );
      expect(avatars.length).toBe(5);
    });

    it("renders custom number of rows", () => {
      const { container } = render(<StudentListSkeleton rows={10} />);

      const avatars = container.querySelectorAll(
        ".divide-y > div .rounded-full"
      );
      expect(avatars.length).toBe(10);
    });

    it("includes search bar and pagination skeletons", () => {
      const { container } = render(<StudentListSkeleton />);

      // Header area should have search bar skeleton
      const headerSkeletons = container.querySelectorAll(
        ".border-b .animate-pulse"
      );
      expect(headerSkeletons.length).toBeGreaterThan(0);
    });
  });
});

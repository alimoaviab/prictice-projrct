import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { LiveExamService } from "../../../services/exams/live-exam.service";

export const getLiveExamsTool = tool(
  async ({ status }: { status?: string }, config: any) => {
    const ctx = config.configurable?.ctx;
    if (!ctx) return JSON.stringify({ error: "Missing context" });

    try {
      const filters = status ? { status } : {};
      const exams = await LiveExamService.getExams(ctx, filters);
      return JSON.stringify({ success: true, exams });
    } catch (error: any) {
      return JSON.stringify({ error: error.message });
    }
  },
  {
    name: "get_live_exams",
    description: "Get a list of live exams, optionally filtered by status (draft, scheduled, active, completed).",
    schema: z.object({
      status: z.string().optional().describe("The status of the exams to fetch")
    })
  }
);

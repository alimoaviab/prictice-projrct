import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { listAttendance } from "../../services/attendance.service";
import { RequestContext } from "../../types/core";

export const getAttendanceTool = tool(
  async ({ class_id, date, student_id }, config) => {
    const ctx = config.configurable?.context as RequestContext;
    if (!ctx) {
      throw new Error("RequestContext is missing in tool config");
    }

    try {
      const result = await listAttendance(ctx, { class_id, date, student_id });
      if (result.success) {
        return JSON.stringify(result.data);
      }
      return JSON.stringify({ error: result.error });
    } catch (err: any) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: "get_attendance",
    description: "Fetches attendance records. Use this to find who is absent or present.",
    schema: z.object({
      class_id: z.string().optional().describe("The ID of the class"),
      date: z.string().optional().describe("The date of attendance (YYYY-MM-DD)"),
      student_id: z.string().optional().describe("The ID of a specific student")
    }),
  }
);

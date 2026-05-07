import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { listStudents } from "../../services/student.service";
import { RequestContext } from "../../types/core";

export const getStudentsTool = tool(
  async ({ class_id, status }, config) => {
    const ctx = config.configurable?.context as RequestContext;
    if (!ctx) {
      throw new Error("RequestContext is missing in tool config");
    }

    try {
      const result = await listStudents(ctx, { class_id, status });
      if (result.success) {
        return JSON.stringify(result.data);
      }
      return JSON.stringify({ error: result.error });
    } catch (err: any) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: "get_students",
    description: "Fetches a list of students, optionally filtered by class_id or status. Use this to find student information.",
    schema: z.object({
      class_id: z.string().optional().describe("The ID of the class to filter by"),
      status: z.string().optional().describe("The status of the student (e.g., 'active', 'inactive')")
    }),
  }
);

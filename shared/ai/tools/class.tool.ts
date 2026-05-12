import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { listClasses, getClass } from "../../services/class.service";
import { RequestContext } from "../../types/core";

export const getClassesTool = tool(
  async ({ id, academic_year_id }, config) => {
    const ctx = config.configurable?.context as RequestContext;
    if (!ctx) {
      throw new Error("RequestContext is missing in tool config");
    }

    // ✅ SECURITY: Verify school_id exists (multi-tenant isolation)
    if (!ctx.school_id) {
      return JSON.stringify({ 
        error: "School context missing. Cannot access data." 
      });
    }

    try {
      if (id) {
        const result = await getClass(ctx, id);
        if (result.success) {
          // ✅ SECURITY: Verify data belongs to same school
          if (result.data?.school_id && result.data.school_id !== ctx.school_id) {
            return JSON.stringify({ 
              error: "Access denied. This data belongs to another school." 
            });
          }
          return JSON.stringify(result.data);
        }
        return JSON.stringify({ error: result.error });
      } else {
        // ✅ SECURITY: Automatically filter by school_id
        const filters = {
          ...( academic_year_id ? { academic_year_id } : {}),
          school_id: ctx.school_id // Always filter by school
        };
        
        const result = await listClasses(ctx, filters);
        if (result.success) {
          return JSON.stringify(result.data);
        }
        return JSON.stringify({ error: result.error });
      }
    } catch (err: any) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: "get_school_classes",
    description: "Fetches a list of classes or details of a specific class for the current school only. Use this to find class IDs or enrollment info.",
    schema: z.object({
      id: z.string().optional().describe("The ID of a specific class to fetch details for"),
      academic_year_id: z.string().optional().describe("Optional filter by academic year ID")
    }),
  }
);

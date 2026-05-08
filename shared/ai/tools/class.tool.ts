import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { listClasses, getClass } from "../../services/class.service";
import { RequestContext } from "../../types/core";

export const getClassesTool = tool(
  async ({ id, academy_care_id }, config) => {
    const ctx = config.configurable?.context as RequestContext;
    if (!ctx) {
      throw new Error("RequestContext is missing in tool config");
    }

    try {
      if (id) {
        const result = await getClass(ctx, id);
        if (result.success) {
          return JSON.stringify(result.data);
        }
        return JSON.stringify({ error: result.error });
      } else {
        const result = await listClasses(ctx, academy_care_id ? { academy_care_id } : {});
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
    name: "get_classes",
    description: "Fetches a list of classes or details of a specific class. Use this to find class IDs or enrollment info.",
    schema: z.object({
      id: z.string().optional().describe("The ID of a specific class to fetch details for"),
      academy_care_id: z.string().optional().describe("Optional filter by academic year ID")
    }),
  }
);

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { RequestContext } from "../../types/core";

export const getTeachersTool = tool(
  async ({ id, subject }, config) => {
    const ctx = config.configurable?.context as RequestContext;
    if (!ctx) {
      throw new Error("RequestContext is missing in tool config");
    }

    try {
      // TODO: Implement actual teacher service call
      // For now, return sample data
      const sampleTeachers = [
        {
          id: "t1",
          name: "Mr. Tariq Mahmood",
          subjects: ["Mathematics", "Physics"],
          classes: ["Grade 6-A", "Grade 7-B"],
          email: "tariq@school.com",
          phone: "0300-1234567"
        },
        {
          id: "t2",
          name: "Mrs. Sadia Afzal",
          subjects: ["Urdu", "Islamiat"],
          classes: ["Grade 6-A", "Grade 6-B"],
          email: "sadia@school.com",
          phone: "0301-7654321"
        }
      ];

      if (id) {
        const teacher = sampleTeachers.find(t => t.id === id);
        return JSON.stringify(teacher || { error: "Teacher not found" });
      }

      if (subject) {
        const filtered = sampleTeachers.filter(t => 
          t.subjects.some(s => s.toLowerCase().includes(subject.toLowerCase()))
        );
        return JSON.stringify(filtered);
      }

      return JSON.stringify(sampleTeachers);
    } catch (err: any) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: "get_teachers",
    description: "Fetches list of teachers or details of a specific teacher. Use this to find teacher information, subjects they teach, and their assigned classes.",
    schema: z.object({
      id: z.string().optional().describe("The ID of a specific teacher"),
      subject: z.string().optional().describe("Filter teachers by subject they teach")
    }),
  }
);

import { ToolNode } from "@langchain/langgraph/prebuilt";
import { getStudentsTool } from "./student.tool";
import { getAttendanceTool } from "./attendance.tool";
import { getClassesTool } from "./class.tool";

export const aiTools = [
  getStudentsTool,
  getAttendanceTool,
  getClassesTool
];

export const toolsNode = new ToolNode(aiTools);

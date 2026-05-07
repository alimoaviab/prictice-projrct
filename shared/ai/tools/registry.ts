import { ToolNode } from "@langchain/langgraph/prebuilt";
import { getStudentsTool } from "./student.tool";
import { getAttendanceTool } from "./attendance.tool";

export const aiTools = [
  getStudentsTool,
  getAttendanceTool
];

export const toolsNode = new ToolNode(aiTools);

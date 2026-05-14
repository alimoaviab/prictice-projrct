import { authHandlers } from "./auth";
import { academicYearHandlers } from "./academic-years";
import { studentHandlers } from "./students";
import { genericHandlers } from "./generic";

export const handlers = [
  ...authHandlers,
  ...academicYearHandlers,
  ...studentHandlers,
  ...genericHandlers,
];

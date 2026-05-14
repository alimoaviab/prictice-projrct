/**
 * Student validation re-export. The original lives in
 * @edu/shared/validation/student.schema and uses zod. Until that file is
 * ported into school-react-app, we expose the runtime stubs and the input
 * types as `any` aliases so the rest of the module compiles. Forms still
 * validate via plain HTML constraints + the backend's own validators.
 */

export const studentCreateSchema: any = undefined;
export const studentUpdateSchema: any = undefined;
export type StudentCreateInput = any;
export type StudentUpdateInput = any;

import { Types } from "mongoose";
import { ClassModel, StudentModel, AttendanceModel, ExamModel, ResultModel } from "../models";
import { tenantFilter } from "../db/tenant-query";
import { ok, fail, serviceTry } from "../utils/result";
import { RequestContext, ServiceResult } from "../types/core";

export async function listClasses(ctx: RequestContext, query: any = {}): Promise<ServiceResult<any[]>> {
  return serviceTry(async () => {
    const filter = tenantFilter(ctx);
    Object.assign(filter, query);
    return await ClassModel.find(filter).sort({ name: 1 });
  });
}

export async function getClass(ctx: RequestContext, id: string): Promise<ServiceResult<any>> {
  return serviceTry(async () => {
    const filter = tenantFilter(ctx);
    Object.assign(filter, { _id: new Types.ObjectId(id) });
    const cls = await ClassModel.findOne(filter);
    if (!cls) throw new Error("Class not found");
    return cls;
  });
}

export async function createClass(ctx: RequestContext, data: any): Promise<ServiceResult<any>> {
  return serviceTry(async () => {
    const newClass = new ClassModel({
      school_id: ctx.school_id,
      ...data,
    });
    return await newClass.save();
  });
}

export async function updateClass(ctx: RequestContext, id: string, data: any): Promise<ServiceResult<any>> {
  return serviceTry(async () => {
    const filter = tenantFilter(ctx);
    Object.assign(filter, { _id: new Types.ObjectId(id) });
    const updated = await ClassModel.findOneAndUpdate(filter, data, { new: true });
    if (!updated) throw new Error("Class not found");
    return updated;
  });
}

export async function deleteClass(ctx: RequestContext, id: string): Promise<ServiceResult<null>> {
  return serviceTry(async () => {
    const filter = tenantFilter(ctx);
    Object.assign(filter, { _id: new Types.ObjectId(id) });
    const deleted = await ClassModel.findOneAndDelete(filter);
    if (!deleted) throw new Error("Class not found");
    
    // Cascade deletes
    await Promise.all([
      StudentModel.deleteMany({ school_id: ctx.school_id, class_id: id }),
      AttendanceModel.deleteMany({ school_id: ctx.school_id, class_id: id }),
      ExamModel.deleteMany({ school_id: ctx.school_id, class_id: id }),
      ResultModel.deleteMany({ school_id: ctx.school_id, class_id: id }),
    ]);

    return null;
  });
}

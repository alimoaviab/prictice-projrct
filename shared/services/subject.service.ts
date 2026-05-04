import { Types } from "mongoose";
import { connectDb } from "../db/connect";
import { SubjectModel } from "../models";
import { tenantFilter } from "../db/tenant-query";
import { ok, fail, serviceTry } from "../utils/result";
import { RequestContext, ServiceResult } from "../types/core";

export async function listSubjects(ctx: RequestContext, query: any = {}): Promise<ServiceResult<any[]>> {
    return serviceTry(async () => {
        await connectDb();
        const filter = tenantFilter(ctx);
        Object.assign(filter, query);
        return await SubjectModel.find(filter).sort({ name: 1 });
    });
}

export async function getSubject(ctx: RequestContext, id: string): Promise<ServiceResult<any>> {
    return serviceTry(async () => {
        await connectDb();
        const filter = tenantFilter(ctx);
        Object.assign(filter, { _id: new Types.ObjectId(id) });
        const subject = await SubjectModel.findOne(filter);
        if (!subject) throw new Error("Subject not found");
        return subject;
    });
}

export async function createSubject(ctx: RequestContext, data: any): Promise<ServiceResult<any>> {
    return serviceTry(async () => {
        await connectDb();
        try {
            const newSubject = new SubjectModel({
                school_id: ctx.school_id,
                ...data,
            });
            return await newSubject.save();
        } catch (error: any) {
            if (error.code === 11000) throw new Error("Subject with this name already exists");
            throw error;
        }
    });
}

export async function updateSubject(ctx: RequestContext, id: string, data: any): Promise<ServiceResult<any>> {
    return serviceTry(async () => {
        await connectDb();
        try {
            const filter = tenantFilter(ctx);
            Object.assign(filter, { _id: new Types.ObjectId(id) });
            const updated = await SubjectModel.findOneAndUpdate(filter, data, { new: true });
            if (!updated) throw new Error("Subject not found");
            return updated;
        } catch (error: any) {
            if (error.code === 11000) throw new Error("Subject with this name already exists");
            throw error;
        }
    });
}

export async function deleteSubject(ctx: RequestContext, id: string): Promise<ServiceResult<null>> {
    return serviceTry(async () => {
        await connectDb();
        const filter = tenantFilter(ctx);
        Object.assign(filter, { _id: new Types.ObjectId(id) });
        const deleted = await SubjectModel.findOneAndDelete(filter);
        if (!deleted) throw new Error("Subject not found");
        return null;
    });
}

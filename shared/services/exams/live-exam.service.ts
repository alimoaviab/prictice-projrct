import { Types } from "mongoose";
import { LiveExamModel, ExamQuestionModel, ExamSubmissionModel, ExamViolationModel } from "../../models";
import { tenantFilter } from "../../db/tenant-query";
import { RequestContext } from "../../types/core";

export class LiveExamService {
  static async createExam(ctx: RequestContext, data: any) {
    const exam = new LiveExamModel(tenantFilter(ctx, data));
    await exam.save();
    return exam;
  }

  static async getExams(ctx: RequestContext, filters: any = {}) {
    return LiveExamModel.find(tenantFilter(ctx, filters)).lean();
  }

  static async getExamById(ctx: RequestContext, examId: string) {
    return LiveExamModel.findOne(tenantFilter(ctx, { _id: examId })).populate("questions").lean();
  }

  static async updateExam(ctx: RequestContext, examId: string, data: any) {
    return LiveExamModel.findOneAndUpdate(tenantFilter(ctx, { _id: examId }), data, { new: true }).lean();
  }

  static async addQuestions(ctx: RequestContext, examId: string, questionsData: any[]) {
    const questions = await ExamQuestionModel.insertMany(
      questionsData.map(q => ({ ...tenantFilter(ctx, {}), exam_id: examId, ...q }))
    );
    await LiveExamModel.updateOne(
      tenantFilter(ctx, { _id: examId }),
      { $push: { questions: { $each: questions.map(q => q._id) } } }
    );
    return questions;
  }

  static async startExamAttempt(ctx: RequestContext, examId: string, studentId: string) {
    const exam = await LiveExamModel.findOne(tenantFilter(ctx, { _id: examId }));
    if (!exam) throw new Error("Exam not found");
    if (exam.status !== "active") throw new Error("Exam is not active");

    const now = new Date();
    if (now < exam.start_time || now > exam.end_time) {
      throw new Error("Exam is not currently available");
    }

    let submission = await ExamSubmissionModel.findOne(tenantFilter(ctx, { exam_id: examId, student_id: studentId }));
    if (!submission) {
      submission = new ExamSubmissionModel(tenantFilter(ctx, {
        exam_id: examId,
        student_id: studentId,
        start_time: now,
        status: "in_progress",
        remaining_time: exam.duration * 60
      }));
      await submission.save();
    }
    return submission;
  }

  static async saveAnswers(ctx: RequestContext, submissionId: string, answers: any[], remainingTime: number) {
    return ExamSubmissionModel.findOneAndUpdate(
      tenantFilter(ctx, { _id: submissionId }),
      { answers, remaining_time: remainingTime },
      { new: true }
    );
  }

  static async submitExam(ctx: RequestContext, submissionId: string, isAutoSubmit: boolean = false) {
     return ExamSubmissionModel.findOneAndUpdate(
      tenantFilter(ctx, { _id: submissionId }),
      { status: isAutoSubmit ? "auto_submitted" : "submitted", end_time: new Date(), auto_submitted: isAutoSubmit },
      { new: true }
    );
  }

  static async logViolation(ctx: RequestContext, data: any) {
      const violation = new ExamViolationModel(tenantFilter(ctx, data));
      await violation.save();

      // Update submission suspicious activity count
      await ExamSubmissionModel.updateOne(
          tenantFilter(ctx, { exam_id: data.exam_id, student_id: data.student_id }),
          { $inc: { suspicious_activities: 1 } }
      );

      return violation;
  }
}

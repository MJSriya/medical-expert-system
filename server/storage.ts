import { db } from "./db";
import {
  adviceItems,
  assessments,
  caseSymptoms,
  cases,
  conditionSuggestions,
  type AdviceItem,
  type Assessment,
  type Case,
  type CaseSymptom,
  type ConditionSuggestion,
  type CreateAdviceItemRequest,
  type CreateAssessmentRequest,
  type CreateCaseRequest,
  type CreateCaseSymptomRequest,
  type CreateConditionSuggestionRequest,
  type CaseDetailResponse,
  type UpdateCaseRequest,
} from "@shared/schema";
import { and, desc, eq, lt } from "drizzle-orm";

export interface IStorage {
  listCases(limit: number, cursor?: number): Promise<{ items: Case[]; nextCursor?: number }>;
  getCaseDetail(id: number): Promise<CaseDetailResponse | undefined>;
  createCase(input: CreateCaseRequest): Promise<Case>;
  updateCase(id: number, updates: UpdateCaseRequest): Promise<Case>;

  addSymptom(caseId: number, input: CreateCaseSymptomRequest): Promise<CaseSymptom>;
  listSymptoms(caseId: number): Promise<CaseSymptom[]>;

  upsertAssessment(caseId: number, input: CreateAssessmentRequest): Promise<Assessment>;
  getAssessment(caseId: number): Promise<Assessment | undefined>;

  replaceSuggestions(caseId: number, items: CreateConditionSuggestionRequest[]): Promise<ConditionSuggestion[]>;
  replaceAdvice(caseId: number, items: CreateAdviceItemRequest[]): Promise<AdviceItem[]>;
}

export class DatabaseStorage implements IStorage {
  async listCases(limit: number, cursor?: number): Promise<{ items: Case[]; nextCursor?: number }> {
    const where = cursor ? lt(cases.id, cursor) : undefined;
    const items = await db
      .select()
      .from(cases)
      .where(where)
      .orderBy(desc(cases.id))
      .limit(limit);

    const nextCursor = items.length === limit ? items[items.length - 1]!.id : undefined;
    return { items, nextCursor };
  }

  async getCaseDetail(id: number): Promise<CaseDetailResponse | undefined> {
    const [c] = await db.select().from(cases).where(eq(cases.id, id));
    if (!c) return undefined;

    const [assessment] = await db.select().from(assessments).where(eq(assessments.caseId, id));
    const symptoms = await db.select().from(caseSymptoms).where(eq(caseSymptoms.caseId, id)).orderBy(caseSymptoms.id);
    const suggestions = await db
      .select()
      .from(conditionSuggestions)
      .where(eq(conditionSuggestions.caseId, id))
      .orderBy(desc(conditionSuggestions.likelihood), conditionSuggestions.id);
    const advice = await db.select().from(adviceItems).where(eq(adviceItems.caseId, id)).orderBy(adviceItems.id);

    return {
      case: c,
      symptoms,
      assessment: assessment ?? undefined,
      suggestions,
      advice,
    };
  }

  async createCase(input: CreateCaseRequest): Promise<Case> {
    const [created] = await db.insert(cases).values(input).returning();
    return created;
  }

  async updateCase(id: number, updates: UpdateCaseRequest): Promise<Case> {
    const [updated] = await db.update(cases).set(updates).where(eq(cases.id, id)).returning();
    return updated;
  }

  async addSymptom(caseId: number, input: CreateCaseSymptomRequest): Promise<CaseSymptom> {
    const [created] = await db.insert(caseSymptoms).values({ ...input, caseId }).returning();
    return created;
  }

  async listSymptoms(caseId: number): Promise<CaseSymptom[]> {
    return db.select().from(caseSymptoms).where(eq(caseSymptoms.caseId, caseId)).orderBy(caseSymptoms.id);
  }

  async upsertAssessment(caseId: number, input: CreateAssessmentRequest): Promise<Assessment> {
    const existing = await this.getAssessment(caseId);
    if (!existing) {
      const [created] = await db.insert(assessments).values({ ...input, caseId }).returning();
      return created;
    }
    const [updated] = await db
      .update(assessments)
      .set({ ...input, caseId })
      .where(eq(assessments.caseId, caseId))
      .returning();
    return updated;
  }

  async getAssessment(caseId: number): Promise<Assessment | undefined> {
    const [a] = await db.select().from(assessments).where(eq(assessments.caseId, caseId));
    return a;
  }

  async replaceSuggestions(
    caseId: number,
    items: CreateConditionSuggestionRequest[],
  ): Promise<ConditionSuggestion[]> {
    await db.delete(conditionSuggestions).where(eq(conditionSuggestions.caseId, caseId));
    if (items.length === 0) return [];
    return db
      .insert(conditionSuggestions)
      .values(items.map((i) => ({ ...i, caseId })))
      .returning();
  }

  async replaceAdvice(caseId: number, items: CreateAdviceItemRequest[]): Promise<AdviceItem[]> {
    await db.delete(adviceItems).where(eq(adviceItems.caseId, caseId));
    if (items.length === 0) return [];
    return db
      .insert(adviceItems)
      .values(items.map((i) => ({ ...i, caseId })))
      .returning();
  }
}

export const storage = new DatabaseStorage();

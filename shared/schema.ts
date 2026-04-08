import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const triageLevelEnum = pgEnum("triage_level", [
  "emergency",
  "urgent",
  "routine",
  "self_care",
]);

export const symptomSeverityEnum = pgEnum("symptom_severity", [
  "mild",
  "moderate",
  "severe",
]);

export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  age: integer("age"),
  sexAtBirth: text("sex_at_birth"),
  pregnant: boolean("pregnant"),
  symptomsText: text("symptoms_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const caseSymptoms = pgTable("case_symptoms", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  severity: symptomSeverityEnum("severity").notNull(),
  durationDays: integer("duration_days"),
});

export const conditionSuggestions = pgTable("condition_suggestions", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  likelihood: integer("likelihood").notNull(),
  rationale: text("rationale").notNull(),
});

export const adviceItems = pgTable("advice_items", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  text: text("text").notNull(),
});

export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  triageLevel: triageLevelEnum("triage_level").notNull(),
  summary: text("summary").notNull(),
  redFlags: text("red_flags").array().notNull().default(sql`'{}'::text[]`),
  followUpQuestions: text("follow_up_questions")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  homeCare: text("home_care").array().notNull().default(sql`'{}'::text[]`),
  whatToTellDoctor: text("what_to_tell_doctor")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  safetyDisclaimer: text("safety_disclaimer").notNull(),
  modelInfo: jsonb("model_info").$type<{ model: string; generatedAt: string }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
  createdAt: true,
});

export const insertCaseSymptomSchema = createInsertSchema(caseSymptoms).omit({
  id: true,
  caseId: true,
});

export const insertConditionSuggestionSchema = createInsertSchema(
  conditionSuggestions,
).omit({ id: true, caseId: true });

export const insertAdviceItemSchema = createInsertSchema(adviceItems).omit({
  id: true,
  caseId: true,
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  caseId: true,
  createdAt: true,
});

export type Case = typeof cases.$inferSelect;
export type CaseSymptom = typeof caseSymptoms.$inferSelect;
export type ConditionSuggestion = typeof conditionSuggestions.$inferSelect;
export type AdviceItem = typeof adviceItems.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;

export type CreateCaseRequest = z.infer<typeof insertCaseSchema>;
export type CreateCaseSymptomRequest = z.infer<typeof insertCaseSymptomSchema>;
export type CreateAssessmentRequest = z.infer<typeof insertAssessmentSchema>;
export type CreateConditionSuggestionRequest = z.infer<
  typeof insertConditionSuggestionSchema
>;
export type CreateAdviceItemRequest = z.infer<typeof insertAdviceItemSchema>;

export type UpdateCaseRequest = Partial<CreateCaseRequest>;

export type CaseResponse = Case;
export type CaseDetailResponse = {
  case: Case;
  symptoms: CaseSymptom[];
  assessment?: Assessment;
  suggestions: ConditionSuggestion[];
  advice: AdviceItem[];
};

export interface CaseListQuery {
  limit?: number;
  cursor?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: number;
}

export * from "./models/chat";

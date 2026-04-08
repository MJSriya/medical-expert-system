import { z } from "zod";
import {
  symptomSeverityEnum,
  triageLevelEnum,
  insertCaseSchema,
  insertCaseSymptomSchema,
  cases,
  caseSymptoms,
  assessments,
  conditionSuggestions,
  adviceItems,
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
} as const;

const triageLevel = z.enum(triageLevelEnum.enumValues);
const symptomSeverity = z.enum(symptomSeverityEnum.enumValues);

export const caseSymptomInputSchema = insertCaseSymptomSchema.extend({
  severity: symptomSeverity,
  durationDays: z.number().int().min(0).max(3650).optional(),
});

export const createCaseInputSchema = insertCaseSchema
  .extend({
    age: z.number().int().min(0).max(120).optional(),
    pregnant: z.boolean().optional(),
    symptoms: z.array(caseSymptomInputSchema).min(1).max(20),
  })
  .refine(
    (v) => {
      if (v.pregnant === true && v.sexAtBirth && v.sexAtBirth !== "female") {
        return false;
      }
      return true;
    },
    { message: "Pregnancy is only applicable when sex at birth is female", path: ["pregnant"] },
  );

export const api = {
  cases: {
    list: {
      method: "GET" as const,
      path: "/api/cases" as const,
      input: z
        .object({
          limit: z.coerce.number().int().min(1).max(50).optional(),
          cursor: z.coerce.number().int().min(1).optional(),
        })
        .optional(),
      responses: {
        200: z.object({
          items: z.array(z.custom<typeof cases.$inferSelect>()),
          nextCursor: z.number().optional(),
        }),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/cases/:id" as const,
      responses: {
        200: z.object({
          case: z.custom<typeof cases.$inferSelect>(),
          symptoms: z.array(z.custom<typeof caseSymptoms.$inferSelect>()),
          assessment: z.custom<typeof assessments.$inferSelect>().optional(),
          suggestions: z.array(z.custom<typeof conditionSuggestions.$inferSelect>()),
          advice: z.array(z.custom<typeof adviceItems.$inferSelect>()),
        }),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/cases" as const,
      input: createCaseInputSchema,
      responses: {
        201: z.custom<typeof cases.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    assess: {
      method: "POST" as const,
      path: "/api/cases/:id/assess" as const,
      input: z.object({
        additionalInfo: z.string().max(2000).optional(),
      }),
      responses: {
        200: z.custom<typeof assessments.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    },
  },
} as const;

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type CreateCaseInput = z.infer<typeof api.cases.create.input>;
export type CaseListResponse = z.infer<typeof api.cases.list.responses[200]>;
export type CaseDetailResponse = z.infer<typeof api.cases.get.responses[200]>;
export type AssessmentResponse = z.infer<typeof api.cases.assess.responses[200]>;
export type ValidationError = z.infer<typeof errorSchemas.validation>;
export type NotFoundError = z.infer<typeof errorSchemas.notFound>;
export type InternalError = z.infer<typeof errorSchemas.internal>;

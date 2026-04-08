import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type {
  AssessmentResponse,
  CaseDetailResponse,
  CaseListResponse,
  CreateCaseInput,
} from "@shared/routes";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useCases(params?: z.infer<(typeof api.cases.list)["input"]>) {
  return useQuery<CaseListResponse>({
    queryKey: [api.cases.list.path, params ?? {}],
    queryFn: async () => {
      const validated = api.cases.list.input?.safeParse(params ?? undefined);
      if (validated && !validated.success) {
        console.error("[Zod] cases.list input validation failed:", validated.error.format());
      }

      const url = new URL(api.cases.list.path, window.location.origin);
      const p = validated && validated.success ? validated.data : params;
      if (p?.limit != null) url.searchParams.set("limit", String(p.limit));
      if (p?.cursor != null) url.searchParams.set("cursor", String(p.cursor));

      const res = await fetch(url.toString().replace(window.location.origin, ""), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch cases");
      const json = await res.json();
      return parseWithLogging(api.cases.list.responses[200], json, "cases.list.responses[200]");
    },
  });
}

export function useCase(id: number) {
  return useQuery<CaseDetailResponse | null>({
    queryKey: [api.cases.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.cases.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch case");
      const json = await res.json();
      return parseWithLogging(api.cases.get.responses[200], json, "cases.get.responses[200]");
    },
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCaseInput) => {
      const validated = api.cases.create.input.safeParse(input);
      if (!validated.success) {
        console.error("[Zod] cases.create input validation failed:", validated.error.format());
        throw validated.error;
      }

      const res = await fetch(api.cases.create.path, {
        method: api.cases.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated.data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const errJson = await res.json().catch(() => ({}));
          const parsed = api.cases.create.responses[400].safeParse(errJson);
          if (parsed.success) throw new Error(parsed.data.message);
          throw new Error("Invalid input");
        }
        throw new Error("Failed to create case");
      }

      const json = await res.json();
      return parseWithLogging(api.cases.create.responses[201], json, "cases.create.responses[201]");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [api.cases.list.path] });
    },
  });
}

export function useAssessCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: number; additionalInfo?: string }) => {
      const url = buildUrl(api.cases.assess.path, { id: vars.id });
      const validated = api.cases.assess.input.safeParse({
        additionalInfo: vars.additionalInfo,
      });
      if (!validated.success) {
        console.error("[Zod] cases.assess input validation failed:", validated.error.format());
        throw validated.error;
      }

      const res = await fetch(url, {
        method: api.cases.assess.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated.data),
        credentials: "include",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        if (res.status === 400) {
          const parsed = api.cases.assess.responses[400].safeParse(json);
          if (parsed.success) throw new Error(parsed.data.message);
          throw new Error("Invalid input");
        }
        if (res.status === 404) {
          const parsed = api.cases.assess.responses[404].safeParse(json);
          if (parsed.success) throw new Error(parsed.data.message);
          throw new Error("Case not found");
        }
        if (res.status === 500) {
          const parsed = api.cases.assess.responses[500].safeParse(json);
          if (parsed.success) throw new Error(parsed.data.message);
          throw new Error("Assessment failed");
        }
        throw new Error("Assessment failed");
      }

      const json = await res.json();
      const parsed = parseWithLogging(api.cases.assess.responses[200], json, "cases.assess.responses[200]");
      return parsed as AssessmentResponse;
    },
    onSuccess: (_assessment, vars) => {
      qc.invalidateQueries({ queryKey: [api.cases.get.path, vars.id] });
      qc.invalidateQueries({ queryKey: [api.cases.list.path] });
    },
  });
}

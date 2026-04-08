import type { Express } from "express";
import type { Server } from "http";
import OpenAI from "openai";
import { z } from "zod";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function zodToValidationError(err: z.ZodError): z.infer<typeof errorSchemas.validation> {
  const first = err.errors[0];
  return {
    message: first?.message ?? "Invalid request",
    field: first?.path?.length ? first.path.join(".") : undefined,
  };
}

const assessmentOutputSchema = z
  .object({
    triageLevel: z.enum(["emergency", "urgent", "routine", "self_care"]),
    summary: z.string().min(1),
    redFlags: z.array(z.string()).max(15),
    followUpQuestions: z.array(z.string()).max(10),
    homeCare: z.array(z.string()).max(12),
    whatToTellDoctor: z.array(z.string()).max(10),
    suggestions: z
      .array(
        z.object({
          name: z.string().min(1),
          likelihood: z.number().int().min(1).max(100),
          rationale: z.string().min(1),
        }),
      )
      .max(8),
    advice: z
      .array(
        z.object({
          category: z.enum(["urgent", "home_care", "monitor", "doctor_visit"]),
          text: z.string().min(1),
        }),
      )
      .max(15),
    safetyDisclaimer: z.string().min(1),
  });

async function seedDatabase(): Promise<void> {
  const existing = await storage.listCases(1);
  if (existing.items.length > 0) return;

  const c = await storage.createCase({
    age: 28,
    sexAtBirth: "female",
    pregnant: false,
    symptomsText: "Sore throat, runny nose, mild fever, tiredness",
  });

  await storage.addSymptom(c.id, { name: "Sore throat", severity: "moderate", durationDays: 2 });
  await storage.addSymptom(c.id, { name: "Runny nose", severity: "mild", durationDays: 3 });
  await storage.addSymptom(c.id, { name: "Fever", severity: "mild", durationDays: 1 });
  await storage.addSymptom(c.id, { name: "Fatigue", severity: "mild", durationDays: 2 });

  await storage.upsertAssessment(c.id, {
    triageLevel: "self_care",
    summary:
      "This sounds most consistent with a common viral upper respiratory infection. Most cases improve with rest, fluids, and symptom relief. Seek medical care if symptoms worsen or you develop trouble breathing.",
    redFlags: ["Trouble breathing", "Severe chest pain", "Confusion", "Blue lips/face"],
    followUpQuestions: [
      "Do you have shortness of breath, wheezing, or chest pain?",
      "Have you had a high fever (39°C/102.2°F) for more than 3 days?",
      "Any severe headache, stiff neck, or rash?",
    ],
    homeCare: [
      "Rest and drink plenty of fluids",
      "Warm salt-water gargles for sore throat",
      "Honey in warm tea (avoid for children under 1 year)",
      "Use a humidifier or warm shower steam to ease congestion",
    ],
    whatToTellDoctor: [
      "Symptom start date and progression",
      "Highest measured temperature and how long it lasted",
      "Any breathing symptoms or chest pain",
      "Relevant medical conditions and medications",
    ],
    safetyDisclaimer:
      "This tool provides general educational information and is not a diagnosis or a substitute for professional medical advice. If you feel very unwell or symptoms worsen, seek urgent care.",
    modelInfo: { model: "seed", generatedAt: new Date().toISOString() },
  });

  await storage.replaceSuggestions(c.id, [
    {
      name: "Common cold / viral URI",
      likelihood: 55,
      rationale: "Sore throat, congestion/runny nose, low-grade fever and fatigue are common.",
    },
    {
      name: "Influenza",
      likelihood: 25,
      rationale: "Fever and fatigue can fit, especially if body aches and sudden onset are present.",
    },
    {
      name: "COVID-19",
      likelihood: 20,
      rationale: "Overlaps with common cold symptoms; consider local prevalence and exposure.",
    },
  ]);

  await storage.replaceAdvice(c.id, [
    { category: "home_care", text: "Rest, fluids, and gentle symptom relief are usually enough." },
    { category: "monitor", text: "If fever persists beyond 3 days or symptoms worsen, get checked." },
    { category: "urgent", text: "Seek urgent care for trouble breathing, severe chest pain, or confusion." },
  ]);
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  await seedDatabase();

  app.get(api.cases.list.path, async (req, res) => {
    const parsed = api.cases.list.input?.safeParse(req.query);
    if (parsed && !parsed.success) {
      return res.status(400).json(zodToValidationError(parsed.error));
    }

    const limit = parsed?.success ? parsed.data?.limit ?? 20 : 20;
    const cursor = parsed?.success ? parsed.data?.cursor : undefined;
    const result = await storage.listCases(limit, cursor);
    res.json({ items: result.items, nextCursor: result.nextCursor });
  });

  app.get(api.cases.get.path, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid id", field: "id" });
    }

    const detail = await storage.getCaseDetail(id);
    if (!detail) {
      return res.status(404).json({ message: "Case not found" });
    }

    res.json(detail);
  });

  app.post(api.cases.create.path, async (req, res) => {
    try {
      const input = api.cases.create.input.parse(req.body);

      const created = await storage.createCase({
        age: input.age,
        sexAtBirth: input.sexAtBirth,
        pregnant: input.pregnant,
        symptomsText: input.symptomsText,
      });

      for (const s of input.symptoms) {
        await storage.addSymptom(created.id, {
          name: s.name,
          severity: s.severity,
          durationDays: s.durationDays,
        });
      }

      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json(zodToValidationError(err));
      }
      throw err;
    }
  });

  app.post(api.cases.assess.path, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid id", field: "id" });
    }

    const detail = await storage.getCaseDetail(id);
    if (!detail) {
      return res.status(404).json({ message: "Case not found" });
    }

    let additionalInfo: string | undefined;
    try {
      const parsed = api.cases.assess.input.parse(req.body);
      additionalInfo = parsed.additionalInfo;
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json(zodToValidationError(err));
      }
      throw err;
    }

    const symptomsForPrompt = detail.symptoms
      .map((s) => {
        const dur = s.durationDays == null ? "" : `, duration ${s.durationDays} days`;
        return `- ${s.name} (severity: ${s.severity}${dur})`;
      })
      .join("\n");

    const prompt = [
      "Patient context:",
      `  age=${detail.case.age ?? "unknown"}, sexAtBirth=${detail.case.sexAtBirth ?? "unknown"}, pregnant=${detail.case.pregnant ?? "unknown"}`,
      "",
      "Symptoms:",
      symptomsForPrompt || `  ${detail.case.symptomsText}`,
      additionalInfo ? `Additional info: ${additionalInfo}` : "",
      "",
      "Rules:",
      "- Do NOT claim to diagnose. Provide educational possibilities and practical next steps.",
      "- Prefer safety: when in doubt, escalate triage recommendations.",
      "- Avoid medication dosing or prescription advice.",
      "- triageLevel must be exactly one of: emergency, urgent, routine, self_care",
      "- likelihood must be an integer 1-100",
      "- advice category must be one of: urgent, home_care, monitor, doctor_visit",
      "",
      "Return ONLY the JSON object. No markdown, no explanation.",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const schemaDescription = `{
  "triageLevel": "emergency" | "urgent" | "routine" | "self_care",
  "summary": "string",
  "redFlags": ["string"],
  "followUpQuestions": ["string"],
  "homeCare": ["string"],
  "whatToTellDoctor": ["string"],
  "suggestions": [{ "name": "string", "likelihood": 1-100 (integer), "rationale": "string" }],
  "advice": [{ "category": "urgent" | "home_care" | "monitor" | "doctor_visit", "text": "string" }],
  "safetyDisclaimer": "string"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        max_tokens: 1800,
        messages: [
          {
            role: "system",
            content: `You are a medical symptom triage assistant providing educational information only. Output ONLY valid JSON matching this exact schema (no extra fields, no markdown):\n${schemaDescription}`,
          },
          { role: "user", content: prompt },
        ],
      });

      const content = completion.choices[0]?.message?.content ?? "";
      let rawParsed: unknown;
      try {
        rawParsed = JSON.parse(content);
      } catch {
        console.error("[assess] JSON parse failed. Content:", content.slice(0, 500));
        return res.status(500).json({ message: "Model returned non-JSON output" });
      }
      let parsed: z.infer<typeof assessmentOutputSchema>;
      try {
        parsed = assessmentOutputSchema.parse(rawParsed);
      } catch (zodErr) {
        console.error("[assess] Schema validation failed:", JSON.stringify((zodErr as z.ZodError).errors));
        console.error("[assess] Raw content:", content.slice(0, 800));
        return res.status(500).json({ message: "Model returned invalid output" });
      }

      const saved = await storage.upsertAssessment(id, {
        triageLevel: parsed.triageLevel,
        summary: parsed.summary,
        redFlags: parsed.redFlags,
        followUpQuestions: parsed.followUpQuestions,
        homeCare: parsed.homeCare,
        whatToTellDoctor: parsed.whatToTellDoctor,
        safetyDisclaimer: parsed.safetyDisclaimer,
        modelInfo: { model: "gpt-5.2", generatedAt: new Date().toISOString() },
      });

      await storage.replaceSuggestions(
        id,
        parsed.suggestions.map((s) => ({
          name: s.name,
          likelihood: s.likelihood,
          rationale: s.rationale,
        })),
      );

      await storage.replaceAdvice(
        id,
        parsed.advice.map((a) => ({ category: a.category, text: a.text })),
      );

      res.json(saved);
    } catch (err) {
      console.error("[assess] Unexpected error:", err);
      return res.status(500).json({ message: "Failed to generate assessment" });
    }
  });

  return httpServer;
}

import Groq from 'groq-sdk';
import { appSpecSchema } from '../schema/appSpec';

const groqConfigured = !!process.env.GROQ_API_KEY;
const groq = groqConfigured ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// The system prompt is the entire safety mechanism here: the model is
// told exactly once what fields exist and what values are legal, and
// is never asked to produce anything except that JSON object. It
// cannot emit code — there's nowhere in the schema for code to go.
const SYSTEM_PROMPT = `You convert a user's plain-English app description into a JSON object. You do not write code, ever, under any circumstance — only this JSON shape:

{
  "appName": string,
  "type": "generic_crud",
  "authentication": boolean,
  "modules": array of any of ["auth", "crud", "dashboard"],
  "entities": [
    {
      "name": string (PascalCase, e.g. "Student"),
      "fields": [
        { "name": string (camelCase), "type": "string" | "number" | "boolean" | "date" | "text", "required": boolean }
      ]
    }
  ]
}

Rules:
- "type" must always be "generic_crud" — it is the only template currently supported, regardless of what the user describes. Pick the entities that best represent their idea within that template.
- Infer 2-6 reasonable entities from the description. A school app might have Student, Teacher, Exam. A restaurant app might have MenuItem, Order, Table.
- Every entity needs at least an "id"-adjacent identifying field (e.g. "name" or "title") plus 2-5 more relevant fields.
- Output ONLY the JSON object. No explanation, no markdown code fences, nothing else.`;

export interface InterpretResult {
    spec: unknown;
    raw: string;
}

/**
 * Calls Groq's free tier (Llama 3.3 70B) with a prompt constrained to
 * only ever produce JSON matching appSpecSchema. The response is
 * still validated against the zod schema before anything downstream
 * trusts it — an LLM claiming to follow instructions and an LLM
 * actually producing schema-valid output are different guarantees,
 * and only the second one is safe to hand to the Generation Engine.
 */
export async function interpretPrompt(userPrompt: string): Promise<InterpretResult> {
    if (!groq) {
        throw new Error(
            'GROQ_API_KEY is not set. Get a free key (no credit card) at console.groq.com, then set GROQ_API_KEY in .env.'
        );
    }

    const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
        ],
        temperature: 0.2, // low, not zero — some variance in entity choice is fine; wild variance in JSON shape is not, and the schema is what actually guards against that
        response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    let parsedJson: unknown;
    try {
        parsedJson = JSON.parse(raw);
    } catch {
        throw new Error('The model returned invalid JSON. This can happen occasionally — retry the request.');
    }

    // Intentionally NOT using .parse() here, which would throw — the
    // caller needs the raw validation errors to show the user what
    // the model got wrong, not just a generic 500.
    const validation = appSpecSchema.safeParse(parsedJson);
    if (!validation.success) {
        throw new Error(`The model's output didn't match the required format: ${validation.error.issues[0].message}`);
    }

    return { spec: validation.data, raw };
}

export function isInterpreterConfigured(): boolean {
    return groqConfigured;
}

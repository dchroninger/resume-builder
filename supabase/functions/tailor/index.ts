// tailor: { resumeData, jdText, jdAnalysis? } -> { included, overrides, gaps, rationale }
import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const idArray = { type: "array", items: { type: "string" } };

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["included", "overrides", "gaps", "rationale"],
  properties: {
    included: {
      type: "object",
      additionalProperties: false,
      required: ["jobIds", "bulletIds", "skillCategoryIds", "skillIds", "educationIds", "projectIds"],
      properties: {
        jobIds: idArray,
        bulletIds: idArray,
        skillCategoryIds: idArray,
        skillIds: idArray,
        educationIds: idArray,
        projectIds: idArray,
      },
    },
    overrides: {
      type: "array",
      description: "Job-specific rewrites of selected bullets. Only where rewording meaningfully improves the match.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["bulletId", "text"],
        properties: {
          bulletId: { type: "string" },
          text: { type: "string", description: "Rewritten bullet text tuned to this job. Keep it truthful to the original." },
        },
      },
    },
    gaps: {
      type: "array",
      items: { type: "string" },
      description: "JD requirements the library does not cover at all — things the candidate may want to add",
    },
    rationale: { type: "string", description: "2-4 sentences on the selection strategy" },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { resumeData, jdText, jdAnalysis } = await req.json();
    if (!resumeData || !jdText) return json({ error: "resumeData and jdText required" }, 400);

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
    const stream = anthropic.beta.messages.stream({
      model: "claude-opus-5",
      max_tokens: 32000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [
        {
          role: "user",
          content:
            "You are tailoring a resume from a master library of content to a specific job posting.\n\n" +
            "The library is JSON: jobs/education/projects contain bullets, skillCategories contain skills. " +
            "Every entity has an `id`. Select what belongs on a one-page resume for THIS job:\n" +
            "- Include ids of the jobs, bullets, skill categories, skills, education, and projects to keep. " +
            "A bullet's parent job id must also be included for the bullet to render.\n" +
            "- Prefer bullets matching the JD's keywords and requirements; respect `pinned: true` bullets (always include them and their parent).\n" +
            "- Usually include all jobs (employment continuity) but trim bullets on less-relevant roles; aim for roughly 12-20 bullets total.\n" +
            "- Use overrides sparingly to rephrase a selected bullet toward the JD's language. Never fabricate accomplishments — " +
            "only reword what the original claims.\n" +
            "- Use EXACT ids from the library. Never invent ids.\n" +
            "- List JD requirements the library genuinely cannot support as gaps.\n\n" +
            `<library>\n${JSON.stringify(resumeData)}\n</library>\n\n` +
            (jdAnalysis ? `<jd_analysis>\n${JSON.stringify(jdAnalysis)}\n</jd_analysis>\n\n` : "") +
            `<job_posting>\n${String(jdText).slice(0, 60_000)}\n</job_posting>`,
        },
      ],
    });
    const msg = await stream.finalMessage();

    if (msg.stop_reason === "refusal") return json({ error: "Model declined the request" }, 502);
    const textBlock = msg.content.find((b: { type: string }) => b.type === "text");
    if (!textBlock) return json({ error: "Empty model response" }, 502);
    return json(JSON.parse((textBlock as { text: string }).text));
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

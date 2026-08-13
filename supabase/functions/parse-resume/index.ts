// parse-resume: { fileBase64, mediaType } | { text } -> ResumeData shape (without ids)
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

const bullet = {
  type: "object",
  additionalProperties: false,
  required: ["text", "tags", "pinned"],
  properties: {
    text: { type: "string" },
    tags: { type: "array", items: { type: "string" }, description: "2-4 short lowercase topic tags, e.g. 'backend', 'leadership', 'aws'" },
    pinned: { type: "boolean", description: "true only for the 3-5 strongest, most universally impressive bullets overall" },
  },
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["personalInfo", "jobs", "skillCategories", "education", "projects"],
  properties: {
    personalInfo: {
      type: "object",
      additionalProperties: false,
      required: ["name", "email", "phone", "location", "linkedin", "website"],
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        linkedin: { type: "string" },
        website: { type: "string" },
      },
    },
    jobs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["company", "title", "startDate", "endDate", "location", "tags", "bullets"],
        properties: {
          company: { type: "string" },
          title: { type: "string" },
          startDate: { type: "string", description: "YYYY-MM if known, else YYYY, else empty" },
          endDate: { type: "string", description: "YYYY-MM, or empty string if current role" },
          location: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          bullets: { type: "array", items: bullet },
        },
      },
    },
    skillCategories: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "tags", "skills"],
        properties: {
          name: { type: "string", description: "Category like 'Languages', 'Cloud & Infra', 'Leadership'" },
          tags: { type: "array", items: { type: "string" } },
          skills: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "tags"],
              properties: {
                name: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["institution", "degree", "field", "graduationDate", "tags", "bullets"],
        properties: {
          institution: { type: "string" },
          degree: { type: "string" },
          field: { type: "string" },
          graduationDate: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          bullets: { type: "array", items: bullet },
        },
      },
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "description", "url", "tags", "bullets"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          url: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          bullets: { type: "array", items: bullet },
        },
      },
    },
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

    const { fileBase64, mediaType, text } = await req.json();

    const instruction =
      "Parse this resume into a structured content library. Preserve the person's wording of bullets " +
      "verbatim (they will curate later). Categorize skills into sensible categories. Add 2-4 short " +
      "lowercase topic tags per bullet and skill so an agent can match them to job descriptions later. " +
      "Mark only the 3-5 strongest bullets pinned.";

    let content;
    if (fileBase64 && mediaType === "application/pdf") {
      content = [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: fileBase64 } },
        { type: "text", text: instruction },
      ];
    } else if (text) {
      content = [{ type: "text", text: `${instruction}\n\n<resume>\n${text}\n</resume>` }];
    } else {
      return json({ error: "Provide a PDF (fileBase64 + mediaType 'application/pdf') or plain text" }, 400);
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
    const stream = anthropic.beta.messages.stream({
      model: "claude-opus-5",
      max_tokens: 32000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content }],
    });
    const msg = await stream.finalMessage();

    if (msg.stop_reason === "refusal") return json({ error: "Model declined the request" }, 502);
    const textBlock = msg.content.find((b: { type: string }) => b.type === "text");
    if (!textBlock) return json({ error: "Empty model response" }, 502);
    return json({ parsed: JSON.parse((textBlock as { text: string }).text) });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

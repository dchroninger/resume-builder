// cover-letter: { resumeData, jdText, company, role } -> { coverLetter }
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

    const { resumeData, jdText, company, role } = await req.json();
    if (!resumeData || !jdText) return json({ error: "resumeData and jdText required" }, 400);

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
    const stream = anthropic.beta.messages.stream({
      model: "claude-opus-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [
        {
          role: "user",
          content:
            `Write a cover letter for the ${role || "role"} position at ${company || "the company"}. ` +
            "Use ONLY facts from the tailored resume below — never invent experience. " +
            "3-4 short paragraphs, ~250-350 words. Confident but not sycophantic; match the posting's tone; " +
            "connect the candidate's strongest relevant work to the job's actual needs. " +
            "Output only the letter body (no addresses/date header), starting with the salutation.\n\n" +
            `<resume>\n${JSON.stringify(resumeData)}\n</resume>\n\n` +
            `<job_posting>\n${String(jdText).slice(0, 60_000)}\n</job_posting>`,
        },
      ],
    });
    const msg = await stream.finalMessage();

    if (msg.stop_reason === "refusal") return json({ error: "Model declined the request" }, 502);
    const textBlock = msg.content.find((b: { type: string }) => b.type === "text");
    if (!textBlock) return json({ error: "Empty model response" }, 502);
    return json({ coverLetter: (textBlock as { text: string }).text.trim() });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

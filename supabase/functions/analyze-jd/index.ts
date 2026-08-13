// analyze-jd: { url? , text? } -> JdAnalysis (+ fetched jdText when url given)
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

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["company", "role", "keywords", "requirements", "tone", "notes"],
  properties: {
    company: { type: "string", description: "Company name, empty string if unknown" },
    role: { type: "string", description: "Job title, empty string if unknown" },
    keywords: {
      type: "array",
      items: { type: "string" },
      description: "Skills/technologies/qualifications the posting emphasizes, most important first",
    },
    requirements: {
      type: "array",
      items: { type: "string" },
      description: "Concrete requirements and responsibilities, condensed to one line each",
    },
    tone: { type: "string", description: "Company/posting tone in a few words, e.g. 'formal enterprise' or 'scrappy startup'" },
    notes: { type: "string", description: "Anything else useful for tailoring a resume to this job" },
  },
};

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Real browser UA. Some hosts 403 anything that self-identifies as a fetcher.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Applicant tracking systems expose the posting as clean JSON. Company career
 * pages usually don't — they render the posting client-side from one of these,
 * so scraping the marketing page yields navigation and CSS, not requirements.
 * Resolving to the ATS API is both more reliable and far better input.
 */
function atsApiFor(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  const seg = u.pathname.split("/").filter(Boolean);

  // greenhouse: {job-boards,boards}.greenhouse.io/<board>/jobs/<id>
  if (host.endsWith("greenhouse.io")) {
    const i = seg.indexOf("jobs");
    if (i > 0 && seg[i + 1]) {
      return `https://boards-api.greenhouse.io/v1/boards/${seg[i - 1]}/jobs/${seg[i + 1]}`;
    }
  }
  // lever: jobs.lever.co/<company>/<id>
  if (host.endsWith("lever.co") && seg.length >= 2) {
    return `https://api.lever.co/v0/postings/${seg[0]}/${seg[1]}`;
  }
  // ashby: jobs.ashbyhq.com/<org>/<id>
  if (host.endsWith("ashbyhq.com") && seg.length >= 2) {
    return `https://api.ashbyhq.com/posting-api/job-board/${seg[0]}?includeCompensation=true`;
  }
  return null;
}

/** Pull the posting text out of whichever ATS payload shape came back. */
function textFromAts(payload: unknown, wantedId?: string): string {
  const p = payload as Record<string, unknown>;
  // greenhouse + lever both expose a single posting with an HTML body
  const body = (p.content ?? p.descriptionHtml ?? p.description) as string | undefined;
  if (typeof body === "string" && body.trim()) {
    const title = (p.title ?? p.text ?? "") as string;
    return stripHtml(`${title}\n\n${body}`);
  }
  // ashby returns the whole board; find the posting by id
  const jobs = p.jobs as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(jobs)) {
    const hit = wantedId ? jobs.find((j) => String(j.id) === wantedId) : undefined;
    const j = hit ?? jobs[0];
    if (j) return stripHtml(`${j.title ?? ""}\n\n${j.descriptionHtml ?? j.description ?? ""}`);
  }
  return "";
}

/**
 * Last resort when the careers page itself is unreachable — many company sites
 * sit behind bot protection that rejects datacenter IPs, so we never get to see
 * the ATS link embedded in their HTML.
 *
 * Those URLs usually end in the ATS's own job id (dutchie.com/careers/8644957002
 * is Greenhouse job 8644957002), so the id is recoverable; only the board token
 * is missing. Guess it from the domain. Board tokens are not always derivable —
 * "dutchie.com" publishes under "thedutchie" — so try the common variants.
 */
async function guessGreenhouse(url: string): Promise<string | null> {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const id = u.pathname.split("/").filter(Boolean).pop() ?? "";
  if (!/^\d{6,}$/.test(id)) return null; // greenhouse ids are long and numeric

  const base = u.hostname.replace(/^www\./, "").split(".")[0].replace(/-/g, "");
  const candidates = [base, `the${base}`, `${base}inc`, `${base}hq`, `${base}careers`];

  for (const board of candidates) {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs/${id}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) continue;
    const t = textFromAts(await res.json(), id);
    if (t.trim()) return t;
  }
  return null;
}

async function fetchJd(url: string): Promise<string> {
  const attempt = async (target: string) => {
    const api = atsApiFor(target);
    if (!api) return null;
    const res = await fetch(api, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (!res.ok) return null;
    const id = target.split("/").filter(Boolean).pop();
    const t = textFromAts(await res.json(), id);
    return t.trim() ? t : null;
  };

  // 1. The URL is already an ATS posting.
  const direct = await attempt(url);
  if (direct) return direct;

  // 2. Otherwise fetch the page — it may be a careers page embedding an ATS.
  let html = "";
  let pageStatus = 0;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    pageStatus = res.status;
    if (res.ok) html = await res.text();
  } catch {
    pageStatus = 0; // network-level failure; treated the same as a block below
  }

  if (html) {
    const embedded = html.match(
      /https?:\/\/(?:[a-z0-9-]+\.)?(?:greenhouse\.io|lever\.co|ashbyhq\.com)\/[^"'\s<>\\]+/i,
    );
    if (embedded) {
      const viaEmbed = await attempt(embedded[0]);
      if (viaEmbed) return viaEmbed;
    }
    return stripHtml(html);
  }

  // 3. Page was blocked — try to reach the ATS without having seen the page.
  const guessed = await guessGreenhouse(url);
  if (guessed) return guessed;

  throw new Error(
    `Couldn't fetch that URL${pageStatus ? ` (${pageStatus})` : ""}. Many career sites ` +
      `block automated requests. Open the posting, click through to its Greenhouse, ` +
      `Lever, or Ashby page, and paste that link instead — or paste the job ` +
      `description text directly.`,
  );
}

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

    const { url, text } = await req.json();
    let jdText: string = text || "";
    if (!jdText && url) {
      try {
        jdText = (await fetchJd(url)).slice(0, 60_000);
      } catch (e) {
        return json({ error: (e as Error).message }, 422);
      }
    }
    if (!jdText) return json({ error: "Provide url or text" }, 400);

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
    const stream = anthropic.beta.messages.stream({
      model: "claude-opus-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [
        {
          role: "user",
          content:
            "Analyze this job posting for resume tailoring. Extract the company, role, " +
            "keywords, concrete requirements, and tone. If the page contains navigation " +
            "or unrelated content, focus only on the job posting itself.\n\n" +
            `<job_posting>\n${jdText}\n</job_posting>`,
        },
      ],
    });
    const msg = await stream.finalMessage();

    if (msg.stop_reason === "refusal") return json({ error: "Model declined the request" }, 502);
    const textBlock = msg.content.find((b: { type: string }) => b.type === "text");
    if (!textBlock) return json({ error: "Empty model response" }, 502);
    return json({ analysis: JSON.parse((textBlock as { text: string }).text), jdText });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

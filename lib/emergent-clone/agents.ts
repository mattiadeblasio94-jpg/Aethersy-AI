import type { ChatMessage } from "./llm";
import { supabaseAdmin } from "./supabase";
import { getIntegration, getConnectionById } from "./integrations/core";

export async function notifyIssuesViaIntegrations(params: {
  projectId: string;
  ownerId: string;
  issues: { title: string; body: string }[];
}) {
  const { data: connections } = await supabaseAdmin
    .from("integration_connections")
    .select("*, integration_providers(slug)")
    .eq("project_id", params.projectId);

  if (!connections || !connections.length) return;

  for (const issue of params.issues) {
    for (const conn of connections) {
      const slug = conn.integration_providers.slug as any;
      const handler = getIntegration(slug);
      if (!handler?.send) continue;

      const ctx = await getConnectionById(conn.id);
      if (!ctx) continue;

      if (slug === "github") {
        await handler.send(ctx, {
          action: "create_issue",
          owner: conn.metadata?.owner,
          repo: conn.metadata?.repo,
          data: issue
        });
      }

      if (slug === "slack" || slug === "telegram" || slug === "whatsapp") {
        await handler.send(ctx, {
          text: `New issue found: ${issue.title}\n\n${issue.body}`
        });
      }
    }
  }
}

async function callLLM(payload: any) {
  const res = await fetch(process.env.LLM_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.LLM_API_KEY}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

function extractIssuesFromTesterPlan(testerPlan: string): { title: string; body: string }[] {
  try {
    const parsed = JSON.parse(testerPlan);
    if (Array.isArray(parsed)) {
      return parsed.map((test: any) => ({
        title: test.title ?? test.name ?? "Test failed",
        body: test.description ?? test.reason ?? JSON.stringify(test)
      }));
    }
    if (parsed.tests && Array.isArray(parsed.tests)) {
      return parsed.tests.map((test: any) => ({
        title: test.title ?? test.name ?? "Test failed",
        body: test.description ?? test.reason ?? JSON.stringify(test)
      }));
    }
    return [{ title: "Test plan issues", body: testerPlan }];
  } catch {
    return [{ title: "Test plan issues", body: testerPlan }];
  }
}

export async function runMultiAgentPipeline(userMessages: ChatMessage[], options?: { projectId?: string; ownerId?: string }) {
  const architectPrompt: ChatMessage = {
    role: "system",
    content: `Sei Architect‑AI. Produci una SPEC tecnica ad alto livello dell'app.`
  };

  const architectSpec = await callLLM({
    model: process.env.LLM_MODEL_ID ?? "gpt-4.1-mini",
    messages: [architectPrompt, ...userMessages]
  });

  const coderPrompt: ChatMessage = {
    role: "system",
    content: `Sei Coder‑AI. Dato questa SPEC, genera un piano di file e moduli (non il codice completo, solo struttura) in JSON.`
  };

  const coderPlan = await callLLM({
    model: process.env.LLM_MODEL_ID ?? "gpt-4.1-mini",
    messages: [
      coderPrompt,
      { role: "assistant", content: architectSpec }
    ]
  });

  const testerPrompt: ChatMessage = {
    role: "system",
    content: `Sei Tester‑AI. Dato SPEC e piano, genera una lista di test cases critici in JSON.`
  };

  const testerPlan = await callLLM({
    model: process.env.LLM_MODEL_ID ?? "gpt-4.1-mini",
    messages: [
      testerPrompt,
      { role: "assistant", content: architectSpec },
      { role: "assistant", content: coderPlan }
    ]
  });

  if (options?.projectId && options?.ownerId) {
    const issues = extractIssuesFromTesterPlan(testerPlan);
    await notifyIssuesViaIntegrations({
      projectId: options.projectId,
      ownerId: options.ownerId,
      issues
    });
  }

  return {
    architectSpec,
    coderPlan,
    testerPlan
  };
}

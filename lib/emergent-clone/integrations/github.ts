import type { IntegrationContext, IntegrationHandler } from "./core";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;

export const GithubIntegration: IntegrationHandler = {
  slug: "github",
  displayName: "GitHub",
  category: "devtools",

  async send(ctx: IntegrationContext, payload: any) {
    const { owner, repo, action, data } = payload;

    if (action === "create_issue") {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          "Accept": "application/vnd.github+json"
        },
        body: JSON.stringify({
          title: data.title,
          body: data.body
        })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    throw new Error("Unsupported GitHub action");
  },

  async receiveWebhook(req: Request) {
    const body = await req.json();
    const eventType = (req.headers.get("x-github-event") ?? "").toString();

    return {
      connectionId: "TODO-map-github-repo-to-connection",
      event: { type: eventType, payload: body }
    };
  }
};

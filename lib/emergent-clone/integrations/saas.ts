import type { IntegrationContext, IntegrationHandler } from "./core";

/* ---------- Asana ---------- */
export const AsanaIntegration: IntegrationHandler = {
  slug: "asana",
  displayName: "Asana",
  category: "pm",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const { projectId, name, notes } = payload;

    const res = await fetch("https://app.asana.com/api/1.0/tasks", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        data: { name, notes, projects: projectId ? [projectId] : undefined }
      })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

/* ---------- Basecamp ---------- */
export const BasecampIntegration: IntegrationHandler = {
  slug: "basecamp",
  displayName: "Basecamp",
  category: "pm",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const { accountId, projectId, title, content } = payload;

    const url = `https://3.basecampapi.com/${accountId}/buckets/${projectId}/todosets.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "AIForge (your-email@example.com)"
      },
      body: JSON.stringify({ name: title, description: content })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

/* ---------- Brevo (Sendinblue) ---------- */
export const BrevoIntegration: IntegrationHandler = {
  slug: "brevo",
  displayName: "Brevo",
  category: "marketing",

  async send(ctx: IntegrationContext, payload: any) {
    const apiKey = ctx.accessToken;
    const { to, subject, htmlContent } = payload;

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ to: [{ email: to }], subject, htmlContent })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

/* ---------- Calendly ---------- */
export const CalendlyIntegration: IntegrationHandler = {
  slug: "calendly",
  displayName: "Calendly",
  category: "scheduling",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const { inviteeEmail, eventType, startTime, endTime } = payload;

    const res = await fetch("https://api.calendly.com/scheduled_events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        event_type: eventType,
        start_time: startTime,
        end_time: endTime,
        invitees: [{ email: inviteeEmail }]
      })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

/* ---------- Canva ---------- */
export const CanvaIntegration: IntegrationHandler = {
  slug: "canva",
  displayName: "Canva",
  category: "design",

  async send(_ctx: IntegrationContext, _payload: any) {
    throw new Error("Canva API are limited; implement deep-link / template links via metadata.");
  }
};

/* ---------- ClickUp ---------- */
export const ClickUpIntegration: IntegrationHandler = {
  slug: "clickup",
  displayName: "ClickUp",
  category: "pm",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const { listId, name, description } = payload;

    const res = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, description })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

/* ---------- Discord ---------- */
export const DiscordIntegration: IntegrationHandler = {
  slug: "discord",
  displayName: "Discord",
  category: "messaging",

  async send(ctx: IntegrationContext, payload: any) {
    const webhookUrl = ctx.metadata?.webhook_url ?? payload.webhookUrl;
    if (!webhookUrl) throw new Error("Discord webhook URL missing");

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: payload.text ?? "Hello from AIForge" })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.text();
  }
};

/* ---------- Dropbox ---------- */
export const DropboxIntegration: IntegrationHandler = {
  slug: "dropbox",
  displayName: "Dropbox",
  category: "storage",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const { path, content } = payload;

    const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Dropbox-API-Arg": JSON.stringify({ path, mode: "add", autorename: true, mute: false }),
        "Content-Type": "application/octet-stream"
      },
      body: Buffer.from(content, "utf-8")
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

/* ---------- Facebook Pages ---------- */
export const FacebookIntegration: IntegrationHandler = {
  slug: "facebook",
  displayName: "Facebook Pages",
  category: "social",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const pageId = ctx.metadata?.page_id ?? payload.pageId;
    const message = payload.message;

    const res = await fetch(`https://graph.facebook.com/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, access_token: token })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

/* ---------- Figma ---------- */
export const FigmaIntegration: IntegrationHandler = {
  slug: "figma",
  displayName: "Figma",
  category: "design",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const fileKey = payload.fileKey;

    const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { "X-Figma-Token": token }
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

/* ---------- Google Ads ---------- */
export const GoogleAdsIntegration: IntegrationHandler = {
  slug: "google-ads",
  displayName: "Google Ads",
  category: "ads",

  async send(_ctx: IntegrationContext, _payload: any) {
    throw new Error("Google Ads API requires complex OAuth + customer setup. Implement per project.");
  }
};

/* ---------- Google Maps ---------- */
export const GoogleMapsIntegration: IntegrationHandler = {
  slug: "google-maps",
  displayName: "Google Maps",
  category: "maps",

  async send(_ctx: IntegrationContext, _payload: any) {
    throw new Error("Use client-side JS SDK or server-side geocoding endpoints as needed.");
  }
};

/* ---------- HubSpot ---------- */
export const HubSpotIntegration: IntegrationHandler = {
  slug: "hubspot",
  displayName: "HubSpot",
  category: "crm",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const { email, properties } = payload;

    const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ properties: { email, ...properties } })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

/* ---------- Hugging Face ---------- */
export const HuggingFaceIntegration: IntegrationHandler = {
  slug: "hugging-face",
  displayName: "Hugging Face",
  category: "ml",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const { model, inputs } = payload;

    const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

/* ---------- Instagram Business ---------- */
export const InstagramIntegration: IntegrationHandler = {
  slug: "instagram",
  displayName: "Instagram Business",
  category: "social",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const igBusinessId = ctx.metadata?.ig_business_id ?? payload.igBusinessId;
    const caption = payload.caption;

    const res = await fetch(`https://graph.facebook.com/v18.0/${igBusinessId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption, image_url: payload.imageUrl, access_token: token })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

/* ---------- Linear ---------- */
export const LinearIntegration: IntegrationHandler = {
  slug: "linear",
  displayName: "Linear",
  category: "pm",

  async send(ctx: IntegrationContext, payload: any) {
    const apiKey = ctx.accessToken;
    const { teamId, title, description } = payload;

    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `mutation CreateIssue($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id } } }`,
        variables: { input: { teamId, title, description } }
      })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

/* ---------- LinkedIn ---------- */
export const LinkedInIntegration: IntegrationHandler = {
  slug: "linkedin",
  displayName: "LinkedIn",
  category: "social",

  async send(_ctx: IntegrationContext, _payload: any) {
    throw new Error("LinkedIn API access is restricted; implement per app with proper compliance.");
  }
};

/* ---------- Microsoft Teams ---------- */
export const MicrosoftTeamsIntegration: IntegrationHandler = {
  slug: "microsoft-teams",
  displayName: "Microsoft Teams",
  category: "messaging",

  async send(ctx: IntegrationContext, payload: any) {
    const webhookUrl = ctx.metadata?.webhook_url ?? payload.webhookUrl;
    if (!webhookUrl) throw new Error("Teams webhook URL missing");

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: payload.text ?? "Hello from AIForge" })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.text();
  }
};

/* ---------- Notion ---------- */
export const NotionIntegration: IntegrationHandler = {
  slug: "notion",
  displayName: "Notion",
  category: "knowledge",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const { parentId, title, content } = payload;

    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        parent: { database_id: parentId },
        properties: { Name: { title: [{ text: { content: title } }] } },
        children: content ? [{ object: "block", type: "paragraph", paragraph: { rich_text: [{ text: { content } }] } }] : []
      })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

/* ---------- Outlook ---------- */
export const OutlookIntegration: IntegrationHandler = {
  slug: "outlook",
  displayName: "Outlook",
  category: "email",

  async send(_ctx: IntegrationContext, _payload: any) {
    throw new Error("Use Microsoft Graph API (sendMail) with OAuth token.");
  }
};

/* ---------- Pinecone ---------- */
export const PineconeIntegration: IntegrationHandler = {
  slug: "pinecone",
  displayName: "Pinecone",
  category: "vector-db",

  async send(ctx: IntegrationContext, payload: any) {
    const apiKey = ctx.accessToken;
    const { indexUrl, vectors } = payload;

    const res = await fetch(`${indexUrl}/vectors/upsert`, {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ vectors })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

/* ---------- Splitwise ---------- */
export const SplitwiseIntegration: IntegrationHandler = {
  slug: "splitwise",
  displayName: "Splitwise",
  category: "finance",

  async send(_ctx: IntegrationContext, _payload: any) {
    throw new Error("Splitwise API requires OAuth; implement per app.");
  }
};

/* ---------- TickTick ---------- */
export const TickTickIntegration: IntegrationHandler = {
  slug: "ticktick",
  displayName: "TickTick",
  category: "tasks",

  async send(_ctx: IntegrationContext, _payload: any) {
    throw new Error("TickTick API is unofficial; use at your own risk.");
  }
};

/* ---------- Todoist ---------- */
export const TodoistIntegration: IntegrationHandler = {
  slug: "todoist",
  displayName: "Todoist",
  category: "tasks",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const { content, projectId } = payload;

    const res = await fetch("https://api.todoist.com/rest/v2/tasks", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ content, project_id: projectId })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

/* ---------- Trello ---------- */
export const TrelloIntegration: IntegrationHandler = {
  slug: "trello",
  displayName: "Trello",
  category: "pm",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const { listId, name, desc } = payload;

    const res = await fetch(`https://api.trello.com/1/cards?key=${process.env.TRELLO_API_KEY}&token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idList: listId, name, desc })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

/* ---------- Twitter/X ---------- */
export const TwitterIntegration: IntegrationHandler = {
  slug: "twitter",
  displayName: "Twitter/X",
  category: "social",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const { text } = payload;

    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

/* ---------- YouTube ---------- */
export const YouTubeIntegration: IntegrationHandler = {
  slug: "youtube",
  displayName: "YouTube",
  category: "video",

  async send(_ctx: IntegrationContext, _payload: any) {
    throw new Error("YouTube Data API v3 requires OAuth 2.0. Implement per project.");
  }
};

/* ---------- Zoom ---------- */
export const ZoomIntegration: IntegrationHandler = {
  slug: "zoom",
  displayName: "Zoom",
  category: "meetings",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const { topic, start_time, duration } = payload;

    const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ topic, start_time, duration })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

/* ---------- Typeform ---------- */
export const TypeformIntegration: IntegrationHandler = {
  slug: "typeform",
  displayName: "Typeform",
  category: "forms",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const { formId, answers } = payload;

    const res = await fetch(`https://api.typeform.com/forms/${formId}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ answers })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

/* ---------- Wrike ---------- */
export const WrikeIntegration: IntegrationHandler = {
  slug: "wrike",
  displayName: "Wrike",
  category: "pm",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const { folderId, title, description } = payload;

    const res = await fetch(`https://www.wrike.com/api/v4/tasks?folderId=${folderId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title, description })
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

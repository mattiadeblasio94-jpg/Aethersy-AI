import type { IntegrationContext, IntegrationHandler } from "./core";

export const NotionIntegration: IntegrationHandler = {
  slug: "notion",
  displayName: "Notion",
  category: "knowledge",

  async send(ctx: IntegrationContext, payload: any) {
    const token = ctx.accessToken;
    const { action, parentId, title, content, databaseId, properties } = payload;

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28"
    };

    if (action === "create_page") {
      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers,
        body: JSON.stringify({
          parent: { database_id: parentId || databaseId },
          properties: properties || {
            Name: {
              title: [{ text: { content: title } }]
            }
          },
          children: content
            ? [
                {
                  object: "block",
                  type: "paragraph",
                  paragraph: {
                    rich_text: [{ text: { content } }]
                  }
                }
              ]
            : []
        })
      });

      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    if (action === "append_block") {
      const { pageId, blocks } = payload;
      const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children/append`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ children: blocks })
      });

      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    if (action === "query_database") {
      const res = await fetch(`https://api.notion.com/v1/databases/${parentId}/query`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload.filter || {})
      });

      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    throw new Error(`Unsupported Notion action: ${action}`);
  }
};

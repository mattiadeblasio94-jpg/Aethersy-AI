import type { IntegrationContext, IntegrationHandler } from "./core";

export const AirtableIntegration: IntegrationHandler = {
  slug: "airtable",
  displayName: "Airtable",
  category: "database",

  async send(ctx: IntegrationContext, payload: any) {
    const apiKey = ctx.accessToken;
    const { baseId, tableName, action, record } = payload;

    const urlBase = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;

    if (action === "create") {
      const res = await fetch(urlBase, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fields: record })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    throw new Error("Unsupported Airtable action");
  }
};

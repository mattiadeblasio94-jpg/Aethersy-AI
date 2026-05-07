import { registerIntegration } from "./core";
import { TelegramIntegration } from "./telegram";
import { WhatsAppIntegration } from "./whatsapp";
import { GithubIntegration } from "./github";
import { GoogleIntegration } from "./google";
import { AirtableIntegration } from "./airtable";
import { SlackIntegration } from "./slack";
// TODO: importare qui anche: Discord, Notion, Asana, Trello, ClickUp, ecc.

let initialized = false;

export function initIntegrations() {
  if (initialized) return;
  initialized = true;

  registerIntegration(TelegramIntegration);
  registerIntegration(WhatsAppIntegration);
  registerIntegration(GithubIntegration);
  registerIntegration(GoogleIntegration);
  registerIntegration(AirtableIntegration);
  registerIntegration(SlackIntegration);
}

export { getIntegration, getConnectionById } from "./core";
export type { IntegrationContext, IntegrationHandler, ProviderSlug } from "./core";

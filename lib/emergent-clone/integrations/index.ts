import { registerIntegration } from "./core";
import { TelegramIntegration } from "./telegram";
import { WhatsAppIntegration } from "./whatsapp";
import { GithubIntegration } from "./github";
import { GoogleIntegration } from "./google";

export function registerAllIntegrations() {
  registerIntegration(TelegramIntegration);
  registerIntegration(WhatsAppIntegration);
  registerIntegration(GithubIntegration);
  registerIntegration(GoogleIntegration);
}

export { getIntegration, getConnectionById } from "./core";
export type { IntegrationContext, IntegrationHandler, ProviderSlug } from "./core";

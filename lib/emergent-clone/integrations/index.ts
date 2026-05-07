import { registerIntegration } from "./core";
import { TelegramIntegration } from "./telegram";
import { WhatsAppIntegration } from "./whatsapp";
import { GithubIntegration } from "./github";

export function registerAllIntegrations() {
  registerIntegration(TelegramIntegration);
  registerIntegration(WhatsAppIntegration);
  registerIntegration(GithubIntegration);
}

export { getIntegration, getConnectionById } from "./core";
export type { IntegrationContext, IntegrationHandler, ProviderSlug } from "./core";

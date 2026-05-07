import { registerIntegration } from "./core";
import { TelegramIntegration } from "./telegram";

export function registerAllIntegrations() {
  registerIntegration(TelegramIntegration);
}

export { getIntegration, getConnectionById } from "./core";
export type { IntegrationContext, IntegrationHandler, ProviderSlug } from "./core";

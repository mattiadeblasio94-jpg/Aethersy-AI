import { supabaseAdmin } from "../supabase";

export type ProviderSlug =
  | "telegram"
  | "whatsapp"
  | "imessage"
  | "github"
  | "google"
  | "slack"
  | "discord"
  | "airtable"
  | "notion"
  | "asana"
  | "trello"
  | "clickup"
  | "dropbox"
  | "figma"
  | "canva"
  | "hubspot"
  | "linear"
  | "microsoft-teams"
  | "zoom"
  | "typeform"
  | "todoist"
  | "ticktick"
  | "wrike"
  | "facebook"
  | "instagram"
  | "twitter"
  | "youtube";

export interface IntegrationContext {
  connectionId: string;
  projectId: string;
  ownerId: string;
  accessToken: string;
  refreshToken?: string | null;
  metadata: any;
}

export interface IntegrationHandler {
  slug: ProviderSlug;
  displayName: string;
  category: string;
  send?(ctx: IntegrationContext, payload: any): Promise<any>;
  receiveWebhook?(req: Request): Promise<{ connectionId: string; event: any }>;
  refreshToken?(ctx: IntegrationContext): Promise<IntegrationContext>;
}

const registry = new Map<ProviderSlug, IntegrationHandler>();

export function registerIntegration(handler: IntegrationHandler) {
  registry.set(handler.slug, handler);
}

export function getIntegration(slug: ProviderSlug): IntegrationHandler | undefined {
  return registry.get(slug);
}

export async function getConnectionById(id: string): Promise<IntegrationContext | null> {
  const { data, error } = await supabaseAdmin
    .from("integration_connections")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    connectionId: data.id,
    projectId: data.project_id,
    ownerId: data.owner_id,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    metadata: data.metadata
  };
}

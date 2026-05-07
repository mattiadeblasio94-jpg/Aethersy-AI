import { registerIntegration } from "./core";
import { TelegramIntegration } from "./telegram";
import { WhatsAppIntegration } from "./whatsapp";
import { GithubIntegration } from "./github";
import { GoogleIntegration } from "./google";
import { AirtableIntegration } from "./airtable";
import { SlackIntegration } from "./slack";
import { NotionIntegration } from "./notion";
import {
  AsanaIntegration,
  BasecampIntegration,
  BrevoIntegration,
  CalendlyIntegration,
  CanvaIntegration,
  ClickUpIntegration,
  DiscordIntegration,
  DropboxIntegration,
  FacebookIntegration,
  FigmaIntegration,
  GoogleAdsIntegration,
  GoogleMapsIntegration,
  HubSpotIntegration,
  HuggingFaceIntegration,
  InstagramIntegration,
  LinearIntegration,
  LinkedInIntegration,
  MicrosoftTeamsIntegration,
  OutlookIntegration,
  PineconeIntegration,
  SplitwiseIntegration,
  TickTickIntegration,
  TodoistIntegration,
  TrelloIntegration,
  TwitterIntegration,
  YouTubeIntegration,
  ZoomIntegration,
  TypeformIntegration,
  WrikeIntegration
} from "./saas";

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
  registerIntegration(AsanaIntegration);
  registerIntegration(BasecampIntegration);
  registerIntegration(BrevoIntegration);
  registerIntegration(CalendlyIntegration);
  registerIntegration(CanvaIntegration);
  registerIntegration(ClickUpIntegration);
  registerIntegration(DiscordIntegration);
  registerIntegration(DropboxIntegration);
  registerIntegration(FacebookIntegration);
  registerIntegration(FigmaIntegration);
  registerIntegration(GoogleAdsIntegration);
  registerIntegration(GoogleMapsIntegration);
  registerIntegration(HubSpotIntegration);
  registerIntegration(HuggingFaceIntegration);
  registerIntegration(InstagramIntegration);
  registerIntegration(LinearIntegration);
  registerIntegration(LinkedInIntegration);
  registerIntegration(MicrosoftTeamsIntegration);
  registerIntegration(NotionIntegration);
  registerIntegration(OutlookIntegration);
  registerIntegration(PineconeIntegration);
  registerIntegration(SplitwiseIntegration);
  registerIntegration(TickTickIntegration);
  registerIntegration(TodoistIntegration);
  registerIntegration(TrelloIntegration);
  registerIntegration(TwitterIntegration);
  registerIntegration(YouTubeIntegration);
  registerIntegration(ZoomIntegration);
  registerIntegration(TypeformIntegration);
  registerIntegration(WrikeIntegration);
}

export { getIntegration, getConnectionById } from "./core";
export type { IntegrationContext, IntegrationHandler, ProviderSlug } from "./core";

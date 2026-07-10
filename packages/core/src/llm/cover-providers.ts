export type CoverProviderId = "kkaiapi" | "openai" | "google" | "kie";

export interface CoverProviderPreset {
  readonly service: CoverProviderId;
  readonly label: string;
  readonly baseUrl: string;
  readonly api: "responses" | "images" | "gemini" | "kie";
  readonly defaultModel: string;
  readonly models: readonly string[];
}

export const COVER_PROVIDER_PRESETS: readonly CoverProviderPreset[] = [
  {
    service: "kkaiapi",
    label: "kkaiapi",
    baseUrl: "https://api.kkaiapi.com/v1",
    api: "images",
    defaultModel: "gpt-image-2",
    models: ["gpt-image-2"],
  },
  {
    service: "openai",
    label: "OpenAI Images",
    baseUrl: "https://api.openai.com/v1",
    api: "images",
    defaultModel: "gpt-image-2",
    models: ["gpt-image-2"],
  },
  {
    service: "google",
    label: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    api: "gemini",
    defaultModel: "gemini-3.1-flash-image-preview",
    models: ["gemini-3.1-flash-image-preview", "gemini-2.5-flash-image"],
  },
  {
    service: "kie",
    label: "kie.ai",
    baseUrl: "https://api.kie.ai",
    api: "kie",
    defaultModel: "gpt-image-2-text-to-image",
    models: ["gpt-image-2-text-to-image"],
  },
];

export function resolveCoverProviderPreset(service: string | undefined): CoverProviderPreset | undefined {
  return COVER_PROVIDER_PRESETS.find((provider) => provider.service === service);
}

export function coverSecretKey(service: string): string {
  return `cover:${service}`;
}

export function coverApiKeyEnvName(service: string): string {
  return `${service.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}_API_KEY`;
}

export function resolveCoverApiKeyFromEnv(service: string): string {
  return process.env[coverApiKeyEnvName(service)]?.trim() ?? "";
}

export function hasStoredCoverApiKey(
  service: string,
  secrets: { readonly services: Readonly<Record<string, { readonly apiKey?: string } | undefined>> },
): boolean {
  return Boolean(
    secrets.services[coverSecretKey(service)]?.apiKey?.trim()
    || secrets.services[service]?.apiKey?.trim()
    || resolveCoverApiKeyFromEnv(service),
  );
}

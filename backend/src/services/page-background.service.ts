import { getSystemConfig, setSystemConfig } from './system-config.service.js';

export const PAGE_BACKGROUND_CONFIG_KEY = 'app_page_backgrounds';

export const PAGE_BACKGROUND_KEYS = [
  'home',
  'tasks',
  'forest',
  'rewards',
  'groups',
] as const;

export type PageBackgroundKey = (typeof PAGE_BACKGROUND_KEYS)[number];

export type PageBackgroundEntry = {
  key: PageBackgroundKey;
  defaultUrl: string;
  customUrl: string | null;
  imageUrl: string;
  isCustom: boolean;
};

export type PageBackgroundConfig = {
  backgrounds: Record<PageBackgroundKey, PageBackgroundEntry>;
};

const DEFAULT_BACKGROUND_URL = '/images/nature-valley-bg.jpg';
const DESCRIPTION = 'Configurable background images for the five main guest app pages';

const DEFAULT_BACKGROUNDS: Record<PageBackgroundKey, string> = {
  home: DEFAULT_BACKGROUND_URL,
  tasks: DEFAULT_BACKGROUND_URL,
  forest: DEFAULT_BACKGROUND_URL,
  rewards: DEFAULT_BACKGROUND_URL,
  groups: DEFAULT_BACKGROUND_URL,
};

function isPageBackgroundKey(value: string): value is PageBackgroundKey {
  return PAGE_BACKGROUND_KEYS.includes(value as PageBackgroundKey);
}

export function assertPageBackgroundKey(value: string): PageBackgroundKey {
  if (!isPageBackgroundKey(value)) {
    throw new Error('Unknown page background key');
  }
  return value;
}

function normalizeCustomUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed;
}

function parseStoredConfig(raw: string | null): Partial<Record<PageBackgroundKey, string | null>> {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    const source =
      'backgrounds' in parsed && parsed.backgrounds && typeof parsed.backgrounds === 'object'
        ? parsed.backgrounds
        : parsed;

    const result: Partial<Record<PageBackgroundKey, string | null>> = {};
    for (const key of PAGE_BACKGROUND_KEYS) {
      const value = (source as Record<string, unknown>)[key];
      result[key] = normalizeCustomUrl(value);
    }
    return result;
  } catch {
    return {};
  }
}

function serializeOverrides(overrides: Partial<Record<PageBackgroundKey, string | null>>): string {
  const clean: Partial<Record<PageBackgroundKey, string>> = {};
  for (const key of PAGE_BACKGROUND_KEYS) {
    const customUrl = normalizeCustomUrl(overrides[key]);
    if (customUrl) {
      clean[key] = customUrl;
    }
  }
  return JSON.stringify(clean);
}

function buildConfig(
  overrides: Partial<Record<PageBackgroundKey, string | null>>
): PageBackgroundConfig {
  const backgrounds = {} as Record<PageBackgroundKey, PageBackgroundEntry>;

  for (const key of PAGE_BACKGROUND_KEYS) {
    const customUrl = normalizeCustomUrl(overrides[key]);
    const defaultUrl = DEFAULT_BACKGROUNDS[key];
    backgrounds[key] = {
      key,
      defaultUrl,
      customUrl,
      imageUrl: customUrl ?? defaultUrl,
      isCustom: !!customUrl,
    };
  }

  return { backgrounds };
}

export async function getPageBackgroundConfig(): Promise<PageBackgroundConfig> {
  const raw = await getSystemConfig(PAGE_BACKGROUND_CONFIG_KEY);
  return buildConfig(parseStoredConfig(raw));
}

export async function setPageBackgroundImage(
  key: PageBackgroundKey,
  imageUrl: string | null
): Promise<PageBackgroundConfig> {
  const raw = await getSystemConfig(PAGE_BACKGROUND_CONFIG_KEY);
  const overrides = parseStoredConfig(raw);
  const customUrl = normalizeCustomUrl(imageUrl);

  if (customUrl) {
    overrides[key] = customUrl;
  } else {
    delete overrides[key];
  }

  await setSystemConfig(PAGE_BACKGROUND_CONFIG_KEY, serializeOverrides(overrides), DESCRIPTION);
  return buildConfig(overrides);
}

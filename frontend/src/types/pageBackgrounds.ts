export const PAGE_BACKGROUND_KEYS = ['home', 'tasks', 'forest', 'rewards', 'groups'] as const;

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

export const PAGE_BACKGROUND_LABEL_KEYS: Record<PageBackgroundKey, string> = {
  home: 'admin.pageBackgrounds.pages.home',
  tasks: 'admin.pageBackgrounds.pages.tasks',
  forest: 'admin.pageBackgrounds.pages.forest',
  rewards: 'admin.pageBackgrounds.pages.rewards',
  groups: 'admin.pageBackgrounds.pages.groups',
};

export function resolveMainPageBackgroundKey(pathname: string): PageBackgroundKey | null {
  const normalized = pathname === '' ? '/' : pathname;
  if (normalized === '/') return 'home';
  if (normalized === '/tasks' || normalized.startsWith('/tasks/c/')) return 'tasks';
  if (normalized === '/forest') return 'forest';
  if (normalized === '/rewards') return 'rewards';
  if (normalized === '/groups') return 'groups';
  return null;
}

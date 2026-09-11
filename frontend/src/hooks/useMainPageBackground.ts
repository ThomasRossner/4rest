import { useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import { api } from '../services/api';
import { resolveMainPageBackgroundKey } from '../types/pageBackgrounds';
import { resolveMediaUrl } from '../utils/resolveMediaUrl';

function cssUrl(url: string): string {
  return `url("${url.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`;
}

export function useMainPageBackground(pathname: string) {
  const pageKey = useMemo(() => resolveMainPageBackgroundKey(pathname), [pathname]);

  const { data } = useQuery(['pageBackgrounds'], () => api.getPageBackgrounds(), {
    enabled: pageKey !== null,
    staleTime: 5 * 60 * 1000,
  });

  const imageUrl = pageKey ? resolveMediaUrl(data?.backgrounds?.[pageKey]?.imageUrl) : undefined;

  useEffect(() => {
    const root = document.documentElement;

    if (!pageKey || !imageUrl) {
      root.style.removeProperty('--app-bg-image');
      return;
    }

    root.style.setProperty('--app-bg-image', cssUrl(imageUrl));

    return () => {
      root.style.removeProperty('--app-bg-image');
    };
  }, [imageUrl, pageKey]);
}

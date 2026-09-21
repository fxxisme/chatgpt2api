"use client";

import { useEffect, useState } from "react";
import {
  getImmediateCachedImageSource,
  resolveCachedImage,
} from "@/lib/image-cache";

export function useCachedImageSource(source: string | undefined): string | null {
  const [src, setSrc] = useState<string | null>(() => {
    if (!source) return null;
    return getImmediateCachedImageSource(source);
  });

  useEffect(() => {
    if (!source) {
      setSrc(null);
      return;
    }

    const immediate = getImmediateCachedImageSource(source);
    if (immediate) {
      setSrc(immediate);
      return;
    }

    let cancelled = false;
    resolveCachedImage(source).then(
      (resolved) => {
        if (!cancelled) setSrc(resolved.src);
      },
      () => {
        if (!cancelled) setSrc(source);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [source]);

  return src;
}

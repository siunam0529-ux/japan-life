"use client";

import { useCallback, useSyncExternalStore } from "react";

export type FavoriteType = "area" | "place" | "article" | "app" | "deal";

export type FavoriteItem = {
  id: string;
  type: FavoriteType;
  title: string;
  subtitle: string;
  savedAt: string;
  note?: string;
  pinned?: boolean;
};

type FavoriteInput = Omit<FavoriteItem, "savedAt">;

const STORAGE_KEY = "japan-life:favorites";
const FAVORITES_EVENT = "japan-life:favorites-change";
const emptyFavorites: FavoriteItem[] = [];
let cachedFavoritesRaw = "";
let cachedFavorites: FavoriteItem[] = emptyFavorites;

function readFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") return emptyFavorites;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedFavoritesRaw = "";
      cachedFavorites = emptyFavorites;
      return cachedFavorites;
    }
    if (raw === cachedFavoritesRaw) return cachedFavorites;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cachedFavoritesRaw = raw;
      cachedFavorites = emptyFavorites;
      return cachedFavorites;
    }

    cachedFavoritesRaw = raw;
    cachedFavorites = parsed.filter((item): item is FavoriteItem => {
      return (
        typeof item?.id === "string" &&
        ["area", "place", "article", "app", "deal"].includes(item.type) &&
        typeof item.title === "string" &&
        typeof item.subtitle === "string" &&
        typeof item.savedAt === "string"
      );
    }).map((item) => ({
      ...item,
      note: typeof item.note === "string" ? item.note : undefined,
      pinned: Boolean(item.pinned),
    })).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.savedAt.localeCompare(a.savedAt));
    return cachedFavorites;
  } catch {
    return emptyFavorites;
  }
}

export function useFavorites() {
  const favorites = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(FAVORITES_EVENT, onStoreChange);

      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(FAVORITES_EVENT, onStoreChange);
      };
    },
    readFavorites,
    () => emptyFavorites,
  );

  const saveFavorites = useCallback((nextFavorites: FavoriteItem[]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFavorites));
    window.dispatchEvent(new Event(FAVORITES_EVENT));
  }, []);

  const isFavorite = useCallback(
    (type: FavoriteType, id: string) => favorites.some((item) => item.type === type && item.id === id),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (favorite: FavoriteInput) => {
      const exists = favorites.some((item) => item.type === favorite.type && item.id === favorite.id);

      if (exists) {
        saveFavorites(favorites.filter((item) => !(item.type === favorite.type && item.id === favorite.id)));
        return;
      }

      saveFavorites([{ ...favorite, savedAt: new Date().toISOString() }, ...favorites]);
    },
    [favorites, saveFavorites],
  );

  const removeFavorite = useCallback(
    (type: FavoriteType, id: string) => {
      saveFavorites(favorites.filter((item) => !(item.type === type && item.id === id)));
    },
    [favorites, saveFavorites],
  );

  const updateFavorite = useCallback(
    (type: FavoriteType, id: string, patch: Partial<Pick<FavoriteItem, "note" | "pinned">>) => {
      saveFavorites(favorites.map((item) => (item.type === type && item.id === id ? { ...item, ...patch } : item)));
    },
    [favorites, saveFavorites],
  );

  return {
    favorites,
    isFavorite,
    removeFavorite,
    toggleFavorite,
    updateFavorite,
  };
}

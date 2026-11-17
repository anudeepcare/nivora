"use client";

import { api } from "@/lib/client";
import type { HomeFeed } from "@/lib/home-feed";
import { loadHomeFeed } from "@/lib/home-feed";
import {
  invalidateResource,
  readResource,
  resourceSnapshot,
} from "@/lib/resource-cache";
import { useEffect, useState } from "react";
import { useProduct } from "./Session";

import { emptyFeed } from "./WorkspaceShared";
export function useHomeFeed(symbols: string[]) {
  const { cache, demo } = useProduct();
  const key = `home-feed:all:${[...new Set(symbols)].sort().join(",")}`;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    key: string;
    data: HomeFeed | null;
    loading: boolean;
    error: string;
  }>(() => ({
    key,
    data: resourceSnapshot<HomeFeed>(cache, key),
    loading: !!symbols.length && !demo,
    error: "",
  }));
  useEffect(() => {
    if (demo) return;
    let active = true;
    const old = resourceSnapshot<HomeFeed>(cache, key);
    setState({ key, data: old, loading: true, error: "" });
    readResource(cache, key, old?.issues.length ? 30000 : 300000, () =>
      loadHomeFeed(
        key.slice("home-feed:all:".length).split(",").filter(Boolean),
        (batch) =>
          api<HomeFeed>(
            `home-feed?symbols=${encodeURIComponent(batch.join(","))}`,
          ),
      ),
    )
      .then((data) => {
        if (active) setState({ key, data, loading: false, error: "" });
      })
      .catch((error) => {
        if (active)
          setState({
            key,
            data: old,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Updates could not be checked.",
          });
      });
    return () => {
      active = false;
    };
  }, [cache, demo, key, revision]);
  useEffect(() => {
    if (demo || !symbols.length) return;
    let lastCheck = Date.now();
    const check = () => {
      if (
        document.visibilityState === "hidden" ||
        Date.now() - lastCheck < 300000
      )
        return;
      lastCheck = Date.now();
      setRevision((value) => value + 1);
    };
    const timer = window.setInterval(check, 300000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [demo, key, symbols.length]);
  const refresh = () => {
    invalidateResource(cache, key);
    setRevision((value) => value + 1);
  };
  if (demo) return { data: emptyFeed, loading: false, error: "", refresh };
  return {
    ...(state.key === key
      ? state
      : {
          data: resourceSnapshot<HomeFeed>(cache, key),
          loading: !!symbols.length,
          error: "",
        }),
    refresh,
  };
}

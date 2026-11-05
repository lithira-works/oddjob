"use client";

import { useSyncExternalStore } from "react";
import type { Side } from "./auth";

/**
 * PREVIEW ONLY. Not authentication: it proves nothing and unlocks nothing. It lets the header
 * show the signed-in state. Holds a first name and a side in this tab, and never a phone number.
 * Replace with a server session when accounts exist.
 */
export const PREVIEW_CODE = "123456";

export type PreviewSession = { firstName: string | null; side: Side | null };

const KEY = "oddjob-preview-session";
const listeners = new Set<() => void>();
let raw: string | null | undefined;

function read(): string | null {
  if (raw === undefined) {
    try {
      raw = sessionStorage.getItem(KEY);
    } catch {
      raw = null;
    }
  }
  return raw;
}

function write(next: string | null) {
  raw = next;
  try {
    if (next === null) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, next);
  } catch {
    // Blocked storage: the session lasts until this page is left.
  }
  listeners.forEach((listen) => listen());
}

export const startPreviewSession = (session: PreviewSession) => write(JSON.stringify(session));
export const endPreviewSession = () => write(null);

const subscribe = (listen: () => void) => {
  listeners.add(listen);
  return () => listeners.delete(listen);
};

export function usePreviewSession(): PreviewSession | null {
  const value = useSyncExternalStore(subscribe, read, () => null);
  if (!value) return null;
  try {
    return JSON.parse(value) as PreviewSession;
  } catch {
    return null;
  }
}

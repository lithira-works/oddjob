"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_DRAFTS, parseStored, type DraftState } from "@/lib/admin/drafts";

/** Holds drafts in this browser. Only sample records, ids and handled marks: never a note's text. */
const KEY = "oddjob-admin-drafts-v1";

type Toast = { id: number; text: string; undo: boolean };

let state: DraftState = EMPTY_DRAFTS;
let loaded = false;
let before: DraftState | null = null;
let toast: Toast | null = null;
let toastId = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listen) => listen());

function load() {
  if (loaded) return;
  loaded = true;
  try {
    state = parseStored(window.localStorage.getItem(KEY));
  } catch {
    // Storage is blocked here. The desk still works until the page reloads.
  }
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Same as above.
  }
}

function subscribe(listen: () => void) {
  listeners.add(listen);
  return () => listeners.delete(listen);
}

const snapshot = () => {
  load();
  return state;
};

export const useDrafts = () => useSyncExternalStore(subscribe, snapshot, () => EMPTY_DRAFTS);
export const useToast = () => useSyncExternalStore(subscribe, () => toast, () => null);

function say(text: string, undo: boolean) {
  toast = { id: ++toastId, text, undo };
  clearTimeout(timer);
  timer = setTimeout(dismissToast, undo ? 10_000 : 5_000);
}

export function dismissToast() {
  toast = null;
  emit();
}

/** Applies a change. With a message, the person sees it and can take it back. */
export function change(next: (current: DraftState) => DraftState, message?: string) {
  load();
  const result = next(state);
  if (result === state) return;
  before = state;
  state = result;
  persist();
  if (message) say(message, true);
  emit();
}

export function undo() {
  if (!before) return;
  state = before;
  before = null;
  persist();
  say("Undone.", false);
  emit();
}

export function discardAll() {
  load();
  // Keeps the role being previewed, which isn't a change to any data.
  before = state;
  state = { ...EMPTY_DRAFTS, role: state.role };
  persist();
  say("All drafts discarded.", true);
  emit();
}

"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

export type CalendarNoteType = "work" | "rent" | "visa" | "school" | "hospital" | "wardOffice" | "private";

export type CalendarNote = {
  id: string;
  date: string;
  title: string;
  type: CalendarNoteType;
  time?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type CalendarNoteInput = {
  date: string;
  title: string;
  type: CalendarNoteType;
  time?: string;
  note?: string;
};

type CalendarNotes = CalendarNote[];

const storageKey = "japan-life-calendar-notes";
const notesEvent = "japan-life-calendar-notes-change";
const validTypes: CalendarNoteType[] = ["work", "rent", "visa", "school", "hospital", "wardOffice", "private"];
const EMPTY_NOTES: CalendarNotes = [];
let cachedNotesRaw: string | null = null;
let cachedNotes: CalendarNotes = EMPTY_NOTES;

function isValidNote(value: unknown): value is CalendarNote {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CalendarNote>;
  return (
    typeof item.id === "string" &&
    typeof item.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
    typeof item.title === "string" &&
    validTypes.includes(item.type as CalendarNoteType) &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
}

function normalizeNotes(raw: string | null) {
  if (!raw) return EMPTY_NOTES;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_NOTES;
    return parsed.filter(isValidNote).sort((a, b) => `${a.date} ${a.time ?? ""}`.localeCompare(`${b.date} ${b.time ?? ""}`));
  } catch {
    return EMPTY_NOTES;
  }
}

function readNotesSnapshot() {
  if (typeof window === "undefined") return EMPTY_NOTES;
  const raw = window.localStorage.getItem(storageKey);
  if (raw === cachedNotesRaw) return cachedNotes;
  cachedNotesRaw = raw;
  cachedNotes = normalizeNotes(raw);
  return cachedNotes;
}

function readServerNotesSnapshot() {
  return EMPTY_NOTES;
}

function createNoteId(date: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `note-${crypto.randomUUID()}`;
  return `note-${date}-${Date.now()}`;
}

export function useCalendarNotes() {
  const notes = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(notesEvent, onStoreChange);

      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(notesEvent, onStoreChange);
      };
    },
    readNotesSnapshot,
    readServerNotesSnapshot,
  );

  const saveNotes = useCallback((nextNotes: CalendarNote[]) => {
    const sorted = [...nextNotes].sort((a, b) => `${a.date} ${a.time ?? ""}`.localeCompare(`${b.date} ${b.time ?? ""}`));
    if (typeof window !== "undefined") {
      const nextRaw = JSON.stringify(sorted);
      cachedNotesRaw = nextRaw;
      cachedNotes = sorted;
      window.localStorage.setItem(storageKey, nextRaw);
      window.dispatchEvent(new Event(notesEvent));
    }
  }, []);

  const addNote = useCallback(
    (input: CalendarNoteInput) => {
      const now = new Date().toISOString();
      const nextNote: CalendarNote = {
        ...input,
        id: createNoteId(input.date),
        title: input.title.trim(),
        note: input.note?.trim() || undefined,
        time: input.time?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      saveNotes([nextNote, ...notes]);
      return nextNote;
    },
    [notes, saveNotes],
  );

  const updateNote = useCallback(
    (id: string, input: CalendarNoteInput) => {
      const now = new Date().toISOString();
      saveNotes(
        notes.map((item) =>
          item.id === id
            ? {
                ...item,
                ...input,
                title: input.title.trim(),
                note: input.note?.trim() || undefined,
                time: input.time?.trim() || undefined,
                updatedAt: now,
              }
            : item,
        ),
      );
    },
    [notes, saveNotes],
  );

  const deleteNote = useCallback(
    (id: string) => {
      saveNotes(notes.filter((item) => item.id !== id));
    },
    [notes, saveNotes],
  );

  const notesByDate = useMemo(() => {
    return notes.reduce<Record<string, CalendarNote[]>>((acc, note) => {
      acc[note.date] = [...(acc[note.date] ?? []), note];
      return acc;
    }, {});
  }, [notes]);

  return { addNote, deleteNote, loaded: true, notes, notesByDate, updateNote };
}

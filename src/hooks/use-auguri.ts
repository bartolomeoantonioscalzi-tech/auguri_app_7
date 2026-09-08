"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  type Channel,
  type Contact,
  type Settings,
  DEFAULT_SETTINGS,
  confirmSent as confirmSentUtil,
  markSent as markSentUtil,
  resetSent as resetSentUtil,
  unmarkSent as unmarkSentUtil,
} from "@/lib/auguri";

const CONTACTS_KEY = "auguri.contacts.v2";
const SETTINGS_KEY = "auguri.settings.v2";

/**
 * Store esterno minimale su localStorage, letto tramite
 * useSyncExternalStore: pattern corretto per stato persistito
 * (niente setState dentro gli effect, niente mismatch SSR).
 */
function createLocalStore<T>(key: string, fallback: T) {
  let value: T = fallback;
  let hydrated = false;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((l) => l());

  const hydrate = () => {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) value = JSON.parse(raw) as T;
    } catch {
      // dati corrotti o storage non disponibile: usa il fallback
    }
  };

  return {
    subscribe(listener: () => void) {
      hydrate();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    get() {
      hydrate();
      return value;
    },
    set(next: T) {
      value = next;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // storage pieno o non disponibile: mantieni solo in memoria
      }
      emit();
    },
  };
}

const contactsStore = createLocalStore<Contact[]>(CONTACTS_KEY, []);
const settingsStore = createLocalStore<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);

const emptyContacts: Contact[] = [];

export function useAuguri() {
  const contacts = useSyncExternalStore(
    useCallback((cb) => contactsStore.subscribe(cb), []),
    () => contactsStore.get(),
    () => emptyContacts
  );

  const settings = useSyncExternalStore(
    useCallback((cb) => settingsStore.subscribe(cb), []),
    () => settingsStore.get(),
    () => DEFAULT_SETTINGS
  );

  const addContacts = useCallback((incoming: Contact[]) => {
    const base = contactsStore.get();
    const existingPhones = new Set(base.map((c) => c.phone.replace(/\D/g, "")));
    const existingNames = new Set(base.map((c) => c.name.toLowerCase()));
    const merged = [...base];
    for (const c of incoming) {
      const phoneKey = c.phone.replace(/\D/g, "");
      if (phoneKey && existingPhones.has(phoneKey)) continue;
      if (!phoneKey && existingNames.has(c.name.toLowerCase())) continue;
      merged.push(c);
      existingPhones.add(phoneKey);
      existingNames.add(c.name.toLowerCase());
    }
    contactsStore.set(merged);
  }, []);

  const updateContact = useCallback((id: string, updater: (c: Contact) => Contact) => {
    contactsStore.set(contactsStore.get().map((c) => (c.id === id ? updater(c) : c)));
  }, []);

  const removeContact = useCallback((id: string) => {
    contactsStore.set(contactsStore.get().filter((c) => c.id !== id));
  }, []);

  const removeAllContacts = useCallback(() => contactsStore.set([]), []);

  // FIX: invio registrato SOLO per il canale usato — gli altri restano disponibili.
  // pending=true: al ritorno l'utente confermerà l'esito con il dialog.
  const markSent = useCallback(
    (id: string, channel: Channel) => {
      updateContact(id, (c) => markSentUtil(c, channel));
    },
    [updateContact]
  );

  // Riscontro positivo dell'utente: "Sì, inviato" → CONFERMATO
  const confirmSent = useCallback(
    (id: string, channel: Channel) => {
      updateContact(id, (c) => confirmSentUtil(c, channel));
    },
    [updateContact]
  );

  // Riscontro negativo dell'utente: "No, non inviato" → canale di nuovo attivo
  const unmarkSent = useCallback(
    (id: string, channel: Channel) => {
      updateContact(id, (c) => unmarkSentUtil(c, channel));
    },
    [updateContact]
  );

  // FIX: ripristino della card → torna "DA INVIARE" con tutti i canali attivi
  const resetSent = useCallback(
    (id: string) => {
      updateContact(id, (c) => resetSentUtil(c));
    },
    [updateContact]
  );

  // Ripristino globale (da Impostazioni)
  const resetAllSends = useCallback(() => {
    contactsStore.set(contactsStore.get().map((c) => resetSentUtil(c)));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    settingsStore.set({ ...settingsStore.get(), ...patch });
  }, []);

  return {
    contacts,
    settings,
    addContacts,
    updateContact,
    removeContact,
    removeAllContacts,
    markSent,
    confirmSent,
    unmarkSent,
    resetSent,
    resetAllSends,
    updateSettings,
  };
}

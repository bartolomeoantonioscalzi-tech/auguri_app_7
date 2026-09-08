"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuguri } from "@/hooks/use-auguri";
import { OggiTab } from "@/components/auguri/oggi-tab";
import { ImportaTab } from "@/components/auguri/importa-tab";
import { ImpostazioniTab } from "@/components/auguri/impostazioni-tab";
import { AiutoTab } from "@/components/auguri/aiuto-tab";
import { PendingSendDialog, type PendingAsk } from "@/components/auguri/pending-send-dialog";
import { pendingChannels } from "@/lib/auguri";
import { cn } from "@/lib/utils";

type Tab = "oggi" | "importa" | "impostazioni" | "aiuto";

const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: "oggi", emoji: "📅", label: "Oggi" },
  { id: "importa", emoji: "📥", label: "Importa" },
  { id: "impostazioni", emoji: "⚙️", label: "Impostazioni" },
  { id: "aiuto", emoji: "❓", label: "Aiuto" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("oggi");
  const {
    contacts,
    settings,
    addContacts,
    removeContact,
    removeAllContacts,
    markSent,
    confirmSent,
    unmarkSent,
    resetSent,
    resetAllSends,
    updateSettings,
  } = useAuguri();

  // ------------------------------------------------------------
  // Dialog "X inviato a Y?" — coda degli invii da confermare,
  // mostrata al ritorno in app (visibilitychange / focus) o al
  // caricamento se erano rimasti pendenti.
  // ------------------------------------------------------------
  const [askQueue, setAskQueue] = useState<PendingAsk[]>([]);
  const contactsRef = useRef(contacts);
  const queueRef = useRef(askQueue);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {
    queueRef.current = askQueue;
  }, [askQueue]);

  const checkPending = useCallback(() => {
    if (queueRef.current.length > 0) return; // un dialog è già aperto
    const items: (PendingAsk & { at: number })[] = [];
    for (const c of contactsRef.current) {
      for (const ch of pendingChannels(c)) {
        items.push({
          contactId: c.id,
          contactName: c.name,
          channel: ch,
          at: c.sent?.[ch]?.at ?? 0,
        });
      }
    }
    items.sort((a, b) => b.at - a.at); // il più recente per primo
    if (items.length) {
      setAskQueue(items.map(({ contactId, contactName, channel }) => ({ contactId, contactName, channel })));
    }
  }, []);

  useEffect(() => {
    // ritorno in app da Telegram/WhatsApp/Messaggi
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setTimeout(checkPending, 500);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onVisible);
    // avvio a freddo: pendenti rimasti da una sessione precedente
    const t = setTimeout(checkPending, 800);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onVisible);
      clearTimeout(t);
    };
  }, [checkPending]);

  const handleAnswer = useCallback(
    (contactId: string, channel: Parameters<typeof confirmSent>[1], answer: "yes" | "no") => {
      if (answer === "yes") confirmSent(contactId, channel);
      else unmarkSent(contactId, channel);
      setAskQueue((q) => q.filter((a) => !(a.contactId === contactId && a.channel === channel)));
    },
    [confirmSent, unmarkSent]
  );

  const handleDismiss = useCallback(() => {
    // "Annulla": resta pendente, la domanda verrà riproposta al prossimo ritorno
    setAskQueue((q) => q.slice(1));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#EFE9DB] font-sans text-[#3E3428]">
      <main className="mx-auto w-full max-w-[560px] flex-1">
        {tab === "oggi" ? (
          <OggiTab
            contacts={contacts}
            settings={settings}
            onMarkSent={markSent}
            onReset={resetSent}
            onGoImport={() => setTab("importa")}
          />
        ) : tab === "importa" ? (
          <ImportaTab
            contacts={contacts}
            onAdd={addContacts}
            onRemove={removeContact}
            onRemoveAll={removeAllContacts}
          />
        ) : tab === "impostazioni" ? (
          <ImpostazioniTab
            contacts={contacts}
            settings={settings}
            onUpdateSettings={updateSettings}
            onResetAllSends={resetAllSends}
          />
        ) : (
          <AiutoTab />
        )}
      </main>

      {/* Navigazione inferiore */}
      <nav
        aria-label="Navigazione principale"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[#DCD2BB] bg-[#EDE6D5] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto flex max-w-[560px]">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={cn(
                "flex h-16 flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
                tab === t.id ? "bg-[#E2D8C0]" : "bg-transparent"
              )}
            >
              <span className="text-xl leading-none">{t.emoji}</span>
              <span
                className={cn(
                  "font-serif text-[15px]",
                  tab === t.id ? "font-bold text-[#3B2F1E]" : "text-[#7A6C52]"
                )}
              >
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Dialog di conferma esito invio */}
      {askQueue.length > 0 && (
        <PendingSendDialog
          ask={askQueue[0]}
          onAnswer={handleAnswer}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
}

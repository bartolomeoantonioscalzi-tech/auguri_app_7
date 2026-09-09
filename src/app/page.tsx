"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuguri } from "@/hooks/use-auguri";
import { OggiTab } from "@/components/auguri/oggi-tab";
import { ImportaTab } from "@/components/auguri/importa-tab";
import { ImpostazioniTab } from "@/components/auguri/impostazioni-tab";
import { AiutoTab } from "@/components/auguri/aiuto-tab";
import { PendingSendDialog, type PendingAsk } from "@/components/auguri/pending-send-dialog";
import { pendingChannels, sanitizeSignature } from "@/lib/auguri";
import { cn } from "@/lib/utils";

type Tab = "oggi" | "importa" | "impostazioni" | "aiuto";

const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: "oggi", emoji: "📅", label: "Oggi" },
  { id: "importa", emoji: "📥", label: "Importa" },
  { id: "impostazioni", emoji: "⚙️", label: "Impostazioni" },
  { id: "aiuto", emoji: "❓", label: "Aiuto" },
];

const CONSENT_VERSION = 1; // se cambieranno le clausole, aumentarlo: l'app le riproporrà
const CONSENT_KEY = "auguri.consent.v1";

interface ConsentState {
  version: number;
  signature: string;
}

// ------------------------------------------------------------
// Le tre schermate di accettazione (bloccanti al primo avvio)
// ------------------------------------------------------------

function AcceptanceFlow({ onDone }: { onDone: (s: ConsentState) => void }) {
  const [step, setStep] = useState(0);
  const [ok1, setOk1] = useState(false);
  const [ok2, setOk2] = useState(false);
  const [ok3, setOk3] = useState(false);
  const [signature, setSignature] = useState("");
  const [sigNotice, setSigNotice] = useState<string | null>(null);

  const commitSignature = () => {
    const { value, changed } = sanitizeSignature(signature);
    setSignature(value);
    if (changed) {
      setSigNotice("Firma ripulita in automatico: link, numeri di telefono e simboli non sono consentiti.");
    }
  };

  const signatureValid = sanitizeSignature(signature).value.length >= 2;

  return (
    <div className="flex min-h-screen flex-col bg-[#EFE9DB] font-sans text-[#3E3428]">
      <main className="mx-auto w-full max-w-[560px] flex-1 px-4 py-8">
        {step === 0 && (
          <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-5">
            <h1 className="font-serif text-[26px] font-bold text-[#3B2F1E]">Benvenuto in Auguri</h1>
            <p className="mt-1 text-[14px] text-[#8A7A5E]">Prima di cominciare, tre regole di comportamento.</p>
            <ol className="mt-4 space-y-3 text-[15px] leading-relaxed text-[#3E3428]">
              <li>
                <b>1. Linguaggio e comportamento decorosi.</b> Gli auguri parlano di te: usa un
                linguaggio consono e rispettoso.
              </li>
              <li>
                <b>2. Rispetta i tempi dei destinatari.</b> Usa una finestra di tempo adeguata
                (consigliata: 07:00–22:00): nessun augurio nelle ore in cui la gente può dormire.
              </li>
              <li>
                <b>3. Mai messaggi ripetuti alla stessa persona.</b> L&apos;invio insistente e
                reiterato di messaggi non desiderati costituisce reato di stalking.
              </li>
            </ol>
            <label className="mt-5 flex items-center gap-3 text-[15px] font-bold text-[#3E3428]">
              <input
                type="checkbox"
                checked={ok1}
                onChange={(e) => setOk1(e.target.checked)}
                className="h-5 w-5 accent-[#362B1D]"
              />
              Ho letto e accetto tutto
            </label>
            <button
              type="button"
              disabled={!ok1}
              onClick={() => setStep(1)}
              className="mt-4 h-12 w-full rounded-xl bg-[#362B1D] font-serif text-[17px] font-bold text-white disabled:opacity-40 active:scale-[0.99]"
            >
              Avanti →
            </button>
          </section>
        )}

        {step === 1 && (
          <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-5">
            <h1 className="font-serif text-[26px] font-bold text-[#3B2F1E]">
              Rischio di blocco dalle messaggistiche
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[#3E3428]">
              Telegram, WhatsApp e SMS possono <b>bloccare il tuo numero</b> se sospettano spam.
              Il rischio aumenta con:
            </p>
            <ul className="mt-2 space-y-1.5 text-[15px] leading-relaxed text-[#3E3428]">
              <li>• <b>invii massivi</b> in pochi minuti — l&apos;app è potente: i messaggi partono rapidi;</li>
              <li>• <b>testi identici ripetuti</b> — per questo l&apos;app differenzia i messaggi a rotazione, e tu non puoi modificarli.</li>
            </ul>
            <p className="mt-3 rounded-lg bg-[#F4EEDF] px-4 py-3 text-[14px] leading-relaxed text-[#6B5B40]">
              💡 <b>Suggerimento:</b> oltre 20 invii al giorno, cadenzali in tre o cinque tranche
              distribuite nella giornata, con una pausa di qualche minuto ogni 5 invii sulla
              stessa piattaforma.
            </p>
            <label className="mt-5 flex items-center gap-3 text-[15px] font-bold text-[#3E3428]">
              <input
                type="checkbox"
                checked={ok2}
                onChange={(e) => setOk2(e.target.checked)}
                className="h-5 w-5 accent-[#362B1D]"
              />
              Ho capito e accetto
            </label>
            <button
              type="button"
              disabled={!ok2}
              onClick={() => setStep(2)}
              className="mt-4 h-12 w-full rounded-xl bg-[#362B1D] font-serif text-[17px] font-bold text-white disabled:opacity-40 active:scale-[0.99]"
            >
              Avanti →
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-5">
            <h1 className="font-serif text-[26px] font-bold text-[#3B2F1E]">Responsabilità</h1>
            <ul className="mt-4 space-y-2 text-[15px] leading-relaxed text-[#3E3428]">
              <li>
                • <b>Tu sei l&apos;unico responsabile</b> della condotta tenuta
                nell&apos;utilizzo dell&apos;app.
              </li>
              <li>
                • <b>Chi fornisce l&apos;app non è responsabile</b> di eventuali blocchi da parte
                delle app di messaggistica per sospetto spam.
              </li>
            </ul>

            <h2 className="mt-5 font-serif text-[18px] font-bold text-[#3B2F1E]">
              La tua firma (obbligatoria)
            </h2>
            <p className="mt-1 text-[13px] text-[#8A7A5E]">
              Comparirà in tutti i messaggi. Solo lettere, spazi, punti e virgole: link,
              numeri e simboli vengono rimossi in automatico. La qualifica (facoltativa)
              la imposterai in Impostazioni.
            </p>
            <input
              value={signature}
              onChange={(e) => {
                setSignature(e.target.value);
                setSigNotice(null);
              }}
              onBlur={commitSignature}
              placeholder="Es. Antonio Scalzi"
              maxLength={60}
              className="mt-3 h-12 w-full rounded-lg border border-[#DCD2BB] bg-white/70 px-3 text-[16px] text-[#3E3428] outline-none placeholder:text-[#B3A787] focus:border-[#C7B699]"
            />
            {sigNotice && (
              <p className="mt-2 rounded-lg bg-[#F6DCC0] px-3 py-2 text-[13px] text-[#935826]">
                ⓘ {sigNotice}
              </p>
            )}

            <label className="mt-5 flex items-center gap-3 text-[15px] font-bold text-[#3E3428]">
              <input
                type="checkbox"
                checked={ok3}
                onChange={(e) => setOk3(e.target.checked)}
                className="h-5 w-5 accent-[#362B1D]"
              />
              Ho letto e accetto
            </label>
            <button
              type="button"
              disabled={!ok3 || !signatureValid}
              onClick={() => onDone({ version: CONSENT_VERSION, signature: sanitizeSignature(signature).value })}
              className="mt-4 h-12 w-full rounded-xl bg-[#362B1D] font-serif text-[17px] font-bold text-white disabled:opacity-40 active:scale-[0.99]"
            >
              Comincia
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("oggi");
  const [consent, setConsent] = useState<ConsentState | null | undefined>(undefined); // undefined = in caricamento
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

  // Ripristino delle accettazioni salvate
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CONSENT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ConsentState;
        if (parsed?.version === CONSENT_VERSION && parsed.signature) {
          setConsent(parsed);
          return;
        }
      }
    } catch {
      // dati corrotti: si riparte dalle clausole
    }
    setConsent(null);
  }, []);

  const handleConsentDone = useCallback(
    (s: ConsentState) => {
      try {
        window.localStorage.setItem(CONSENT_KEY, JSON.stringify(s));
      } catch {
        // storage non disponibile
      }
      // La firma accettata diventa la firma dell'app (se non già impostata diversamente)
      updateSettings({ signature: s.signature });
      setConsent(s);
    },
    [updateSettings]
  );

  // ------------------------------------------------------------
  // Dialog "X inviato a Y?" — come prima
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
    if (queueRef.current.length > 0) return;
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
    items.sort((a, b) => b.at - a.at);
    if (items.length) {
      setAskQueue(items.map(({ contactId, contactName, channel }) => ({ contactId, contactName, channel })));
    }
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setTimeout(checkPending, 500);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onVisible);
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
    setAskQueue((q) => q.slice(1));
  }, []);

  // Finché le clausole non sono accettate: solo il flusso di accettazione
  if (consent === undefined) {
    return <div className="min-h-screen bg-[#EFE9DB]" />;
  }
  if (consent === null) {
    return <AcceptanceFlow onDone={handleConsentDone} />;
  }

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

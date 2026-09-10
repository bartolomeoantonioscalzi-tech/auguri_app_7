"use client";

import { useEffect, useState } from "react";
import {
  type Channel,
  type Contact,
  type Occasion,
  type Settings,
  type Tranche,
  CHANNEL_EMOJI,
  CHANNEL_LABEL,
  advanceRotation,
  buildMessage,
  channelUrl,
  displayName,
  formatTime,
  initialsOf,
  isDeceased,
  isInsideSendWindow,
  pendingChannels,
  phoneFor,
  phonesOf,
  sentChannels,
  useRotationIndex,
} from "@/lib/auguri";
import { cn } from "@/lib/utils";

interface Props {
  contact: Contact;
  settings: Settings;
  occasion: Occasion;
  tranche: Tranche;
  onMarkSent: (id: string, channel: Channel) => void;
  onReset: (id: string) => void;
}

const CONFIRM_NOTE: Record<Channel, string> = {
  telegram:
    "Si aprirà Telegram direttamente sulla chat del numero scelto; se l'account non esiste, Telegram stesso mostrerà l'avviso «utente non esiste». Il testo è copiato negli appunti: incollalo nella chat.",
  whatsapp: "Si aprirà WhatsApp con il messaggio già scritto, sul numero scelto.",
  sms: "Si aprirà l'app Messaggi con il testo già pronto, sul numero scelto.",
};

const OCCASION_BADGE: Record<Occasion, { label: string; className: string }> = {
  compleanno: { label: "COMPLEANNO", className: "bg-[#D8CBAA] text-[#6B5836]" },
  onomastico: { label: "ONOMASTICO", className: "bg-[#C9DCE0] text-[#2F5B5B]" },
};

const DECEASED_BADGE = { label: "RICORDO", className: "bg-[#D8D3CB] text-[#4A4540]" };

const TRANCHE_BADGE: Record<Tranche, { label: string; className: string } | null> = {
  [-1]: { label: "IN ANTICIPO", className: "bg-[#F6DCC0] text-[#935826]" },
  0: null,
  1: { label: "IN RITARDO", className: "bg-[#F6DCC0] text-[#935826]" },
};

export function AuguriCard({ contact, settings, occasion, tranche, onMarkSent, onReset }: Props) {
  const [confirming, setConfirming] = useState<Channel | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const allPhones = phonesOf(contact);
  const [selectedPhone, setSelectedPhone] = useState<string>(allPhones[0] ?? "");

  useEffect(() => {
    setSelectedPhone(phonesOf(contact)[0] ?? "");
  }, [contact.id, contact.phone, contact.phones?.join("|")]);

  useRotationIndex();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const deceased = isDeceased(contact.name);
  const name = displayName(contact.name);
  const previewMessage = mounted ? buildMessage(contact, settings, occasion, tranche) : "";

  const done = sentChannels(contact);
  const pending = pendingChannels(contact);
  const sent = done.length > 0;
  const allConfirmed = sent && pending.length === 0;

  const handleConfirm = async () => {
    if (!confirming) return;
    const channel = confirming;
    setConfirming(null);
    const messageNow = buildMessage(contact, settings, occasion, tranche);
    onMarkSent(contact.id, channel);
    if (!deceased) advanceRotation();
    setLastMessage(messageNow);
    try {
      await navigator.clipboard.writeText(messageNow);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // appunti non disponibili: prosegui comunque
    }
    const url = channelUrl(channel, phoneFor(contact, selectedPhone), messageNow);
    if (channel === "whatsapp") {
      window.open(url, "_blank");
    } else {
      window.location.href = url;
    }
  };

  const lastSentAt = done.length
    ? Math.max(...done.map((ch) => contact.sent?.[ch]?.at ?? 0))
    : 0;

  const message = sent && lastMessage ? lastMessage : previewMessage;
  const occasionBadge = deceased ? DECEASED_BADGE : OCCASION_BADGE[occasion];
  const trancheBadge = TRANCHE_BADGE[tranche];

  return (
    <article
      className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-4 shadow-[0_1px_3px_rgba(74,59,40,0.08)]"
      aria-label={`Contatto ${name}`}
    >
      {/* Intestazione */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#C7B699] font-serif text-lg font-bold tracking-wide text-[#4A3B28]">
          {initialsOf(contact.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-serif text-[22px] font-bold leading-tight text-[#3B2F1E]">
            {name}
          </h2>
          <p className="truncate text-[15px] text-[#8A7A5E]">
            {allPhones.length > 1 ? `${allPhones.length} numeri · ${selectedPhone}` : contact.phone}
          </p>
        </div>
        {sent && (
          <span className="shrink-0 font-serif text-[15px] font-bold text-[#2F5B33]">Inviato</span>
        )}
      </div>

      {/* Selettore numero (solo se più di uno) */}
      {allPhones.length > 1 && (
        <div className="mt-3">
          <p className="text-[12px] font-bold uppercase tracking-wide text-[#8A7A5E]">
            Numero da usare
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {allPhones.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPhone(p)}
                aria-pressed={selectedPhone === p}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[14px] font-bold transition-colors",
                  selectedPhone === p ? "bg-[#362B1D] text-white" : "bg-[#D8CBAA] text-[#4A3B28]"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Badge */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge className={occasionBadge.className}>{occasionBadge.label}</Badge>
        {trancheBadge && <Badge className={trancheBadge.className}>{trancheBadge.label}</Badge>}
        {allConfirmed ? (
          <Badge className="bg-[#BFD8BC] text-[#2F5B33]">CONFERMATO</Badge>
        ) : sent ? (
          <Badge className="bg-[#F6DCC0] text-[#935826]">DA CONFERMARE</Badge>
        ) : (
          <Badge className="bg-[#F1E5B5] text-[#7A6528]">DA INVIARE</Badge>
        )}
      </div>

      {/* Anteprima messaggio */}
      <blockquote className="mt-3 rounded-lg border-l-[3px] border-[#C9B98F] bg-[#F4EEDF] px-4 py-3 font-serif text-[17px] leading-relaxed text-[#3E3428]">
        {message}
      </blockquote>
      {!deceased && (
        <p className="mt-1 text-[12px] text-[#8A7A5E]">
          Il testo è scelto dall'app tra modelli a rotazione: varia a ogni invio.
        </p>
      )}

      {/* Esito */}
      {sent && (
        <div className="mt-3 space-y-1 text-center">
          {allConfirmed ? (
            <p className="rounded-lg bg-[#E4EFDF] py-2 font-serif text-[16px] font-bold text-[#2F5B33]">
              ✓ Confermato{lastSentAt ? ` · ${formatTime(lastSentAt)}` : ""}
            </p>
          ) : (
            <>
              <p className="font-serif text-[16px] text-[#935826]">
                ⏳ In attesa di conferma via {pending.map((ch) => CHANNEL_LABEL[ch]).join(" e ")}
              </p>
              <p className="text-[13px] leading-snug text-[#8A7A5E]">
                Al ritorno in app ti chiederemo se l&apos;invio è andato a buon
                fine; nel frattempo gli altri canali restano attivi.
              </p>
            </>
          )}
        </div>
      )}

      {/* Conferma invio inline */}
      {confirming ? (
        <div className="mt-4">
          <p className="mb-3 text-center font-serif text-[17px] text-[#3E3428]">
            Confermi invio a <b>{name}</b>
            {allPhones.length > 1 ? (
              <>
                {" "}al numero <b>{phoneFor(contact, selectedPhone)}</b>?
              </>
            ) : (
              "?"
            )}
          </p>
          <p className="mb-3 text-center text-[13px] leading-snug text-[#8A7A5E]">
            {CONFIRM_NOTE[confirming]}
          </p>
          {!isInsideSendWindow() && (
            <p className="mb-3 rounded-lg bg-[#F6DCC0] px-3 py-2 text-center text-[13px] leading-snug text-[#935826]">
              ⏰ Fuori dalla finestra consigliata (07:00–22:00): il destinatario
              potrebbe dormire. Invia solo se sei sicuro.
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              className="h-12 flex-1 rounded-xl bg-[#362B1D] font-serif text-[17px] font-bold text-white transition-transform active:scale-[0.98]"
            >
              ✓ Conferma
            </button>
            <button
              type="button"
              onClick={() => setConfirming(null)}
              className="h-12 flex-1 rounded-xl bg-[#A99F8C] font-serif text-[17px] font-bold text-white transition-transform active:scale-[0.98]"
            >
              ✕ Annulla
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Canali: pendente = ombra leggera; confermato tutto = tutti ombreggiati */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {(["telegram", "whatsapp", "sms"] as Channel[]).map((ch) => {
              const used = done.includes(ch);
              const awaiting = pending.includes(ch);
              const shade = allConfirmed
                ? "opacity-40 grayscale"
                : used
                  ? awaiting
                    ? "opacity-60 grayscale shadow-inner" // usato, esito non ancora confermato
                    : "opacity-45 grayscale" // confermato su questo canale
                  : "";
              return (
                <button
                  key={ch}
                  type="button"
                  disabled={used}
                  onClick={() => setConfirming(ch)}
                  className={cn(
                    "flex h-[72px] flex-col items-center justify-center gap-1 rounded-xl font-serif text-[17px] font-bold text-white transition-transform",
                    !used && "active:scale-[0.97]",
                    ch === "telegram" && "bg-[#45A3E5]",
                    ch === "whatsapp" && "bg-[#40C351]",
                    ch === "sms" && "bg-[#999793]",
                    shade,
                    used && "cursor-default"
                  )}
                  aria-label={used ? `${CHANNEL_LABEL[ch]} già usato` : `Invia con ${CHANNEL_LABEL[ch]}`}
                >
                  <span className="text-xl leading-none">{used ? "✓" : CHANNEL_EMOJI[ch]}</span>
                  <span>{CHANNEL_LABEL[ch]}</span>
                </button>
              );
            })}
          </div>

          {/* Ripristino: sempre disponibile dopo un tentativo, su OGNI tranche */}
          {sent && (
            <div className="mt-3 text-center">
              {confirmReset ? (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-[14px] text-[#8A7A5E]">Azzerare gli invii?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onReset(contact.id);
                      setConfirmReset(false);
                    }}
                    className="rounded-lg bg-[#362B1D] px-3 py-1.5 text-[14px] font-bold text-white"
                  >
                    Sì, ripristina
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded-lg bg-[#D8CBAA] px-3 py-1.5 text-[14px] font-bold text-[#4A3B28]"
                  >
                    Annulla
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="rounded-lg px-3 py-1.5 font-serif text-[15px] font-bold text-[#7A6528] underline decoration-dotted underline-offset-4 hover:bg-[#F1E5B5]/60"
                >
                  ↺ Ripristina — non inviato
                </button>
              )}
            </div>
          )}
        </>
      )}

      {copied && (
        <p className="mt-2 text-center text-[13px] text-[#2F5B33]" role="status">
          Messaggio copiato negli appunti
        </p>
      )}
    </article>
  );
}

function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 font-serif text-[13px] font-bold tracking-wide",
        className
      )}
    >
      {children}
    </span>
  );
}

"use client";

import { useState } from "react";
import {
  type Channel,
  type Contact,
  type Settings,
  CHANNEL_EMOJI,
  CHANNEL_LABEL,
  channelUrl,
  formatTime,
  initialsOf,
  pendingChannels,
  renderMessage,
  sentChannels,
} from "@/lib/auguri";
import { cn } from "@/lib/utils";

interface Props {
  contact: Contact;
  settings: Settings;
  onMarkSent: (id: string, channel: Channel) => void;
  onReset: (id: string) => void;
}

const CONFIRM_NOTE: Record<Channel, string> = {
  telegram:
    "Si aprirà Telegram direttamente sulla chat del numero; se l'account non esiste, Telegram stesso mostrerà l'avviso «utente non esiste». Il testo è copiato negli appunti: incollalo nella chat.",
  whatsapp: "Si aprirà WhatsApp con il messaggio già scritto.",
  sms: "Si aprirà l'app Messaggi con il testo già pronto.",
};

export function BirthdayCard({ contact, settings, onMarkSent, onReset }: Props) {
  const [confirming, setConfirming] = useState<Channel | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [copied, setCopied] = useState(false);

  const message = renderMessage(settings.template, contact.name, settings.signature);
  const done = sentChannels(contact);
  const pending = pendingChannels(contact);
  const sent = done.length > 0;
  const allConfirmed = sent && pending.length === 0;

  const handleConfirm = async () => {
    if (!confirming) return;
    const channel = confirming;
    setConfirming(null);
    onMarkSent(contact.id, channel);
    // Il testo viene messo negli appunti PRIMA di aprire il canale:
    // per Telegram (tg://resolve) non c'è precompilazione, si incolla in chat.
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // appunti non disponibili: prosegui comunque
    }
    const url = channelUrl(channel, contact.phone, message);
    if (channel === "whatsapp") {
      window.open(url, "_blank");
    } else {
      // schemi custom (tg:, sms:) — navigazione diretta, senza finestre a comparsa
      window.location.href = url;
    }
  };

  const lastSentAt = done.length
    ? Math.max(...done.map((ch) => contact.sent?.[ch]?.at ?? 0))
    : 0;

  return (
    <article
      className={cn(
        "rounded-[18px] border bg-[#FBF7EE] p-4 shadow-[0_1px_3px_rgba(74,59,40,0.08)]",
        "border-[#E7DEC9]"
      )}
      aria-label={`Contatto ${contact.name}`}
    >
      {/* Intestazione */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#C7B699] font-serif text-lg font-bold tracking-wide text-[#4A3B28]">
          {initialsOf(contact.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-serif text-[22px] font-bold leading-tight text-[#3B2F1E]">
            {contact.name}
          </h2>
          <p className="text-[15px] text-[#8A7A5E]">{contact.phone}</p>
        </div>
        {sent && (
          <span className="shrink-0 font-serif text-[15px] font-bold text-[#2F5B33]">
            Inviato
          </span>
        )}
      </div>

      {/* Badge stato */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge className="bg-[#D8CBAA] text-[#6B5836]">COMPLEANNO</Badge>
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

      {/* Esito: in attesa di conferma o confermato */}
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
            Confermi invio a <b>{contact.name}</b>?
          </p>
          <p className="mb-3 text-center text-[13px] leading-snug text-[#8A7A5E]">
            {CONFIRM_NOTE[confirming]}
          </p>
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
          {/* Canali: quelli già usati mostrano la spunta, gli ALTRI restano
              sempre attivi — nessun contatto "bruciato" */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {(["telegram", "whatsapp", "sms"] as Channel[]).map((ch) => {
              const used = done.includes(ch);
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
                    used && "cursor-default opacity-45"
                  )}
                  aria-label={used ? `${CHANNEL_LABEL[ch]} già usato` : `Invia con ${CHANNEL_LABEL[ch]}`}
                >
                  <span className="text-xl leading-none">{used ? "✓" : CHANNEL_EMOJI[ch]}</span>
                  <span>{CHANNEL_LABEL[ch]}</span>
                </button>
              );
            })}
          </div>

          {/* Ripristino manuale della card */}
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

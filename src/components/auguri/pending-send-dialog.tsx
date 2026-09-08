"use client";

import { type Channel, type Contact, CHANNEL_LABEL, firstNameOf } from "@/lib/auguri";

export interface PendingAsk {
  contactId: string;
  contactName: string;
  channel: Channel;
}

interface Props {
  ask: PendingAsk;
  onAnswer: (contactId: string, channel: Channel, answer: "yes" | "no") => void;
  onDismiss: () => void;
}

/**
 * Dialog mostrato al ritorno in app dopo un tentativo di invio:
 * "Telegram inviato a Antonio?" — replica fedele dello screenshot
 * "Non inviato.png": Annulla / No, non inviato / Sì, inviato.
 * - "Sì, inviato"    → la card diventa CONFERMATO
 * - "No, non inviato" → il canale si libera subito (WhatsApp e SMS restano attivi)
 * - "Annulla"         → la domanda verrà riproposta al prossimo ritorno
 */
export function PendingSendDialog({ ask, onAnswer, onDismiss }: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Conferma invio ${CHANNEL_LABEL[ask.channel]}`}
    >
      <div className="w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="font-serif text-[26px] font-bold leading-tight text-[#2E2A24]">
          {CHANNEL_LABEL[ask.channel]} inviato a {firstNameOf(ask.contactName)}?
        </h2>
        <p className="mt-2 text-[17px] leading-snug text-[#6B6459]">
          Confermalo solo se il messaggio di auguri è stato effettivamente inviato.
        </p>
        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={onDismiss}
            className="h-12 w-full rounded-xl bg-[#F2EBDD] font-serif text-[17px] font-bold text-[#3B2F1E] transition-transform active:scale-[0.98]"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={() => onAnswer(ask.contactId, ask.channel, "no")}
            className="h-12 w-full rounded-xl bg-[#F2EBDD] font-serif text-[17px] font-bold text-[#3B2F1E] transition-transform active:scale-[0.98]"
          >
            No, non inviato
          </button>
          <button
            type="button"
            onClick={() => onAnswer(ask.contactId, ask.channel, "yes")}
            className="h-12 w-full rounded-xl bg-[#C4694A] font-serif text-[17px] font-bold text-white transition-transform active:scale-[0.98]"
          >
            Sì, inviato
          </button>
        </div>
      </div>
    </div>
  );
}

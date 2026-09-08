"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type Channel,
  type Contact,
  type Settings,
  RATE_LIMIT_NOTICE,
  formatTodayDate,
  isBirthdayToday,
  isSent,
} from "@/lib/auguri";
import { BirthdayCard } from "./birthday-card";

interface Props {
  contacts: Contact[];
  settings: Settings;
  onMarkSent: (id: string, channel: Channel) => void;
  onReset: (id: string) => void;
  onGoImport: () => void;
}

export function OggiTab({ contacts, settings, onMarkSent, onReset, onGoImport }: Props) {
  const [showTop, setShowTop] = useState(false);
  const [onlyPending, setOnlyPending] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const birthdays = useMemo(() => contacts.filter(isBirthdayToday), [contacts]);
  const pending = birthdays.filter((c) => !isSent(c));
  const done = birthdays.filter((c) => isSent(c));
  const ordered = [...pending, ...done];
  const visible = onlyPending ? ordered.filter((c) => !isSent(c)) : ordered;

  return (
    <div className="px-4 pb-28 pt-5">
      <header className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-[28px] font-bold text-[#3B2F1E]">Oggi</h1>
            <p className="text-[14px] capitalize text-[#8A7A5E]">{formatTodayDate()}</p>
            <p className="mt-1 text-[14px] font-bold text-[#7A6528]">
              {birthdays.length} compleanni · {pending.length} da inviare
            </p>
          </div>
          {birthdays.length > 0 && (
            <button
              type="button"
              onClick={() => setOnlyPending((v) => !v)}
              aria-pressed={onlyPending}
              className={
                "mt-1 shrink-0 rounded-full border-2 px-4 py-2 font-serif text-[15px] font-bold transition-colors " +
                (onlyPending
                  ? "border-[#7A6528] bg-[#F1E5B5] text-[#5C4C1E]"
                  : "border-[#B3A787] bg-transparent text-[#7A6528]")
              }
            >
              Solo non inviati
            </button>
          )}
        </div>
      </header>

      {birthdays.length > 0 && (
        <div className="mb-4 rounded-xl border border-[#E7DEC9] bg-[#F4EEDF] px-4 py-3">
          <p className="text-[13.5px] leading-relaxed text-[#6B5B40]">
            ⓘ {RATE_LIMIT_NOTICE}
          </p>
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[#C9B98F] bg-[#FBF7EE]/70 p-8 text-center">
          <p className="font-serif text-[19px] font-bold text-[#3B2F1E]">Nessun contatto</p>
          <p className="mx-auto mt-2 max-w-[280px] text-[14px] leading-relaxed text-[#8A7A5E]">
            Importa i festeggiati di oggi dalla scheda &ldquo;Importa&rdquo; per cominciare
            a inviare gli auguri con Telegram, WhatsApp o SMS.
          </p>
          <button
            type="button"
            onClick={onGoImport}
            className="mt-4 h-11 rounded-xl bg-[#362B1D] px-5 font-serif text-[16px] font-bold text-white active:scale-[0.98]"
          >
            📥 Vai a Importa
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[#C9B98F] bg-[#FBF7EE]/70 p-8 text-center">
          <p className="font-serif text-[19px] font-bold text-[#3B2F1E]">
            {onlyPending ? "Tutti gli auguri sono stati inviati 🎉" : "Nessun compleanno oggi"}
          </p>
          <p className="mx-auto mt-2 max-w-[300px] text-[14px] leading-relaxed text-[#8A7A5E]">
            {onlyPending
              ? "Non ci sono più card da inviare: disattiva il filtro per rivedere gli invii di oggi."
              : "I contatti importati non festeggiano il compleanno oggi. Puoi controllare le date nella scheda \u201cImporta\u201d."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((c) => (
            <BirthdayCard
              key={c.id}
              contact={c}
              settings={settings}
              onMarkSent={onMarkSent}
              onReset={onReset}
            />
          ))}
        </div>
      )}

      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Torna in cima"
          className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#C7B699] text-[#4A3B28] shadow-lg transition-transform active:scale-95"
        >
          ↑
        </button>
      )}
    </div>
  );
}

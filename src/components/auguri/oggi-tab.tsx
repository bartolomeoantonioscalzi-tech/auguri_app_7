"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type Contact,
  type Occasion,
  type Tranche,
  RATE_LIMIT_NOTICE,
  dayKeyOffset,
  formatTodayDate,
  hasNameDayOn,
  isBirthdayOn,
  isDeceased,
  isSent,
  loadNameDays,
  todayKey,
  type NameDaysData,
} from "@/lib/auguri";
import { AuguriCard } from "./birthday-card";

interface Props {
  contacts: Contact[];
  settings: import("@/lib/auguri").Settings;
  onMarkSent: (id: string, channel: "telegram" | "whatsapp" | "sms") => void;
  onReset: (id: string) => void;
  onGoImport: () => void;
}

interface Entry {
  contact: Contact;
  occasion: Occasion;
  tranche: Tranche;
}

interface Section {
  birthdays: Entry[];
  onomastici: Entry[];
  defunti: Entry[];
}

function buildSection(
  contacts: Contact[],
  nameDays: NameDaysData,
  dateKey: string,
  tranche: Tranche
): Section {
  const out: Section = { birthdays: [], onomastici: [], defunti: [] };
  for (const contact of contacts) {
    const deceased = isDeceased(contact.name);
    const bday = isBirthdayOn(contact, dateKey);
    const nameday = hasNameDayOn(contact, nameDays, dateKey);
    if (!bday && !nameday) continue;
    if (deceased) {
      // Defunti: SOLO nella tranche 0 (mai ±1)
      if (tranche === 0) out.defunti.push({ contact, occasion: bday ? "compleanno" : "onomastico", tranche: 0 });
      continue;
    }
    if (tranche === -1) {
      // Anticipo: SOLO onomastici (mai compleanni)
      if (nameday) out.onomastici.push({ contact, occasion: "onomastico", tranche });
    } else {
      if (bday) out.birthdays.push({ contact, occasion: "compleanno", tranche });
      if (nameday) out.onomastici.push({ contact, occasion: "onomastico", tranche });
    }
  }
  return out;
}

export function OggiTab({ contacts, settings, onMarkSent, onReset, onGoImport }: Props) {
  const [nameDays, setNameDays] = useState<NameDaysData>({ map: {}, warnings: [], loaded: false });
  const [showTop, setShowTop] = useState(false);
  const [onlyPending, setOnlyPending] = useState(false);

  useEffect(() => {
    let alive = true;
    void loadNameDays().then((d) => {
      if (alive) setNameDays(d);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const sections = useMemo(() => {
    const s0 = buildSection(contacts, nameDays, todayKey(), 0);
    const sm1 = buildSection(contacts, nameDays, dayKeyOffset(1), -1);
    const sp1 = buildSection(contacts, nameDays, dayKeyOffset(-1), 1);
    return { s0, sm1, sp1 };
  }, [contacts, nameDays]);

  const all: Entry[] = [
    ...sections.s0.birthdays,
    ...sections.s0.onomastici,
    ...sections.s0.defunti,
    ...sections.sm1.onomastici,
    ...sections.sp1.birthdays,
    ...sections.sp1.onomastici,
  ];
  const pendingCount = all.filter((e) => !isSent(e.contact)).length;
  const total = all.length;

  const filter = (entries: Entry[]) => (onlyPending ? entries.filter((e) => !isSent(e.contact)) : entries);

  const cardProps = (e: Entry) => ({
    contact: e.contact,
    settings,
    occasion: e.occasion,
    tranche: e.tranche,
    onMarkSent,
    onReset,
  });

  return (
    <div className="px-4 pb-28 pt-5">
      <header className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-[28px] font-bold text-[#3B2F1E]">Oggi</h1>
            <p className="text-[14px] capitalize text-[#8A7A5E]">{formatTodayDate()}</p>
            <p className="mt-1 text-[14px] font-bold text-[#7A6528]">
              {total} card · {pendingCount} da inviare
            </p>
          </div>
          {total > 0 && (
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

      {!nameDays.loaded && (
        <div className="mb-4 rounded-xl border border-[#E7DEC9] bg-[#F4EEDF] px-4 py-3">
          <p className="text-[13.5px] text-[#6B5B40]">⏳ Caricamento onomastici…</p>
        </div>
      )}

      {total > 0 && (
        <div className="mb-4 rounded-xl border border-[#E7DEC9] bg-[#F4EEDF] px-4 py-3">
          <p className="text-[13.5px] leading-relaxed text-[#6B5B40]">ⓘ {RATE_LIMIT_NOTICE}</p>
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[#C9B98F] bg-[#FBF7EE]/70 p-8 text-center">
          <p className="font-serif text-[19px] font-bold text-[#3B2F1E]">Nessun contatto</p>
          <p className="mx-auto mt-2 max-w-[280px] text-[14px] leading-relaxed text-[#8A7A5E]">
            Importa la rubrica dalla scheda &ldquo;Importa&rdquo; per cominciare a
            inviare gli auguri con Telegram, WhatsApp o SMS.
          </p>
          <button
            type="button"
            onClick={onGoImport}
            className="mt-4 h-11 rounded-xl bg-[#362B1D] px-5 font-serif text-[16px] font-bold text-white active:scale-[0.98]"
          >
            📥 Vai a Importa
          </button>
        </div>
      ) : total === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[#C9B98F] bg-[#FBF7EE]/70 p-8 text-center">
          <p className="font-serif text-[19px] font-bold text-[#3B2F1E]">
            Nessuna ricorrenza oggi, domani o ieri
          </p>
          <p className="mx-auto mt-2 max-w-[300px] text-[14px] leading-relaxed text-[#8A7A5E]">
            Compleanni, onomastici (e ricordi) compaiono qui tre giorni alla volta:
            il giorno prima, il giorno stesso e il giorno dopo.
          </p>
        </div>
      ) : (
        <>
          {/* OGGI (tranche 0): compleanni → onomastici → ricordo */}
          <SectionBlock title="Oggi" subtitle="" entries={[]} showTitle={false} />
          {filter(sections.s0.birthdays).length > 0 && (
            <div className="space-y-4">
              {filter(sections.s0.birthdays).map((e, i) => (
                <AuguriCard key={`b0-${e.contact.id}-${i}`} {...cardProps(e)} />
              ))}
            </div>
          )}
          {filter(sections.s0.onomastici).length > 0 && (
            <>
              <h2 className="mb-2 mt-5 font-serif text-[19px] font-bold text-[#3B2F1E]">
                Onomastici di oggi
              </h2>
              <div className="space-y-4">
                {filter(sections.s0.onomastici).map((e, i) => (
                  <AuguriCard key={`o0-${e.contact.id}-${i}`} {...cardProps(e)} />
                ))}
              </div>
            </>
          )}
          {filter(sections.s0.defunti).length > 0 && (
            <>
              <h2 className="mb-2 mt-5 font-serif text-[19px] font-bold text-[#3B2F1E]">
                Ricordo 🕊️
              </h2>
              <div className="space-y-4">
                {filter(sections.s0.defunti).map((e, i) => (
                  <AuguriCard key={`d0-${e.contact.id}-${i}`} {...cardProps(e)} />
                ))}
              </div>
            </>
          )}

          {/* DOMANI (tranche -1): solo onomastici */}
          {filter(sections.sm1.onomastici).length > 0 && (
            <>
              <h2 className="mb-2 mt-7 font-serif text-[19px] font-bold text-[#3B2F1E]">
                Domani · in anticipo
              </h2>
              <div className="space-y-4">
                {filter(sections.sm1.onomastici).map((e, i) => (
                  <AuguriCard key={`om1-${e.contact.id}-${i}`} {...cardProps(e)} />
                ))}
              </div>
            </>
          )}

          {/* IERI (tranche +1): compleanni e onomastici, mai defunti */}
          {(filter(sections.sp1.birthdays).length > 0 || filter(sections.sp1.onomastici).length > 0) && (
            <>
              <h2 className="mb-2 mt-7 font-serif text-[19px] font-bold text-[#3B2F1E]">
                Ieri · in ritardo
              </h2>
              <div className="space-y-4">
                {filter(sections.sp1.birthdays).map((e, i) => (
                  <AuguriCard key={`bp1-${e.contact.id}-${i}`} {...cardProps(e)} />
                ))}
                {filter(sections.sp1.onomastici).map((e, i) => (
                  <AuguriCard key={`op1-${e.contact.id}-${i}`} {...cardProps(e)} />
                ))}
              </div>
            </>
          )}
        </>
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

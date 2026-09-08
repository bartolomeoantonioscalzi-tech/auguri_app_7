"use client";

import { useRef, useState } from "react";
import {
  type Contact,
  type ParsedContact,
  initialsOf,
  isBirthdayToday,
  parseImportText,
  todayKey,
} from "@/lib/auguri";
import { cn } from "@/lib/utils";

interface Props {
  contacts: Contact[];
  onAdd: (contacts: Contact[]) => void;
  onRemove: (id: string) => void;
  onRemoveAll: () => void;
}

export function ImportaTab({ contacts, onAdd, onRemove, onRemoveAll }: Props) {
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<ParsedContact[] | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualBday, setManualBday] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const runParse = (text: string) => setParsed(text.trim() ? parseImportText(text) : null);

  const handleFile = async (file: File) => {
    const text = await file.text();
    setRaw(text);
    runParse(text);
  };

  const valid = parsed?.filter((p) => !p.error) ?? [];
  const invalid = parsed?.filter((p) => p.error) ?? [];

  const confirmImport = () => {
    const now = Date.now();
    onAdd(
      valid.map((p, i) => ({
        id: `${now}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        name: p.name,
        phone: p.phone,
        birthday: p.birthday,
        sent: {},
      }))
    );
    setRaw("");
    setParsed(null);
  };

  const addManual = () => {
    const name = manualName.trim();
    const phone = manualPhone.trim();
    if (!name || !phone) return;
    onAdd([
      {
        id: `${Date.now()}-man-${Math.random().toString(36).slice(2, 8)}`,
        name,
        phone: phone.startsWith("+") ? phone : `+${phone.replace(/\D/g, "")}`,
        birthday: manualBday.trim() || undefined,
        sent: {},
      },
    ]);
    setManualName("");
    setManualPhone("");
    setManualBday("");
  };

  return (
    <div className="space-y-5 px-4 pb-28 pt-5">
      <header>
        <h1 className="font-serif text-[28px] font-bold text-[#3B2F1E]">Importa</h1>
        <p className="text-[14px] text-[#8A7A5E]">
          Incolla l&rsquo;elenco festeggiati o carica un file (.txt, .csv, .vcf)
        </p>
      </header>

      {/* Zona importazione */}
      <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-4">
        <textarea
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            runParse(e.target.value);
          }}
          placeholder={"Esempi accettati:\nMario Rossi; +393331234567\nLuca Bianchi, 3391234568, 12/06\noppure un vCard esportato dai contatti"}
          rows={6}
          className="w-full resize-y rounded-lg border border-[#DCD2BB] bg-white/70 p-3 font-mono text-[13px] leading-relaxed text-[#3E3428] outline-none placeholder:text-[#B3A787] focus:border-[#C7B699]"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-10 rounded-xl bg-[#D8CBAA] px-4 text-[15px] font-bold text-[#4A3B28] active:scale-[0.98]"
          >
            📎 Carica file
          </button>
          {raw && (
            <button
              type="button"
              onClick={() => {
                setRaw("");
                setParsed(null);
              }}
              className="h-10 rounded-xl bg-[#A99F8C] px-4 text-[15px] font-bold text-white active:scale-[0.98]"
            >
              Svuota
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.csv,.vcf,text/plain,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />
        </div>

        {parsed && (
          <div className="mt-4">
            <p className="mb-2 text-[14px] font-bold text-[#3E3428]">
              Anteprima: {valid.length} contatti validi
              {invalid.length > 0 && (
                <span className="font-normal text-[#A34A2F]"> · {invalid.length} da correggere</span>
              )}
            </p>
            <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-[#DCD2BB] bg-white/60 p-2">
              {parsed.map((p, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded px-2 py-1.5 text-[14px]",
                    p.error ? "bg-[#F3DED6]" : "bg-[#F4EEDF]"
                  )}
                >
                  <span className="truncate text-[#3E3428]">
                    {p.name || <i className="text-[#A3825F]">senza nome</i>}
                  </span>
                  <span className="shrink-0 text-[#8A7A5E]">
                    {p.error ? p.error : `${p.phone}${p.birthday ? ` · ${p.birthday}` : ""}`}
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={!valid.length}
              onClick={confirmImport}
              className="mt-3 h-11 w-full rounded-xl bg-[#362B1D] font-serif text-[16px] font-bold text-white disabled:opacity-40 active:scale-[0.99]"
            >
              Importa {valid.length} contatti
            </button>
          </div>
        )}
      </section>

      {/* Aggiunta manuale */}
      <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-4">
        <h2 className="font-serif text-[18px] font-bold text-[#3B2F1E]">Aggiungi manualmente</h2>
        <div className="mt-3 grid gap-2">
          <input
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="Nome e cognome"
            className="h-11 rounded-lg border border-[#DCD2BB] bg-white/70 px-3 text-[15px] text-[#3E3428] outline-none placeholder:text-[#B3A787] focus:border-[#C7B699]"
          />
          <input
            value={manualPhone}
            onChange={(e) => setManualPhone(e.target.value)}
            inputMode="tel"
            placeholder="+39 333 1234567"
            className="h-11 rounded-lg border border-[#DCD2BB] bg-white/70 px-3 text-[15px] text-[#3E3428] outline-none placeholder:text-[#B3A787] focus:border-[#C7B699]"
          />
          <input
            value={manualBday}
            onChange={(e) => setManualBday(e.target.value)}
            inputMode="numeric"
            placeholder="Compleanno gg/mm (opzionale)"
            className="h-11 rounded-lg border border-[#DCD2BB] bg-white/70 px-3 text-[15px] text-[#3E3428] outline-none placeholder:text-[#B3A787] focus:border-[#C7B699]"
          />
          <button
            type="button"
            onClick={addManual}
            disabled={!manualName.trim() || !manualPhone.trim()}
            className="h-11 rounded-xl bg-[#362B1D] font-serif text-[16px] font-bold text-white disabled:opacity-40 active:scale-[0.99]"
          >
            Aggiungi contatto
          </button>
        </div>
      </section>

      {/* Rubrica */}
      <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-[18px] font-bold text-[#3B2F1E]">
            Rubrica ({contacts.length})
          </h2>
          {contacts.length > 0 &&
            (confirmClear ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onRemoveAll();
                    setConfirmClear(false);
                  }}
                  className="rounded-lg bg-[#A34A2F] px-3 py-1.5 text-[13px] font-bold text-white"
                >
                  Elimina tutti
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="rounded-lg bg-[#D8CBAA] px-3 py-1.5 text-[13px] font-bold text-[#4A3B28]"
                >
                  Annulla
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="text-[14px] font-bold text-[#A34A2F] underline decoration-dotted underline-offset-4"
              >
                Elimina tutti
              </button>
            ))}
        </div>

        {contacts.length === 0 ? (
          <p className="mt-3 text-[14px] text-[#8A7A5E]">
            Nessun contatto in rubrica. Importa un elenco o aggiungi un contatto manualmente.
          </p>
        ) : (
          <div className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-xl border border-[#E7DEC9] bg-[#F4EEDF]/60 p-2.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C7B699] text-[13px] font-bold text-[#4A3B28]">
                  {initialsOf(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-[#3E3428]">
                    {c.name}
                    {c.birthday === todayKey() && (
                      <span className="ml-2 rounded bg-[#BFD8BC] px-1.5 py-0.5 text-[11px] font-bold text-[#2F5B33]">
                        OGGI
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[13px] text-[#8A7A5E]">
                    {c.phone}
                    {c.birthday ? ` · comp. ${c.birthday}` : ""}
                    {!isBirthdayToday(c) ? " · non oggi" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(c.id)}
                  aria-label={`Elimina ${c.name}`}
                  className="shrink-0 rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-[#A34A2F] hover:bg-[#F3DED6]"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

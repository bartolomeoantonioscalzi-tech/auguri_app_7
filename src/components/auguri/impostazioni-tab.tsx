"use client";

import { useState } from "react";
import {
  type Contact,
  type Settings,
  PRESET_TEMPLATES,
  renderMessage,
} from "@/lib/auguri";

interface Props {
  contacts: Contact[];
  settings: Settings;
  onUpdateSettings: (patch: Partial<Settings>) => void;
  onResetAllSends: () => void;
}

export function ImpostazioniTab({ contacts, settings, onUpdateSettings, onResetAllSends }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const preview = renderMessage(settings.template, "Maria", settings.signature || "La tua firma");
  const sentCount = contacts.filter((c) => Object.keys(c.sent ?? {}).length > 0).length;

  return (
    <div className="space-y-5 px-4 pb-28 pt-5">
      <header>
        <h1 className="font-serif text-[28px] font-bold text-[#3B2F1E]">Impostazioni</h1>
        <p className="text-[14px] text-[#8A7A5E]">Firma, testo degli auguri e gestione invii</p>
      </header>

      {/* Firma */}
      <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-4">
        <h2 className="font-serif text-[18px] font-bold text-[#3B2F1E]">Firma</h2>
        <p className="mt-1 text-[13px] text-[#8A7A5E]">
          Il nome che appare nei messaggi al posto di {"{firma}"}
        </p>
        <input
          value={settings.signature}
          onChange={(e) => onUpdateSettings({ signature: e.target.value })}
          placeholder="Es. Antonio Scalzi"
          className="mt-3 h-11 w-full rounded-lg border border-[#DCD2BB] bg-white/70 px-3 text-[15px] text-[#3E3428] outline-none placeholder:text-[#B3A787] focus:border-[#C7B699]"
        />
      </section>

      {/* Template */}
      <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-4">
        <h2 className="font-serif text-[18px] font-bold text-[#3B2F1E]">Testo degli auguri</h2>
        <p className="mt-1 text-[13px] text-[#8A7A5E]">
          Usa i segnaposto <code className="rounded bg-[#F4EEDF] px-1">{"{nome}"}</code> e{" "}
          <code className="rounded bg-[#F4EEDF] px-1">{"{firma}"}</code>
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {PRESET_TEMPLATES.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onUpdateSettings({ template: p.value })}
              className={`h-9 rounded-lg px-3 text-[14px] font-bold active:scale-[0.98] ${
                settings.template === p.value
                  ? "bg-[#362B1D] text-white"
                  : "bg-[#D8CBAA] text-[#4A3B28]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <textarea
          value={settings.template}
          onChange={(e) => onUpdateSettings({ template: e.target.value })}
          rows={4}
          className="mt-3 w-full resize-y rounded-lg border border-[#DCD2BB] bg-white/70 p-3 text-[15px] leading-relaxed text-[#3E3428] outline-none focus:border-[#C7B699]"
        />

        <div className="mt-3 rounded-lg border-l-[3px] border-[#C9B98F] bg-[#F4EEDF] px-4 py-3">
          <p className="text-[12px] font-bold uppercase tracking-wide text-[#8A7A5E]">Anteprima</p>
          <p className="mt-1 font-serif text-[16px] leading-relaxed text-[#3E3428]">{preview}</p>
        </div>
      </section>

      {/* Gestione invii */}
      <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-4">
        <h2 className="font-serif text-[18px] font-bold text-[#3B2F1E]">Gestione invii</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[#8A7A5E]">
          {sentCount > 0
            ? `${sentCount} contatti hanno almeno un invio registrato. Il ripristino li riporta tutti a "DA INVIARE".`
            : "Nessun invio registrato: tutte le card sono pronte per l'invio."}
        </p>
        <button
          type="button"
          disabled={sentCount === 0}
          onClick={() => setConfirmReset(true)}
          className="mt-3 h-11 w-full rounded-xl bg-[#D8CBAA] font-serif text-[16px] font-bold text-[#4A3B28] disabled:opacity-40 active:scale-[0.99]"
        >
          ↺ Ripristina tutti gli invii
        </button>

        {confirmReset && (
          <div className="mt-3 rounded-xl border border-[#DCD2BB] bg-[#F4EEDF] p-3 text-center">
            <p className="text-[14px] text-[#3E3428]">
              Riportare <b>tutti</b> i contatti a &ldquo;DA INVIARE&rdquo;?
            </p>
            <div className="mt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetAllSends();
                  setConfirmReset(false);
                }}
                className="rounded-lg bg-[#362B1D] px-4 py-2 text-[14px] font-bold text-white"
              >
                Sì, ripristina
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded-lg bg-[#D8CBAA] px-4 py-2 text-[14px] font-bold text-[#4A3B28]"
              >
                Annulla
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Come funziona */}
      <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-4">
        <h2 className="font-serif text-[18px] font-bold text-[#3B2F1E]">Come funziona l&rsquo;invio</h2>
        <ul className="mt-2 space-y-2 text-[14px] leading-relaxed text-[#5C4F3A]">
          <li>
            <b>1.</b> Tocca un canale sulla card e conferma: l&rsquo;app si apre con il
            messaggio pronto (copia di sicurezza anche negli appunti).
          </li>
          <li>
            <b>2.</b> Se il contatto non è su Telegram, è Telegram stesso ad avvisarti
            (&ldquo;sembra che questo utente non esista&rdquo;): al ritorno rispondi
            &ldquo;No, non inviato&rdquo; e provi WhatsApp o SMS sulla stessa card.
          </li>
          <li>
            <b>3.</b> Il canale già usato mostra una spunta ✓, ma puoi sempre premere
            &ldquo;↺ Ripristina&rdquo; per azzerare la card e riprovare.
          </li>
        </ul>
        <p className="mt-2 text-[13px] text-[#8A7A5E]">
          Guida completa nella scheda <b>Aiuto</b>.
        </p>
      </section>
    </div>
  );
}

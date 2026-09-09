"use client";

import { useEffect, useState } from "react";
import {
  type Contact,
  type Settings,
  BIRTHDAY_TEMPLATES,
  fullSignature,
  renderMessage,
  sanitizeSignature,
} from "@/lib/auguri";

interface Props {
  contacts: Contact[];
  settings: Settings;
  onUpdateSettings: (patch: Partial<Settings>) => void;
  onResetAllSends: () => void;
}

export function ImpostazioniTab({ contacts, settings, onUpdateSettings, onResetAllSends }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [signatureInput, setSignatureInput] = useState(settings.signature ?? "");
  const [qualificationInput, setQualificationInput] = useState(settings.qualification ?? "");
  const [sigNotice, setSigNotice] = useState<string | null>(null);
  const sentCount = contacts.filter((c) => Object.keys(c.sent ?? {}).length > 0).length;

  useEffect(() => {
    setSignatureInput(settings.signature ?? "");
    setQualificationInput(settings.qualification ?? "");
  }, [settings.signature, settings.qualification]);

  const previewSig =
    fullSignature({ signature: signatureInput || "La tua firma", qualification: qualificationInput, template: "" }) ||
    "La tua firma";
  const preview = renderMessage(BIRTHDAY_TEMPLATES[0], "Maria", previewSig);

  const commitSignature = () => {
    const { value, changed } = sanitizeSignature(signatureInput);
    setSignatureInput(value);
    onUpdateSettings({ signature: value });
    if (changed) setSigNotice("Firma ripulita in automatico: link, numeri di telefono e simboli non sono consentiti.");
  };

  const commitQualification = () => {
    const { value, changed } = sanitizeSignature(qualificationInput);
    setQualificationInput(value);
    onUpdateSettings({ qualification: value });
    if (changed) setSigNotice("Qualifica ripulita in automatico: link, numeri di telefono e simboli non sono consentiti.");
  };

  return (
    <div className="space-y-5 px-4 pb-28 pt-5">
      <header>
        <h1 className="font-serif text-[28px] font-bold text-[#3B2F1E]">Impostazioni</h1>
        <p className="text-[14px] text-[#8A7A5E]">
          Firma, qualifica e gestione degli invii. Il testo degli auguri è chiuso (anti-spam).
        </p>
      </header>

      {/* Firma */}
      <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-4">
        <h2 className="font-serif text-[18px] font-bold text-[#3B2F1E]">Firma (obbligatoria)</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[#8A7A5E]">
          Solo lettere, spazi, punti e virgole (max 40 caratteri): link, numeri e
          simboli vengono rimossi in automatico.
        </p>
        <input
          value={signatureInput}
          onChange={(e) => {
            setSignatureInput(e.target.value);
            setSigNotice(null);
          }}
          onBlur={commitSignature}
          placeholder="Es. Antonio Scalzi"
          maxLength={60}
          className="mt-3 h-11 w-full rounded-lg border border-[#DCD2BB] bg-white/70 px-3 text-[15px] text-[#3E3428] outline-none placeholder:text-[#B3A787] focus:border-[#C7B699]"
        />
      </section>

      {/* Qualifica */}
      <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-4">
        <h2 className="font-serif text-[18px] font-bold text-[#3B2F1E]">Qualifica (facoltativa)</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[#8A7A5E]">
          Comparirà <b>dopo</b> la firma, separata da una virgola.
        </p>
        <input
          value={qualificationInput}
          onChange={(e) => {
            setQualificationInput(e.target.value);
            setSigNotice(null);
          }}
          onBlur={commitQualification}
          placeholder="Es. consulente erborista"
          maxLength={60}
          className="mt-3 h-11 w-full rounded-lg border border-[#DCD2BB] bg-white/70 px-3 text-[15px] text-[#3E3428] outline-none placeholder:text-[#B3A787] focus:border-[#C7B699]"
        />
        {sigNotice && (
          <p className="mt-2 rounded-lg bg-[#F6DCC0] px-3 py-2 text-[13px] text-[#935826]">
            ⓘ {sigNotice}
          </p>
        )}
      </section>

      {/* Testo chiuso */}
      <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-4">
        <h2 className="font-serif text-[18px] font-bold text-[#3B2F1E]">
          Testo degli auguri (chiuso)
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[#8A7A5E]">
          Il testo non è modificabile: l&apos;app lo costruisce con il nome del
          contatto e la tua firma. A ogni invio sceglie da sola un modello diverso
          (rotazione automatica), così i messaggi vicini nel tempo non sono identici
          e non vengono scambiati per spam. Nessun link, nessun numero, nessun testo libero.
        </p>
        <div className="mt-3 rounded-lg border-l-[3px] border-[#C9B98F] bg-[#F4EEDF] px-4 py-3">
          <p className="text-[12px] font-bold uppercase tracking-wide text-[#8A7A5E]">
            Anteprima (uno dei modelli a rotazione)
          </p>
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
    </div>
  );
}

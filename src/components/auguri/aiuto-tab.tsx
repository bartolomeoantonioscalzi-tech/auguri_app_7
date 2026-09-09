"use client";

import { useState } from "react";

interface Item {
  q: string;
  a: string;
}

const FAQ: Item[] = [
  {
    q: "Dove finiscono i miei contatti?",
    a: "Solo nel telefono: l'app li salva nella memoria del browser (nessun server, nessuna registrazione). Se cancelli i dati del sito cancelli anche i contatti: esporta di tanto in tanto una copia.",
  },
  {
    q: "Il messaggio parte da solo?",
    a: "No. L'app prepara il testo e apre Telegram/WhatsApp/Messaggi, ma sei sempre tu a premere invio nell'app di destinazione.",
  },
  {
    q: "Posso modificare il testo degli auguri?",
    a: "No, ed è una scelta anti-spam: il testo è chiuso. Le uniche parti personali sono la firma e la facoltativa qualifica. A ogni invio l'app sceglie da sola un modello diverso (rotazione), così i messaggi non sono identici fra loro.",
  },
  {
    q: "Cosa sono le tre sezioni Oggi / Domani / Ieri?",
    a: "Gli auguri si possono inviare in tre giorni: il giorno stesso, il giorno prima (solo onomastici, con «in anticipo» nel messaggio) e il giorno dopo (compleanni e onomastici, con «in ritardo»). I compleanni non si mandano in anticipo; i ricordi per i defunti solo il giorno stesso.",
  },
  {
    q: "Come segnalo che una persona è defunta?",
    a: "Aggiungi la parola MORTO o MORTA nel nome del contatto (es. «Mario Rossi MORTO»), nella rubrica o nell'app. L'app la rimuove automaticamente dal messaggio, invia il messaggio di ricordo solo il giorno stesso e mai in anticipo o in ritardo.",
  },
  {
    q: "Da dove vengono gli onomastici?",
    a: "Da un elenco ufficiale incorporato nell'app (non modificabile). Se un nome manca o la data ti sembra sbagliata, segnalamelo: l'elenco viene aggiornato negli aggiornamenti dell'app. I nomi composti festeggiano più volte l'anno.",
  },
  {
    q: "In quale orario posso inviare?",
    a: "La finestra consigliata è 07:00–22:00. Fuori orario l'app ti avvisa e chiede una conferma in più, ma la scelta è tua.",
  },
  {
    q: "Se sbaglio, posso ripartire da capo?",
    a: "Sì. Ogni card ha «↺ Ripristina — non inviato», e in Impostazioni c'è il ripristino di tutti gli invii.",
  },
];

const STEPS_IOS = [
  "Apri l'indirizzo dell'app con Safari",
  "Tocca il pulsante Condividi (il quadrato con la freccia in su)",
  "Scegli \u201cAggiungi alla schermata Home\u201d",
  "Tocca \u201cAggiungi\u201d: l'icona appare in Home, come una vera app",
];

const STEPS_ANDROID = [
  "Apri l'indirizzo dell'app con Chrome",
  "Tocca il menu ⋮ (in alto a destra)",
  "Scegli \u201cAggiungi alla schermata Home\u201d (o \u201cInstalla app\u201d)",
  "Conferma: l'icona appare nel menu delle app",
];

export function AiutoTab() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="space-y-5 px-4 pb-28 pt-5">
      <header>
        <h1 className="font-serif text-[28px] font-bold text-[#3B2F1E]">Aiuto</h1>
        <p className="text-[14px] text-[#8A7A5E]">Installazione, invii e domande comuni</p>
      </header>

      <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-4">
        <h2 className="font-serif text-[18px] font-bold text-[#3B2F1E]">Come funziona un invio</h2>
        <ol className="mt-2 space-y-2.5 text-[14px] leading-relaxed text-[#5C4F3A]">
          <li>
            <b>1.</b> Sulla card tocchi un canale (Telegram, WhatsApp o SMS) e confermi con
            &ldquo;Sì&rdquo;: la messaggeria si apre con il messaggio già scritto (copia negli appunti).
          </li>
          <li>
            <b>2.</b> Se il contatto non è su Telegram, Telegram stesso te lo dice
            (&ldquo;sembra che questo utente non esista&rdquo;): torna in app e rispondi
            &ldquo;No, non inviato&rdquo; — puoi usare WhatsApp o SMS sulla stessa card.
          </li>
          <li>
            <b>3.</b> Il canale già usato mostra la spunta ✓, gli altri restano attivi.
            &ldquo;↺ Ripristina — non inviato&rdquo; riporta la card all&apos;inizio.
          </li>
          <li>
            <b>4.</b> La finestra consigliata per inviare è <b>07:00–22:00</b>: fuori orario
            l&apos;app ti avvisa prima di procedere.
          </li>
        </ol>
      </section>

      <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-4">
        <h2 className="font-serif text-[18px] font-bold text-[#3B2F1E]">Le tre sezioni di Oggi</h2>
        <ul className="mt-2 space-y-2 text-[14px] leading-relaxed text-[#5C4F3A]">
          <li><b>Oggi</b>: compleanni, onomastici e ricordi del giorno. Sempre in questo ordine.</li>
          <li><b>Domani · in anticipo</b>: solo onomastici (mai compleanni, mai ricordi). Nel messaggio compare «in anticipo» prima della firma.</li>
          <li><b>Ieri · in ritardo</b>: compleanni e onomastici di ieri (mai ricordi). Nel messaggio compare «in ritardo» dopo la firma.</li>
        </ul>
      </section>

      <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-4">
        <h2 className="font-serif text-[18px] font-bold text-[#3B2F1E]">Metti l'app sul telefono</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[#8A7A5E]">
          Si installa dal browser, senza App Store, in mezzo minuto.
        </p>
        <h3 className="mt-3 font-serif text-[15px] font-bold text-[#5C4F3A]">iPhone / iPad (Safari)</h3>
        <ol className="mt-1 space-y-1.5 text-[14px] leading-relaxed text-[#5C4F3A]">
          {STEPS_IOS.map((s, i) => (
            <li key={i}><b>{i + 1}.</b> {s}</li>
          ))}
        </ol>
        <h3 className="mt-3 font-serif text-[15px] font-bold text-[#5C4F3A]">Android (Chrome)</h3>
        <ol className="mt-1 space-y-1.5 text-[14px] leading-relaxed text-[#5C4F3A]">
          {STEPS_ANDROID.map((s, i) => (
            <li key={i}><b>{i + 1}.</b> {s}</li>
          ))}
        </ol>
      </section>

      <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-4">
        <h2 className="font-serif text-[18px] font-bold text-[#3B2F1E]">
          Cosa vuol dire &ldquo;metterla online&rdquo; (deploy)?
        </h2>
        <div className="mt-2 space-y-2.5 text-[14px] leading-relaxed text-[#5C4F3A]">
          <p>
            L'app vive su un server sempre acceso che le dà un indirizzo internet.
            <b> Netlify</b> è il servizio consigliato: gratuito per l'uso normale e collegato al
            repository GitHub dove sta il codice — a ogni aggiornamento l'app si ricostruisce da
            sola. Indirizzo tipo{" "}
            <code className="rounded bg-[#F4EEDF] px-1">https://auguri.netlify.app</code>.
          </p>
          <p>
            Pubblicare l'app <b>non</b> pubblica i tuoi contatti: chi apre l'indirizzo vede la
            sua copia vuota. I tuoi contatti restano solo nel tuo telefono.
          </p>
        </div>
      </section>

      <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-4">
        <h2 className="font-serif text-[18px] font-bold text-[#3B2F1E]">Domande frequenti</h2>
        <div className="mt-2 divide-y divide-[#E7DEC9]">
          {FAQ.map((item, i) => (
            <div key={i} className="py-2">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
                className="flex w-full items-center justify-between gap-3 py-1 text-left"
              >
                <span className="text-[14px] font-bold text-[#3E3428]">{item.q}</span>
                <span
                  className={`shrink-0 text-[16px] text-[#8A7A5E] transition-transform ${openFaq === i ? "rotate-45" : ""}`}
                  aria-hidden
                >
                  ＋
                </span>
              </button>
              {openFaq === i && (
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#5C4F3A]">{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

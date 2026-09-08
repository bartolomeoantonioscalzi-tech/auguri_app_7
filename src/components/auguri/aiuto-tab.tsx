"use client";

import { useState } from "react";

interface Item {
  q: string;
  a: string;
}

const FAQ: Item[] = [
  {
    q: "Dove finiscono i miei contatti?",
    a: "Solo nel telefono: l'app li salva nella memoria del browser (nessun server, nessuna registrazione). Se cancelli la cronologia/dati del sito cancelli anche i contatti, quindi esporta di tanto in tanto una copia.",
  },
  {
    q: "Il messaggio parte da solo?",
    a: "No. L'app prepara il testo e apre Telegram/WhatsApp/Messaggi, ma sei sempre tu a premere il tasto di invio nell'app di destinazione. Nessun augurio parte senza il tuo tocco.",
  },
  {
    q: "Posso modificare il testo degli auguri?",
    a: "No, ed è una scelta precisa (anti-spam): il testo è chiuso. L'unica parte personale è la firma (Impostazioni); a ogni invio l'app sceglie da sola un modello diverso tra quelli previsti, così messaggi vicini nel tempo non sono identici e non vengono scambiati per spam.",
  },
  {
    q: "Se sbaglio, posso ripartire da capo?",
    a: "Sì. Ogni card ha il pulsante ↺ Ripristina — non inviato (con una piccola conferma) che riporta il contatto a DA INVIARE con tutti e tre i canali attivi. In Impostazioni c'è anche il ripristino di tutti gli invii.",
  },
  {
    q: "I pulsanti spariscono dopo un invio?",
    a: "No più. Il canale già usato mostra solo una spunta ✓, mentre gli altri restano sempre attivi: se Telegram non va, usi WhatsApp o SMS sulla stessa card.",
  },
  {
    q: "Serve internet?",
    a: "Solo per aprire l'app la prima volta (o dopo un aggiornamento). Dopo, l'app e i contatti restano nel telefono; ovviamente per spedire su Telegram/WhatsApp serve la connessione delle app stesse.",
  },
  {
    q: "Perché un doppio controllo prima di inviare?",
    a: "Per evitare errori: prima ti chiede Confermi invio a Nome?, poi al ritorno ti chiede se l'invio è andato a buon fine. Due tocchi in più che tengono la lista sempre veritiera.",
  },
];

const STEPS_IOS = [
  "Apri l'indirizzo dell'app con Safari (es. https://auguri.netlify.app)",
  "Tocca il pulsante Condividi (il quadrato con la freccia in su)",
  "Scorri e scegli \u201cAggiungi alla schermata Home\u201d",
  "Tocca \u201cAggiungi\u201d: l'icona appare in Home, come una vera app",
];

const STEPS_ANDROID = [
  "Apri l'indirizzo dell'app con Chrome",
  "Tocca il menu \u22ee (in alto a destra)",
  "Scegli \u201cAggiungi alla schermata Home\u201d (o \u201cInstalla app\u201d)",
  "Conferma: l'icona appare nel menu delle app",
];

export function AiutoTab() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="space-y-5 px-4 pb-28 pt-5">
      <header>
        <h1 className="font-serif text-[28px] font-bold text-[#3B2F1E]">Aiuto</h1>
        <p className="text-[14px] text-[#8A7A5E]">
          Installazione, invii e risposte alle domande comuni
        </p>
      </header>

      {/* Come funziona l'invio */}
      <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-4">
        <h2 className="font-serif text-[18px] font-bold text-[#3B2F1E]">Come funziona un invio</h2>
        <ol className="mt-2 space-y-2.5 text-[14px] leading-relaxed text-[#5C4F3A]">
          <li>
            <b>1.</b> Sulla card del festeggiato tocchi un canale (Telegram, WhatsApp o SMS) e
            confermi con &ldquo;Sì&rdquo;: l&rsquo;app scelta si apre con il messaggio già scritto.
            Il testo resta anche negli appunti come copia di sicurezza.
          </li>
          <li>
            <b>2.</b> Se il contatto <b>è su Telegram</b> si apre direttamente la sua chat col
            messaggio pronto. Se <b>non c&rsquo;è</b>, Telegram stesso te lo dice con la sua
            finestra &ldquo;Spiacenti, sembra che questo utente non esista&rdquo;: non è un errore
            dell&rsquo;app, è il modo di Telegram di dirti di provare un altro canale.
          </li>
          <li>
            <b>3.</b> Tornando nell&rsquo;app ti fa la domanda &ldquo;<b>Telegram inviato a Nome?</b>
            &rdquo;: rispondi <b>Sì, inviato</b> se il messaggio è partito, <b>No, non inviato</b> se
            qualcosa è andato storto (così il canale si libera e puoi riprovare), <b>Annulla</b> per
            decidere più tardi.
          </li>
          <li>
            <b>4.</b> I pulsanti non spariscono: il canale usato mostra la spunta ✓, gli altri
            restano attivi. Sbagliato qualcosa? &ldquo;↺ Ripristina — non inviato&rdquo; riporta la
            card come all&rsquo;inizio.
          </li>
        </ol>
      </section>

      {/* Installazione sul telefono */}
      <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-4">
        <h2 className="font-serif text-[18px] font-bold text-[#3B2F1E]">
          Metti l&rsquo;app sul telefono
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[#8A7A5E]">
          L&rsquo;app si installa dal browser, senza App Store, in mezzo minuto. Prima però deve
          avere un indirizzo internet (vedi più sotto &ldquo;Cosa vuol dire metterla online&rdquo;).
        </p>

        <h3 className="mt-3 font-serif text-[15px] font-bold text-[#5C4F3A]">
          iPhone / iPad (Safari)
        </h3>
        <ol className="mt-1 space-y-1.5 text-[14px] leading-relaxed text-[#5C4F3A]">
          {STEPS_IOS.map((s, i) => (
            <li key={i}>
              <b>{i + 1}.</b> {s}
            </li>
          ))}
        </ol>

        <h3 className="mt-3 font-serif text-[15px] font-bold text-[#5C4F3A]">Android (Chrome)</h3>
        <ol className="mt-1 space-y-1.5 text-[14px] leading-relaxed text-[#5C4F3A]">
          {STEPS_ANDROID.map((s, i) => (
            <li key={i}>
              <b>{i + 1}.</b> {s}
            </li>
          ))}
        </ol>
      </section>

      {/* Deploy / Netlify spiegato semplice */}
      <section className="rounded-[18px] border border-[#E7DEC9] bg-[#FBF7EE] p-4">
        <h2 className="font-serif text-[18px] font-bold text-[#3B2F1E]">
          Cosa vuol dire &ldquo;metterla online&rdquo; (deploy)?
        </h2>
        <div className="mt-2 space-y-2.5 text-[14px] leading-relaxed text-[#5C4F3A]">
          <p>
            In questo momento l&rsquo;app vive solo nel computer dove è stata costruita: l&rsquo;app
            del telefono non può raggiungerla. Per usarla dal telefono deve essere
            <b> copiata su un server sempre acceso</b> che le dia un indirizzo internet: questo
            passaggio si chiama <b>deploy</b> (pubblicazione).
          </p>
          <p>
            <b>Netlify</b> è il servizio consigliato: è gratuito per l&rsquo;uso normale di
            un&rsquo;app come questa ed è collegato al repository GitHub dove sta il codice. A ogni
            aggiornamento del codice, Netlify ricostruisce e aggiorna l&rsquo;app da solo. Una volta
            pubblicata, l&rsquo;app ottiene un indirizzo tipo{" "}
            <code className="rounded bg-[#F4EEDF] px-1">https://auguri.netlify.app</code> che
            funziona da qualsiasi telefono.
          </p>
          <p>
            Attenzione: pubblicare l&rsquo;app <b>non</b> pubblica i tuoi contatti. I contatti
            restano solo nel telefono dove li importi: chi altro visita l&rsquo;indirizzo vede
            l&rsquo;app vuota, con le sue liste separate.
          </p>
          <p className="text-[13px] text-[#8A7A5E]">
            In breve: deploy = l&rsquo;app prende casa su internet → apri l&rsquo;indirizzo sul
            telefono → &ldquo;Aggiungi alla schermata Home&rdquo; → e da quel momento è
            un&rsquo;applicazione con la sua icona.
          </p>
        </div>
      </section>

      {/* FAQ */}
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

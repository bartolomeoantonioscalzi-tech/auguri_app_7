// ============================================================
// Auguri — logica centrale dell'app
// FIX BUG "contatto bruciato": lo stato di invio è registrato
// PER CANALE (telegram/whatsapp/sms). Dopo un invio gli altri
// canali restano attivi e ogni card può essere ripristinata.
// ============================================================

export type Channel = "telegram" | "whatsapp" | "sms";

export interface SendRecord {
  at: number; // timestamp dell'invio
  pending?: boolean; // true = in attesa che l'utente confermi l'esito al ritorno
}

export interface Contact {
  id: string;
  name: string;
  phone: string; // formato liberale, es. "+393401485094"
  birthday?: string; // "gg/mm" (opzionale)
  // FIX: non più un booleano globale ma un record per canale.
  // Registrare il canale usato permette di:
  //  1) mostrare "Inviato via X"
  //  2) lasciare attivi gli altri canali
  //  3) ripristinare la card se l'invio è fallito
  sent?: Partial<Record<Channel, SendRecord>>;
}

export interface Settings {
  signature: string;
  template: string;
}

export const DEFAULT_TEMPLATE =
  "Tanti auguri per il tuo compleanno, {nome}! {firma}. Che sia un anno pieno di soddisfazioni.";

export const PRESET_TEMPLATES: { label: string; value: string }[] = [
  {
    label: "Classico",
    value:
      "Tanti auguri per il tuo compleanno, {nome}! {firma}. Che sia un anno pieno di soddisfazioni.",
  },
  {
    label: "Affettuoso",
    value:
      "Buon compleanno {nome}! {firma}. Un abbraccio virtuale e i migliori auguri.",
  },
  {
    label: "Breve",
    value: "Augurissimi {nome}! {firma}",
  },
];

export const DEFAULT_SETTINGS: Settings = {
  signature: "Antonio Scalzi",
  template: DEFAULT_TEMPLATE,
};

export const CHANNEL_LABEL: Record<Channel, string> = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  sms: "SMS",
};

export const CHANNEL_EMOJI: Record<Channel, string> = {
  telegram: "✈️",
  whatsapp: "💬",
  sms: "📩",
};

// ------------------------------------------------------------
// Messaggi e URL dei canali
// ------------------------------------------------------------

export function renderMessage(
  template: string,
  name: string,
  signature: string
): string {
  return template.replaceAll("{nome}", name).replaceAll("{firma}", signature);
}

function phoneDigits(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/**
 * URL per aprire il canale con il messaggio.
 * - Telegram: tg://resolve?phone= apre DIRETTAMENTE la chat del numero:
 *     · account esiste  → si apre la chat (testo da incollare, già negli appunti)
 *     · account assente → Telegram stesso mostra "Spiacenti, sembra che
 *       questo utente non esista." — è il riscontro che manca col vecchio
 *       t.me/… (che invece mostrava l'interstitial "OPEN CHAT" e chiedeva
 *       il consenso "finestra a comparsa" di Safari).
 * - WhatsApp: wa.me con testo precompilato.
 * - SMS: schema sms: con corpo precompilato (compatibile iOS/Android).
 */
export function channelUrl(channel: Channel, phone: string, text: string): string {
  const enc = encodeURIComponent(text);
  switch (channel) {
    case "telegram":
      return `tg://resolve?phone=${phoneDigits(phone)}`;
    case "whatsapp":
      return `https://wa.me/${phoneDigits(phone)}?text=${enc}`;
    case "sms":
      return `sms:${phone.trim()}?&body=${enc}`;
  }
}

// ------------------------------------------------------------
// Stato di invio (FIX)
// ------------------------------------------------------------

export function sentChannels(contact: Contact): Channel[] {
  const s = contact.sent ?? {};
  const out: Channel[] = [];
  if (s.telegram) out.push("telegram");
  if (s.whatsapp) out.push("whatsapp");
  if (s.sms) out.push("sms");
  return out;
}

export function isSent(contact: Contact): boolean {
  return sentChannels(contact).length > 0;
}

export function markSent(contact: Contact, channel: Channel): Contact {
  // pending: true → al ritorno in app l'utente dovrà confermare l'esito
  // ("X inviato a …?" Sì / No) prima di considerarlo definitivo.
  return { ...contact, sent: { ...(contact.sent ?? {}), [channel]: { at: Date.now(), pending: true } } };
}

/** Conferma esplicita dell'utente: "Sì, inviato". */
export function confirmSent(contact: Contact, channel: Channel): Contact {
  const rec = contact.sent?.[channel];
  if (!rec) return contact;
  return { ...contact, sent: { ...(contact.sent ?? {}), [channel]: { ...rec, pending: false } } };
}

/** Riscontro negativo: "No, non inviato" → il canale torna disponibile. */
export function unmarkSent(contact: Contact, channel: Channel): Contact {
  const rest = { ...(contact.sent ?? {}) };
  delete rest[channel];
  return { ...contact, sent: rest };
}

export function resetSent(contact: Contact): Contact {
  return { ...contact, sent: {} };
}

export function pendingChannels(contact: Contact): Channel[] {
  const s = contact.sent ?? {};
  const out: Channel[] = [];
  if (s.telegram?.pending) out.push("telegram");
  if (s.whatsapp?.pending) out.push("whatsapp");
  if (s.sms?.pending) out.push("sms");
  return out;
}

export function isConfirmed(contact: Contact): boolean {
  const done = sentChannels(contact);
  return done.length > 0 && pendingChannels(contact).length === 0;
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ------------------------------------------------------------
// Compleanni
// ------------------------------------------------------------

export function todayKey(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function isBirthdayToday(contact: Contact): boolean {
  if (!contact.birthday) return true; // senza data: considerato da augurare
  return contact.birthday === todayKey();
}

export function formatTodayDate(): string {
  return new Date().toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ------------------------------------------------------------
// Parsing importazione
// ------------------------------------------------------------

export interface ParsedContact {
  name: string;
  phone: string;
  birthday?: string;
  error?: string;
}

// Ricerca tollerante di un numero di telefono in una riga di testo.
// Candidati = gruppi di cifre con separatori singoli (spazio, punto, trattino,
// parentesi). Accetta il primo candidato con tra 8 e 15 cifre i cui bordi
// non proseguono con altre cifre (evita di tagliare l'ultima cifra).
const PHONE_CANDIDATE_RE = /\+?\d(?:[ .\-()]?\d)+/g;

const DATE_TOKEN_RE =
  /\b\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?\b|\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/;

interface PhoneHit {
  phone: string;
  index: number;
  length: number;
}

function findPhone(text: string): PhoneHit | undefined {
  const re = new RegExp(PHONE_CANDIDATE_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const beforeCh = text[m.index - 1];
    const afterCh = text[m.index + m[0].length];
    if (beforeCh && /\d/.test(beforeCh)) continue; // candidato interno a un numero più lungo
    if (afterCh && /\d/.test(afterCh)) continue; // il numero continua: riprendi più avanti
    const digits = m[0].replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) continue;
    const norm = normalizePhone(m[0]);
    if (norm) return { phone: norm, index: m.index, length: m[0].length };
  }
  return undefined;
}

function normalizeBirthday(raw: string): string | undefined {
  // accetta gg/mm, gg/mm/aaaa, aaaa-mm-gg, aaaammgg
  let m = raw.trim().match(/^(\d{1,2})[/.-](\d{1,2})(?:[/.-]\d{2,4})?$/);
  if (m) {
    const gg = String(parseInt(m[1], 10)).padStart(2, "0");
    const mm = String(parseInt(m[2], 10)).padStart(2, "0");
    if (parseInt(mm, 10) >= 1 && parseInt(mm, 10) <= 12 && parseInt(gg, 10) >= 1 && parseInt(gg, 10) <= 31)
      return `${gg}/${mm}`;
  }
  m = raw.trim().match(/^(\d{4})-?(\d{2})-?(\d{2})/);
  if (m) {
    const gg = String(parseInt(m[3], 10)).padStart(2, "0");
    const mm = String(parseInt(m[2], 10)).padStart(2, "0");
    if (parseInt(mm, 10) >= 1 && parseInt(mm, 10) <= 12 && parseInt(gg, 10) >= 1 && parseInt(gg, 10) <= 31)
      return `${gg}/${mm}`;
  }
  return undefined;
}

function normalizePhone(raw: string): string | undefined {
  const cleaned = raw.replace(/[^\d+]/g, "");
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return undefined;
  return cleaned.startsWith("+") ? cleaned : `+${digits}`;
}

/**
 * Parser tollerante: supporta
 *  - righe "Nome; +39...; 12/06"
 *  - righe "Nome, +39..."
 *  - righe separate da tabulazioni
 *  - file vCard (.vcf): blocchi BEGIN:VCARD con FN/N, TEL e BDAY
 */
export function parseImportText(raw: string): ParsedContact[] {
  const results: ParsedContact[] = [];

  // --- vCard ---
  if (/BEGIN:VCARD/i.test(raw)) {
    const blocks = raw.split(/BEGIN:VCARD/i).slice(1);
    for (const block of blocks) {
      const end = block.search(/END:VCARD/i);
      const body = end >= 0 ? block.slice(0, end) : block;
      let name = "";
      let phone = "";
      let birthday: string | undefined;
      for (const line of body.split(/\r?\n/)) {
        const [rawKey, ...rest] = line.split(":");
        const key = rawKey.toUpperCase();
        const value = rest.join(":").trim();
        if (!value) continue;
        if (key === "FN" && !name) name = value;
        else if (key.startsWith("N") && !name && value.includes(";")) {
          const parts = value.split(";").map((p) => p.trim()).filter(Boolean);
          if (parts.length) name = parts.length > 1 ? `${parts[1]} ${parts[0]}`.trim() : parts[0];
        } else if (key.startsWith("TEL") && !phone) phone = value;
        else if (key.startsWith("BDAY")) birthday = normalizeBirthday(value) ?? birthday;
      }
      const normPhone = phone ? normalizePhone(phone) : undefined;
      if (name && normPhone) results.push({ name: name.trim(), phone: normPhone, birthday });
      else if (name || phone)
        results.push({
          name: name || "Sconosciuto",
          phone: phone || "",
          birthday,
          error: "Dati incompleti (serve nome e telefono)",
        });
    }
    if (results.length) return results;
  }

  // --- righe di testo ---
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^(nome|cognome|name)\b/i.test(trimmed) && !/\d/.test(trimmed)) continue; // intestazione

    // 1) possibile data di compleanno sulla riga originale
    const dateToken = trimmed.match(DATE_TOKEN_RE)?.[0];

    // 2) telefono: prima sulla riga senza la data (evita di assorbirne le cifre);
    //    come ripiego, sulla riga originale (la "data" poteva far parte del numero)
    const dateless = dateToken ? trimmed.replace(dateToken, " ") : trimmed;
    let hit = findPhone(dateless);
    let sourceLine = dateless;
    let birthday = dateToken ? normalizeBirthday(dateToken) : undefined;
    if (!hit && dateToken) {
      hit = findPhone(trimmed);
      sourceLine = trimmed;
      birthday = undefined; // la "data" era in realtà parte del numero
    }

    if (!hit) {
      results.push({ name: trimmed, phone: "", error: "Telefono non trovato" });
      continue;
    }

    const beforeText = sourceLine.slice(0, hit.index);
    const afterText = sourceLine.slice(hit.index + hit.length);
    const name =
      beforeText.split(/[;,\t]|\s{2,}/).map((s) => s.trim()).filter(Boolean).join(" ").trim() ||
      afterText.split(/[;,\t]/).map((s) => s.trim()).filter(Boolean)[0] ||
      "";
    if (!name) {
      results.push({ name: "", phone: hit.phone, birthday, error: "Nome non trovato" });
      continue;
    }
    results.push({ name: name.replace(/\s+/g, " ").trim(), phone: hit.phone, birthday });
  }
  return results;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export const RATE_LIMIT_NOTICE =
  "Per evitare che WhatsApp o Telegram blocchino temporaneamente il numero, è meglio non inviare troppi messaggi tutti insieme in poco tempo. Conviene distribuire gli invii nell'arco della giornata invece di farli tutti di fila.";

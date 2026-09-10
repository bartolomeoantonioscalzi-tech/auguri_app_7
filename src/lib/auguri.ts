// ============================================================
// Auguri — logica centrale dell'app
//
// ANTI-SPAM / TESTO CHIUSO: modelli costanti nel codice,
// rotazione automatica a ogni invio, unica parte personale
// = firma (+ qualifica facoltativa), entrambe sanificate.
//
// TRANCHE: -1 solo onomastici ("in anticipo" prima della
// firma), 0 tutti, +1 compleanni e onomastici ("in ritardo"
// dopo la firma). Defunti: SOLO giorno 0, mai ±1, nessun
// marker. Compleanni: mai -1.
//
// DEFUNTI: flag MORTO/MORTA dentro il campo Nome; il nome
// nei messaggi è sempre pulito del flag.
//
// D11: NEL MESSAGGIO SOLO IL PRIMO NOME, mai il cognome.
//
// BUG FIX "contatto bruciato": stato invio PER CANALE,
// altri canali sempre attivi, card ripristinabile.
// ============================================================

import { useSyncExternalStore } from "react";

export type Channel = "telegram" | "whatsapp" | "sms";
export type Occasion = "compleanno" | "onomastico";
export type Tranche = -1 | 0 | 1;

export interface SendRecord {
  at: number; // timestamp dell'invio
  pending?: boolean; // true = in attesa di conferma al ritorno
}

export interface Contact {
  id: string;
  name: string;
  phone: string; // es. "+393401485094"
  birthday?: string; // "gg/mm" (opzionale)
  sent?: Partial<Record<Channel, SendRecord>>;
}

export interface Settings {
  signature: string;
  qualification: string; // facoltativa, DOPO la firma nel messaggio
  /** @deprecated testo chiuso: mantenuto solo per compatibilità dei dati salvati */
  template: string;
}

// ------------------------------------------------------------
// Modelli degli auguri — CHIUSI, gender-free
// ------------------------------------------------------------

export const BIRTHDAY_TEMPLATES: string[] = [
  "Tanti auguri di buon compleanno, {nome}! Un caro saluto, {firma}",
  "Buon compleanno, {nome}! Tantissimi auguri di una giornata splendida. {firma}",
  "Augurissimi, {nome}! Tante belle cose in questo giorno speciale. {firma}",
  "Ciao {nome}, i migliori auguri per il tuo compleanno! {firma}",
  "{nome}, cento di questi giorni! Tanti auguri di buon compleanno. {firma}",
];

export const ONOMASTICO_TEMPLATES: string[] = [
  "Buon onomastico, {nome}! Un caro saluto, {firma}",
  "Tanti auguri per il tuo onomastico, {nome}! {firma}",
  "Augurissimi di buon onomastico, {nome}! Tante belle cose. {firma}",
  "Ciao {nome}, tanti auguri per il tuo onomastico! {firma}",
  "{nome}, tanti auguri per la festa del tuo nome! {firma}",
];

export const DECEASED_BIRTHDAY_TEMPLATE =
  "Nel giorno del tuo Compleanno, {nome}, ti ricordiamo ancora. {firma}";

export const DECEASED_ONOMASTICO_TEMPLATE =
  "Nel giorno del tuo Onomastico, {nome}, ti ricordiamo ancora. {firma}";

// Compatibilità con dati salvati dalle versioni precedenti
export const DEFAULT_TEMPLATE = BIRTHDAY_TEMPLATES[0];
export const PRESET_TEMPLATES: { label: string; value: string }[] = BIRTHDAY_TEMPLATES.map(
  (value, i) => ({ label: `Modello ${i + 1}`, value })
);

export const DEFAULT_SETTINGS: Settings = {
  signature: "Antonio Scalzi",
  qualification: "",
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
// Sanitizzazione firma e qualifica (uniche parti editabili)
// ------------------------------------------------------------

const URL_RE = /(?:https?:\/\/|www\.)[^\s]+/gi;
const DOMAIN_RE = /[\w-]+\.(?:com|it|net|org|eu|fr|de|es|io|app|dev)\b/gi;
const HANDLE_RE = /@[\w.\-]+/g;
// Ammessi: lettere (accentate incluse), spazi, punto, virgola, apostrofi.
// Il trattino NON è ammesso: "Anna-Maria" → "Anna Maria".
const ALLOWED_CHARS_RE = /[^\p{L}\s.,'’]/gu;

export function sanitizeSignature(raw: string): { value: string; changed: boolean } {
  const original = raw.trim();
  let s = raw;
  s = s.replace(URL_RE, " ");
  s = s.replace(DOMAIN_RE, " ");
  s = s.replace(HANDLE_RE, " ");
  s = s.replace(ALLOWED_CHARS_RE, " ");
  s = s.replace(/\s+/g, " ").trim();
  if (s.length > 40) s = s.slice(0, 40).trim();
  return { value: s, changed: s !== original };
}

/** Firma completa: "Firma" oppure "Firma, Qualifica" (formato B). */
export function fullSignature(settings: Settings): string {
  const sig = sanitizeSignature(settings.signature ?? "").value;
  if (!sig) return "";
  const qual = sanitizeSignature(settings.qualification ?? "").value;
  return qual ? `${sig}, ${qual}` : sig;
}

// ------------------------------------------------------------
// Composizione messaggi (con marker di tranche integrati)
// ------------------------------------------------------------

export function renderMessage(
  template: string,
  name: string,
  signature: string,
  tranche: Tranche = 0
): string {
  let t = template;
  if (tranche === -1) {
    // "in anticipo" PRIMA della firma: «…, in anticipo, {firma}»
    t = t.replace("{firma}", "in anticipo, {firma}");
  }
  const msg = t
    .replaceAll("{nome}", (name ?? "").trim())
    .replaceAll("{firma}", signature);
  if (tranche === 1) {
    // "in ritardo" DOPO la firma: «…, {firma}, in ritardo»
    return `${msg}, in ritardo`;
  }
  return msg;
}

/** Modello corrente della rotazione (senza avanzare il contatore). */
export function peekTemplate(occasion: Occasion): string {
  hydrateRotation();
  const pool = occasion === "onomastico" ? ONOMASTICO_TEMPLATES : BIRTHDAY_TEMPLATES;
  return pool[rotationValue % pool.length];
}

/** Messaggio completo per un contatto/occasione/tranche.
 *  D11: nel messaggio SOLO il primo nome, mai il cognome. */
export function buildMessage(
  contact: Contact,
  settings: Settings,
  occasion: Occasion,
  tranche: Tranche = 0
): string {
  const deceased = isDeceased(contact.name);
  const template = deceased
    ? occasion === "onomastico"
      ? DECEASED_ONOMASTICO_TEMPLATE
      : DECEASED_BIRTHDAY_TEMPLATE
    : peekTemplate(occasion);
  const name = firstNameOf(displayName(contact.name));
  const sig = fullSignature(settings);
  return renderMessage(template, name, sig, deceased ? 0 : tranche);
}

// ------------------------------------------------------------
// Rotazione AUTOMATICA dei modelli (contatore persistito)
// ------------------------------------------------------------

const ROTATION_KEY = "auguri.rotation.v1";

let rotationValue = 0;
let rotationHydrated = false;
const rotationListeners = new Set<() => void>();

function hydrateRotation() {
  if (rotationHydrated || typeof window === "undefined") return;
  rotationHydrated = true;
  try {
    const raw = window.localStorage.getItem(ROTATION_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    rotationValue = Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    // storage non disponibile: si parte da 0
  }
}

function subscribeRotation(listener: () => void): () => void {
  hydrateRotation();
  rotationListeners.add(listener);
  return () => {
    rotationListeners.delete(listener);
  };
}

/** Avanza la rotazione: da chiamare a ogni invio tentato. */
export function advanceRotation(): void {
  hydrateRotation();
  rotationValue += 1;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(ROTATION_KEY, String(rotationValue));
    } catch {
      // storage pieno o non disponibile: resta in memoria
    }
  }
  rotationListeners.forEach((l) => l());
}

/** Indice reattivo della rotazione (per anteprime aggiornate). */
export function useRotationIndex(): number {
  return useSyncExternalStore(
    subscribeRotation,
    () => rotationValue,
    () => 0
  );
}

// ------------------------------------------------------------
// Defunti: flag MORTO/MORTA dentro il campo Nome
// ------------------------------------------------------------

const DECEASED_WORD_RE = /\b(morto|morta)\b/i;

export function isDeceased(name: string): boolean {
  return DECEASED_WORD_RE.test(name ?? "");
}

/** Nome pulito del flag (per schermo e messaggi). */
export function displayName(name: string): string {
  return (name ?? "")
    .replace(/\b(morto|morta)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ------------------------------------------------------------
// URL dei canali
// ------------------------------------------------------------

function phoneDigits(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

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
// Finestra oraria 07:00–22:00
// ------------------------------------------------------------

export const SEND_WINDOW_START = 7;
export const SEND_WINDOW_END = 22;

export function isInsideSendWindow(d: Date = new Date()): boolean {
  const h = d.getHours();
  return h >= SEND_WINDOW_START && h < SEND_WINDOW_END;
}

// ------------------------------------------------------------
// Stato di invio (per canale — nessun contatto "bruciato")
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
  return { ...contact, sent: { ...(contact.sent ?? {}), [channel]: { at: Date.now(), pending: true } } };
}

export function confirmSent(contact: Contact, channel: Channel): Contact {
  const rec = contact.sent?.[channel];
  if (!rec) return contact;
  return { ...contact, sent: { ...(contact.sent ?? {}), [channel]: { ...rec, pending: false } } };
}

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
  return new Date(ts).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

// ------------------------------------------------------------
// Date e tranche
// ------------------------------------------------------------

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function dateKey(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

/** "gg/mm" di oggi spostato di offset giorni (-1 = ieri, +1 = domani). */
export function dayKeyOffset(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return dateKey(d);
}

export function isBirthdayOn(contact: Contact, key: string): boolean {
  return !!contact.birthday && contact.birthday === key;
}

// FIX "accozzaglia": senza data di compleanno il contatto NON compare in Oggi.
export function isBirthdayToday(contact: Contact): boolean {
  return isBirthdayOn(contact, todayKey());
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
// Onomastici — file blindato /onomastici.csv (5 colonne)
// A=NOME, B=GG, C=MM, D=GG (ripetuto), E=MESE in lettere.
// Usa A,B,C; D ed E servono da controllo di coerenza.
// ------------------------------------------------------------

export interface NameDaysData {
  map: Record<string, string>; // "NPP" maiuscolo -> "gg/mm"
  warnings: string[]; // righe scartate/incoerenti
  loaded: boolean;
}

const MONTHS: Record<string, number> = {
  gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6,
  luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12,
};

export function parseNameDaysCsv(raw: string): NameDaysData {
  const map: Record<string, string> = {};
  const warnings: string[] = [];
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(",").map((c) => c.trim());
    if (cols.length < 3) {
      warnings.push(`Riga ${i + 1}: colonne insufficienti`);
      continue;
    }
    const nome = cols[0];
    const gg = cols[1];
    const mm = cols[2];
    const gg2 = cols[3] ?? "";
    const mese = (cols[4] ?? "").toLowerCase();
    if (!/^\d+$/.test(gg) || !/^\d+$/.test(mm)) continue; // intestazione o riga non valida
    const g = parseInt(gg, 10);
    const m = parseInt(mm, 10);
    if (m < 1 || m > 12 || g < 1 || g > 31) {
      warnings.push(`Riga ${i + 1}: data non valida (${nome})`);
      continue;
    }
    if (gg2 !== "" && /^\d+$/.test(gg2) && parseInt(gg2, 10) !== g) {
      warnings.push(`Riga ${i + 1}: giorno incoerente tra colonne B e D (${nome})`);
      continue;
    }
    if (mese !== "" && MONTHS[mese] !== undefined && MONTHS[mese] !== m) {
      warnings.push(`Riga ${i + 1}: mese incoerente tra colonne C ed E (${nome})`);
      continue;
    }
    const key = `${pad2(g)}/${pad2(m)}`;
    if (!map[nome.toUpperCase()]) map[nome.toUpperCase()] = key;
  }
  return { map, warnings, loaded: true };
}

let nameDaysCache: NameDaysData | null = null;

/** Carica il file blindato dalla cartella public dell'app. */
export async function loadNameDays(): Promise<NameDaysData> {
  if (nameDaysCache) return nameDaysCache;
  const fallback: NameDaysData = { map: {}, warnings: [], loaded: false };
  if (typeof window === "undefined") return fallback;
  try {
    const res = await fetch("/onomastici.csv");
    if (!res.ok) return fallback;
    nameDaysCache = parseNameDaysCsv(await res.text());
    return nameDaysCache;
  } catch {
    return fallback;
  }
}

/** Date di onomastico di un contatto (nomi composti = più festeggiamenti). */
export function nameDaysOf(contact: Contact, data: NameDaysData): string[] {
  const out: string[] = [];
  const words = displayName(contact.name).split(/[^\p{L}’']+/u);
  for (const w of words) {
    if (w.length < 2) continue;
    const hit = data.map[w.toUpperCase()];
    if (hit && !out.includes(hit)) out.push(hit);
  }
  return out;
}

export function hasNameDayOn(contact: Contact, data: NameDaysData, key: string): boolean {
  return nameDaysOf(contact, data).includes(key);
}

/** NPP del contatto che festeggiano nella data key (per etichette). */
export function matchedNameDays(contact: Contact, data: NameDaysData, key: string): string[] {
  const out: string[] = [];
  const words = displayName(contact.name).split(/[^\p{L}’']+/u);
  for (const w of words) {
    if (w.length < 2) continue;
    if (data.map[w.toUpperCase()] === key) out.push(w);
  }
  return out;
}

// ------------------------------------------------------------
// Parsing importazione rubrica (.vcf / .txt)
// ------------------------------------------------------------

export interface ParsedContact {
  name: string;
  phone: string;
  birthday?: string;
  error?: string;
}

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
    if (beforeCh && /\d/.test(beforeCh)) continue;
    if (afterCh && /\d/.test(afterCh)) continue;
    const digits = m[0].replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) continue;
    const norm = normalizePhone(m[0]);
    if (norm) return { phone: norm, index: m.index, length: m[0].length };
  }
  return undefined;
}

function dayMonth(ddRaw: string, mmRaw: string): string | undefined {
  const gg = String(parseInt(ddRaw, 10)).padStart(2, "0");
  const mm = String(parseInt(mmRaw, 10)).padStart(2, "0");
  const d = parseInt(gg, 10);
  const mo = parseInt(mm, 10);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return undefined;
  return `${gg}/${mm}`;
}

function normalizeBirthday(raw: string): string | undefined {
  const s = raw.trim();
  // vCard 4: --mm-gg
  let m = s.match(/^--(\d{1,2})-(\d{1,2})$/);
  if (m) return dayMonth(m[2], m[1]);
  // gg/mm[/aaaa], gg-mm, gg.mm
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})(?:[/.-]\d{2,4})?$/);
  if (m) return dayMonth(m[1], m[2]);
  // aaaa-mm-gg / aaaa/mm/gg
  m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return dayMonth(m[3], m[2]);
  // aaaammgg
  m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return dayMonth(m[3], m[2]);
  return undefined;
}

// FIX "prefisso": senza "+39" numeri italiani finivano letti come
// internazionali (375… = Bielorussia!). Ora:
//  "+…" → invariato | "00…" → "+"+resto | 10 cifre che iniziano per 3 → +39…
//  inizia per 0 (fisso) → +39… | altrimenti cifre grezze.
export function normalizePhone(raw: string): string | undefined {
  const cleaned = raw.replace(/[^\d+]/g, "");
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return undefined;
  if (cleaned.startsWith("+")) return cleaned;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith("3")) return `+39${digits}`;
  if (digits.startsWith("0")) return `+39${digits}`;
  return digits;
}

// --- vCard: righe di continuazione, QUOTED-PRINTABLE, gruppi itemN ---

function unfoldLines(raw: string): string[] {
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if (/^[ \t]/.test(line) && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

function decodeQuotedPrintable(value: string, charset?: string): string {
  const bytes: number[] = [];
  let out = "";
  const flush = () => {
    if (bytes.length) {
      try {
        const label = charset && charset.toLowerCase() !== "utf-8" ? charset : "utf-8";
        out += new TextDecoder(label).decode(new Uint8Array(bytes));
      } catch {
        out += String.fromCharCode(...bytes);
      }
      bytes.length = 0;
    }
  };
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === "=" && /^[0-9A-Fa-f]{2}$/.test(value.slice(i + 1, i + 3))) {
      bytes.push(parseInt(value.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      flush();
      out += ch;
    }
  }
  flush();
  return out;
}

interface Prop {
  base: string;
  params: string;
  value: string;
}

function parseProp(line: string): Prop | undefined {
  const idx = line.indexOf(":");
  if (idx < 0) return undefined;
  const head = line.slice(0, idx);
  const value = line.slice(idx + 1);
  const segs = head.split(";");
  let base = (segs.shift() ?? "").trim().toUpperCase();
  const dot = base.lastIndexOf(".");
  if (dot >= 0) base = base.slice(dot + 1); // rimuove gruppi tipo ITEM1.
  return { base, params: segs.join(";").toUpperCase(), value: value.trim() };
}

export function parseImportText(raw: string): ParsedContact[] {
  const results: ParsedContact[] = [];

  // --- vCard ---
  if (/BEGIN:VCARD/i.test(raw)) {
    const blocks = raw.split(/BEGIN:VCARD/i).slice(1);
    for (const block of blocks) {
      const end = block.search(/END:VCARD/i);
      const body = end >= 0 ? block.slice(0, end) : block;
      let name = "";
      let firstPhone = "";
      let cellPhone = "";
      let birthday: string | undefined;
      for (const line of unfoldLines(body)) {
        const prop = parseProp(line);
        if (!prop || !prop.value) continue;
        let value = prop.value;
        if (prop.params.includes("QUOTED-PRINTABLE")) {
          const charset = prop.params.match(/CHARSET=([^;]+)/)?.[1];
          value = decodeQuotedPrintable(value, charset);
        } else {
          value = value.replace(/\\n/gi, " ").replace(/\\(.)/g, "$1");
        }
        switch (prop.base) {
          case "FN":
            if (!name) name = value;
            break;
          case "N": {
            if (name) break;
            const parts = value.split(";").map((p) => p.trim()).filter(Boolean);
            if (parts.length)
              name = parts.length > 1 ? `${parts.slice(1).join(" ")} ${parts[0]}`.trim() : parts[0];
            break;
          }
          case "TEL": {
            const v = value.replace(/^tel:/i, "").trim();
            if (!v) break;
            if (!firstPhone) firstPhone = v;
            if (!cellPhone && prop.params.includes("CELL")) cellPhone = v;
            break;
          }
          case "BDAY":
            birthday = normalizeBirthday(value) ?? birthday;
            break;
        }
      }
      const chosen = cellPhone || firstPhone;
      const normPhone = chosen ? normalizePhone(chosen) : undefined;
      if (name && normPhone) results.push({ name: name.trim(), phone: normPhone, birthday });
      else if (name || chosen)
        results.push({
          name: name || "Sconosciuto",
          phone: chosen || "",
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
    if (/^(nome|cognome|name)\b/i.test(trimmed) && !/\d/.test(trimmed)) continue;

    const dateToken = trimmed.match(DATE_TOKEN_RE)?.[0];
    const dateless = dateToken ? trimmed.replace(dateToken, " ") : trimmed;
    let hit = findPhone(dateless);
    let sourceLine = dateless;
    let birthday = dateToken ? normalizeBirthday(dateToken) : undefined;
    if (!hit && dateToken) {
      hit = findPhone(trimmed);
      sourceLine = trimmed;
      birthday = undefined;
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

// ------------------------------------------------------------
// Utilità varie
// ------------------------------------------------------------

export function initialsOf(name: string): string {
  const parts = displayName(name).split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function firstNameOf(name: string): string {
  return displayName(name).split(/\s+/)[0] ?? displayName(name);
}

export const RATE_LIMIT_NOTICE =
  "Per evitare che WhatsApp o Telegram blocchino temporaneamente il numero, è meglio non inviare troppi messaggi tutti insieme in poco tempo. Oltre 20 invii al giorno, distribuiscili in tre o cinque tranche nell'arco della giornata, con una pausa di qualche minuto ogni 5 invii sulla stessa piattaforma.";

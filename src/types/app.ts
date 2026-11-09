import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Umfragen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    finaler_termin?: RecordUrl; // applookup -> URL zu 'Terminvorschlaege' Record
    titel?: string;
    beschreibung?: string;
    ort?: string;
    status?: LookupValue;
  };
}

export interface Terminvorschlaege {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    umfrage?: RecordUrl; // applookup -> URL zu 'Umfragen' Record
    beginn?: string; // Format: YYYY-MM-DD oder ISO String
    ende?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface Antworten {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    umfrage?: RecordUrl; // applookup -> URL zu 'Umfragen' Record
    termin_1?: RecordUrl; // applookup -> URL zu 'Terminvorschlaege' Record
    termin_2?: RecordUrl; // applookup -> URL zu 'Terminvorschlaege' Record
    termin_3?: RecordUrl; // applookup -> URL zu 'Terminvorschlaege' Record
    termin_4?: RecordUrl; // applookup -> URL zu 'Terminvorschlaege' Record
    termin_5?: RecordUrl; // applookup -> URL zu 'Terminvorschlaege' Record
    teilnehmer_firstname?: string;
    teilnehmer_lastname?: string;
    eindeutige_kennung?: string;
    antwort_1?: LookupValue;
    antwort_2?: LookupValue;
    antwort_3?: LookupValue;
    antwort_4?: LookupValue;
    antwort_5?: LookupValue;
  };
}

export const APP_IDS = {
  UMFRAGEN: '6af1bb70066bb64e2044e06c',
  TERMINVORSCHLAEGE: '6af1bb74c0ef920ccee93c9e',
  ANTWORTEN: '6af1bb75b6131de363839b9c',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'umfragen': {
    status: [{ key: "offen", get label() { return lookupLabel('umfragen', 'status', "offen") ?? "Offen"; } }, { key: "geschlossen", get label() { return lookupLabel('umfragen', 'status', "geschlossen") ?? "Geschlossen"; } }],
  },
  'antworten': {
    antwort_1: [{ key: "ja", get label() { return lookupLabel('antworten', 'antwort_1', "ja") ?? "Ja"; } }, { key: "vielleicht", get label() { return lookupLabel('antworten', 'antwort_1', "vielleicht") ?? "Vielleicht"; } }, { key: "nein", get label() { return lookupLabel('antworten', 'antwort_1', "nein") ?? "Nein"; } }],
    antwort_2: [{ key: "ja", get label() { return lookupLabel('antworten', 'antwort_2', "ja") ?? "Ja"; } }, { key: "vielleicht", get label() { return lookupLabel('antworten', 'antwort_2', "vielleicht") ?? "Vielleicht"; } }, { key: "nein", get label() { return lookupLabel('antworten', 'antwort_2', "nein") ?? "Nein"; } }],
    antwort_3: [{ key: "ja", get label() { return lookupLabel('antworten', 'antwort_3', "ja") ?? "Ja"; } }, { key: "vielleicht", get label() { return lookupLabel('antworten', 'antwort_3', "vielleicht") ?? "Vielleicht"; } }, { key: "nein", get label() { return lookupLabel('antworten', 'antwort_3', "nein") ?? "Nein"; } }],
    antwort_4: [{ key: "ja", get label() { return lookupLabel('antworten', 'antwort_4', "ja") ?? "Ja"; } }, { key: "vielleicht", get label() { return lookupLabel('antworten', 'antwort_4', "vielleicht") ?? "Vielleicht"; } }, { key: "nein", get label() { return lookupLabel('antworten', 'antwort_4', "nein") ?? "Nein"; } }],
    antwort_5: [{ key: "ja", get label() { return lookupLabel('antworten', 'antwort_5', "ja") ?? "Ja"; } }, { key: "vielleicht", get label() { return lookupLabel('antworten', 'antwort_5', "vielleicht") ?? "Vielleicht"; } }, { key: "nein", get label() { return lookupLabel('antworten', 'antwort_5', "nein") ?? "Nein"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'umfragen': {
    'finaler_termin': 'applookup/select',
    'titel': 'string/text',
    'beschreibung': 'string/textarea',
    'ort': 'string/text',
    'status': 'lookup/radio',
  },
  'terminvorschlaege': {
    'umfrage': 'applookup/select',
    'beginn': 'date/datetimeminute',
    'ende': 'date/datetimeminute',
  },
  'antworten': {
    'umfrage': 'applookup/select',
    'termin_1': 'applookup/select',
    'termin_2': 'applookup/select',
    'termin_3': 'applookup/select',
    'termin_4': 'applookup/select',
    'termin_5': 'applookup/select',
    'teilnehmer_firstname': 'string/text',
    'teilnehmer_lastname': 'string/text',
    'eindeutige_kennung': 'string/text',
    'antwort_1': 'lookup/radio',
    'antwort_2': 'lookup/radio',
    'antwort_3': 'lookup/radio',
    'antwort_4': 'lookup/radio',
    'antwort_5': 'lookup/radio',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
  'terminvorschlaege': [
    { field: 'finaler_termin', entity: 'umfragen' },
    { field: 'termin_1', entity: 'antworten' },
    { field: 'termin_2', entity: 'antworten' },
    { field: 'termin_3', entity: 'antworten' },
    { field: 'termin_4', entity: 'antworten' },
    { field: 'termin_5', entity: 'antworten' },
  ],
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateUmfragen = StripLookup<Umfragen['fields']>;
export type CreateTerminvorschlaege = StripLookup<Terminvorschlaege['fields']>;
export type CreateAntworten = StripLookup<Antworten['fields']>;
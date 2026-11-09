// Auto-generated. Per-entity form-enhancements config for "Antworten".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["umfrage", {"row": ["teilnehmer_firstname", "teilnehmer_lastname"]}, "termin_1", "antwort_1", "termin_2", "antwort_2", "termin_3", "antwort_3", "termin_4", "antwort_4", "termin_5", "antwort_5", "eindeutige_kennung"],
  defaults: {},
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};

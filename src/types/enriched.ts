import type { Antworten, Terminvorschlaege, Umfragen } from './app';

export type EnrichedUmfragen = Umfragen & {
  finaler_terminName: string;
};

export type EnrichedTerminvorschlaege = Terminvorschlaege & {
  umfrageName: string;
};

export type EnrichedAntworten = Antworten & {
  umfrageName: string;
  termin_1Name: string;
  termin_2Name: string;
  termin_3Name: string;
  termin_4Name: string;
  termin_5Name: string;
};

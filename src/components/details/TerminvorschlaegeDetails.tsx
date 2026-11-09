import type { Terminvorschlaege, Umfragen, Antworten } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface TerminvorschlaegeDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Terminvorschlaege;
  /** N:1-Ziel „Umfragen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  umfragenList: Umfragen[];
  /** Klick auf die Umfragen-Relation → overlay.push auf dessen Detail. */
  onOpenUmfragen?: (record: Umfragen) => void;
  /** 1:N „Umfragen" (finaler_termin): VOLLE Liste — der Block filtert auf diesen Record. */
  umfragenFinalerTerminList: Umfragen[];
  /** Zeilen-Klick → overlay.push auf das Umfragen-Detail (nie der Edit-Dialog). */
  onOpenUmfragenFinalerTermin: (record: Umfragen) => void;
  /** Kontextuelles „+": öffnet den Umfragen-Dialog mit diesem Record vorgesetzt. */
  onAddUmfragenFinalerTermin?: () => void;
  /** 1:N „Antworten" (termin_1): VOLLE Liste — der Block filtert auf diesen Record. */
  antwortenTermin1List: Antworten[];
  /** Zeilen-Klick → overlay.push auf das Antworten-Detail (nie der Edit-Dialog). */
  onOpenAntwortenTermin1: (record: Antworten) => void;
  /** Kontextuelles „+": öffnet den Antworten-Dialog mit diesem Record vorgesetzt. */
  onAddAntwortenTermin1?: () => void;
  /** 1:N „Antworten" (termin_2): VOLLE Liste — der Block filtert auf diesen Record. */
  antwortenTermin2List: Antworten[];
  /** Zeilen-Klick → overlay.push auf das Antworten-Detail (nie der Edit-Dialog). */
  onOpenAntwortenTermin2: (record: Antworten) => void;
  /** Kontextuelles „+": öffnet den Antworten-Dialog mit diesem Record vorgesetzt. */
  onAddAntwortenTermin2?: () => void;
  /** 1:N „Antworten" (termin_3): VOLLE Liste — der Block filtert auf diesen Record. */
  antwortenTermin3List: Antworten[];
  /** Zeilen-Klick → overlay.push auf das Antworten-Detail (nie der Edit-Dialog). */
  onOpenAntwortenTermin3: (record: Antworten) => void;
  /** Kontextuelles „+": öffnet den Antworten-Dialog mit diesem Record vorgesetzt. */
  onAddAntwortenTermin3?: () => void;
  /** 1:N „Antworten" (termin_4): VOLLE Liste — der Block filtert auf diesen Record. */
  antwortenTermin4List: Antworten[];
  /** Zeilen-Klick → overlay.push auf das Antworten-Detail (nie der Edit-Dialog). */
  onOpenAntwortenTermin4: (record: Antworten) => void;
  /** Kontextuelles „+": öffnet den Antworten-Dialog mit diesem Record vorgesetzt. */
  onAddAntwortenTermin4?: () => void;
  /** 1:N „Antworten" (termin_5): VOLLE Liste — der Block filtert auf diesen Record. */
  antwortenTermin5List: Antworten[];
  /** Zeilen-Klick → overlay.push auf das Antworten-Detail (nie der Edit-Dialog). */
  onOpenAntwortenTermin5: (record: Antworten) => void;
  /** Kontextuelles „+": öffnet den Antworten-Dialog mit diesem Record vorgesetzt. */
  onAddAntwortenTermin5?: () => void;
}

export function TerminvorschlaegeDetails({
  record,
  umfragenList,
  onOpenUmfragen,
  umfragenFinalerTerminList,
  onOpenUmfragenFinalerTermin,
  onAddUmfragenFinalerTermin,
  antwortenTermin1List,
  onOpenAntwortenTermin1,
  onAddAntwortenTermin1,
  antwortenTermin2List,
  onOpenAntwortenTermin2,
  onAddAntwortenTermin2,
  antwortenTermin3List,
  onOpenAntwortenTermin3,
  onAddAntwortenTermin3,
  antwortenTermin4List,
  onOpenAntwortenTermin4,
  onAddAntwortenTermin4,
  antwortenTermin5List,
  onOpenAntwortenTermin5,
  onAddAntwortenTermin5,
}: TerminvorschlaegeDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const umfrageTarget = umfragenList.find(r => r.record_id === extractRecordId(record.fields.umfrage));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('terminvorschlaege', 'beginn')} value={record.fields.beginn} format="datetime" />
        <RecordField label={fieldLabel('terminvorschlaege', 'ende')} value={record.fields.ende} format="datetime" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('terminvorschlaege', 'umfrage')}
          name={umfrageTarget?.fields.titel ?? '—'}
          meta={[umfrageTarget?.fields.ort].filter(Boolean).join(' · ') || undefined}
          onClick={umfrageTarget && onOpenUmfragen ? () => onOpenUmfragen!(umfrageTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={`${appLabel('umfragen')} · ${fieldLabel('umfragen', 'finaler_termin')}`}
        items={umfragenFinalerTerminList.filter(r => extractRecordId(r.fields.finaler_termin) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('umfragen'), meta: undefined })}
        onOpen={onOpenUmfragenFinalerTermin}
        onAdd={onAddUmfragenFinalerTermin}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('antworten')} · ${fieldLabel('antworten', 'termin_1')}`}
        items={antwortenTermin1List.filter(r => extractRecordId(r.fields.termin_1) === record.record_id)}
        map={r => ({ name: r.fields.teilnehmer_firstname ?? appLabel('antworten'), meta: undefined })}
        onOpen={onOpenAntwortenTermin1}
        onAdd={onAddAntwortenTermin1}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('antworten')} · ${fieldLabel('antworten', 'termin_2')}`}
        items={antwortenTermin2List.filter(r => extractRecordId(r.fields.termin_2) === record.record_id)}
        map={r => ({ name: r.fields.teilnehmer_firstname ?? appLabel('antworten'), meta: undefined })}
        onOpen={onOpenAntwortenTermin2}
        onAdd={onAddAntwortenTermin2}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('antworten')} · ${fieldLabel('antworten', 'termin_3')}`}
        items={antwortenTermin3List.filter(r => extractRecordId(r.fields.termin_3) === record.record_id)}
        map={r => ({ name: r.fields.teilnehmer_firstname ?? appLabel('antworten'), meta: undefined })}
        onOpen={onOpenAntwortenTermin3}
        onAdd={onAddAntwortenTermin3}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('antworten')} · ${fieldLabel('antworten', 'termin_4')}`}
        items={antwortenTermin4List.filter(r => extractRecordId(r.fields.termin_4) === record.record_id)}
        map={r => ({ name: r.fields.teilnehmer_firstname ?? appLabel('antworten'), meta: undefined })}
        onOpen={onOpenAntwortenTermin4}
        onAdd={onAddAntwortenTermin4}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={`${appLabel('antworten')} · ${fieldLabel('antworten', 'termin_5')}`}
        items={antwortenTermin5List.filter(r => extractRecordId(r.fields.termin_5) === record.record_id)}
        map={r => ({ name: r.fields.teilnehmer_firstname ?? appLabel('antworten'), meta: undefined })}
        onOpen={onOpenAntwortenTermin5}
        onAdd={onAddAntwortenTermin5}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.TERMINVORSCHLAEGE} recordId={record.record_id} readOnly={!perms.canWrite('terminvorschlaege')} />
    </>
  );
}

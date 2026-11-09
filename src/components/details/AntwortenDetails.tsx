import type { Antworten, Umfragen, Terminvorschlaege } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface AntwortenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Antworten;
  /** N:1-Ziel „Umfragen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  umfragenList: Umfragen[];
  /** Klick auf die Umfragen-Relation → overlay.push auf dessen Detail. */
  onOpenUmfragen?: (record: Umfragen) => void;
  /** N:1-Ziel „Terminvorschlaege": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  terminvorschlaegeList: Terminvorschlaege[];
  /** Klick auf die Terminvorschlaege-Relation → overlay.push auf dessen Detail. */
  onOpenTerminvorschlaege?: (record: Terminvorschlaege) => void;
}

export function AntwortenDetails({
  record,
  umfragenList,
  onOpenUmfragen,
  terminvorschlaegeList,
  onOpenTerminvorschlaege,
}: AntwortenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const umfrageTarget = umfragenList.find(r => r.record_id === extractRecordId(record.fields.umfrage));
  const termin_1Target = terminvorschlaegeList.find(r => r.record_id === extractRecordId(record.fields.termin_1));
  const termin_2Target = terminvorschlaegeList.find(r => r.record_id === extractRecordId(record.fields.termin_2));
  const termin_3Target = terminvorschlaegeList.find(r => r.record_id === extractRecordId(record.fields.termin_3));
  const termin_4Target = terminvorschlaegeList.find(r => r.record_id === extractRecordId(record.fields.termin_4));
  const termin_5Target = terminvorschlaegeList.find(r => r.record_id === extractRecordId(record.fields.termin_5));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('antworten', 'teilnehmer_firstname')} value={record.fields.teilnehmer_firstname} format="text" />
        <RecordField label={fieldLabel('antworten', 'teilnehmer_lastname')} value={record.fields.teilnehmer_lastname} format="text" />
        <RecordField label={fieldLabel('antworten', 'eindeutige_kennung')} value={record.fields.eindeutige_kennung} format="text" />
        <RecordField label={fieldLabel('antworten', 'antwort_1')} value={record.fields.antwort_1} format="pill" />
        <RecordField label={fieldLabel('antworten', 'antwort_2')} value={record.fields.antwort_2} format="pill" />
        <RecordField label={fieldLabel('antworten', 'antwort_3')} value={record.fields.antwort_3} format="pill" />
        <RecordField label={fieldLabel('antworten', 'antwort_4')} value={record.fields.antwort_4} format="pill" />
        <RecordField label={fieldLabel('antworten', 'antwort_5')} value={record.fields.antwort_5} format="pill" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('antworten', 'umfrage')}
          name={umfrageTarget?.fields.titel ?? '—'}
          meta={[umfrageTarget?.fields.ort].filter(Boolean).join(' · ') || undefined}
          onClick={umfrageTarget && onOpenUmfragen ? () => onOpenUmfragen!(umfrageTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('antworten', 'termin_1')}
          name={termin_1Target?.fields.umfrage ?? '—'}
          meta={undefined}
          onClick={termin_1Target && onOpenTerminvorschlaege ? () => onOpenTerminvorschlaege!(termin_1Target!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('antworten', 'termin_2')}
          name={termin_2Target?.fields.umfrage ?? '—'}
          meta={undefined}
          onClick={termin_2Target && onOpenTerminvorschlaege ? () => onOpenTerminvorschlaege!(termin_2Target!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('antworten', 'termin_3')}
          name={termin_3Target?.fields.umfrage ?? '—'}
          meta={undefined}
          onClick={termin_3Target && onOpenTerminvorschlaege ? () => onOpenTerminvorschlaege!(termin_3Target!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('antworten', 'termin_4')}
          name={termin_4Target?.fields.umfrage ?? '—'}
          meta={undefined}
          onClick={termin_4Target && onOpenTerminvorschlaege ? () => onOpenTerminvorschlaege!(termin_4Target!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('antworten', 'termin_5')}
          name={termin_5Target?.fields.umfrage ?? '—'}
          meta={undefined}
          onClick={termin_5Target && onOpenTerminvorschlaege ? () => onOpenTerminvorschlaege!(termin_5Target!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.ANTWORTEN} recordId={record.record_id} readOnly={!perms.canWrite('antworten')} />
    </>
  );
}

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { IconCopy, IconQrcode, IconPlus, IconCheck, IconMapPin, IconUsers } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { flowActionFor, countOf } from '@/config/plan';
import type { EnrichedUmfragen, EnrichedTerminvorschlaege, EnrichedAntworten } from '@/types/enriched';
import { extractRecordId } from '@/services/livingAppsService';
import { lookupKey } from '@/lib/formatters';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { tx, appLabel, dateFnsLocale } from '@/i18n';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatCard, StatCardRow } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { Button } from '@/components/ui/button';
import { usePublicPageLink } from '@/components/widgets/PublicPageQr';
import { qrSvgString } from '@/components/widgets/QrCode';

type Filter = 'all' | 'open' | 'nofinal';

interface TerminStat {
  termin: EnrichedTerminvorschlaege;
  ja: number;
  vielleicht: number;
}

function fmtTermin(t: EnrichedTerminvorschlaege): string {
  const loc = { locale: dateFnsLocale() };
  const b = t.fields.beginn ? parseISO(t.fields.beginn) : null;
  const e = t.fields.ende ? parseISO(t.fields.ende) : null;
  if (!b) return '—';
  const start = format(b, 'EEE dd.MM. HH:mm', loc);
  if (!e) return start;
  const sameDay = format(b, 'yyyy-MM-dd') === format(e, 'yyyy-MM-dd');
  return `${start} – ${format(e, sameDay ? 'HH:mm' : 'EEE dd.MM. HH:mm', loc)}`;
}

function ShareButtons({ recordId }: { recordId: string }) {
  const { link } = usePublicPageLink('umfragen', recordId);
  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      undoToast(tx('Link kopiert'));
    } catch {
      undoToast(link);
    }
  };
  const openQr = () => {
    if (!link) return;
    const url = URL.createObjectURL(new Blob([qrSvgString(link, { margin: 4 })], { type: 'image/svg+xml' }));
    window.open(url, '_blank', 'noopener');
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" disabled={!link} onClick={copy}>
        <IconCopy size={16} className="shrink-0" />
        <span>{tx('Link kopieren')}</span>
      </Button>
      <Button variant="outline" size="sm" disabled={!link} onClick={openQr}>
        <IconQrcode size={16} className="shrink-0" />
        <span>{tx('QR-Code öffnen')}</span>
      </Button>
    </div>
  );
}

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type !== 'umfragen') return undefined;
      if (lookupKey(top.record.fields.status) === 'geschlossen') return undefined;
      const go = flowActionFor('umfragen', 'status', top.record.record_id, 'geschlossen');
      return go ? { label: tx('Final festlegen & schließen'), onClick: go } : undefined;
    },
  });
  const umfragen: EnrichedUmfragen[] = crud.enriched.umfragen;
  const termine: EnrichedTerminvorschlaege[] = crud.enriched.terminvorschlaege;
  const antworten: EnrichedAntworten[] = crud.enriched.antworten;
  const clock = useClock();
  const [filter, setFilter] = useState<Filter>('all');

  const isOpen = (u: EnrichedUmfragen) => lookupKey(u.fields.status) !== 'geschlossen';
  const hasFinal = (u: EnrichedUmfragen) => !!extractRecordId(u.fields.finaler_termin);

  const perSurvey = useMemo(() => {
    const map = new Map<string, { termine: TerminStat[]; answers: EnrichedAntworten[] }>();
    for (const u of umfragen) map.set(u.record_id, { termine: [], answers: [] });
    for (const a of antworten) {
      const id = extractRecordId(a.fields.umfrage);
      if (id) map.get(id)?.answers.push(a);
    }
    for (const t of termine) {
      const id = extractRecordId(t.fields.umfrage);
      const entry = id ? map.get(id) : undefined;
      if (!entry) continue;
      let ja = 0;
      let vielleicht = 0;
      for (const a of entry.answers) {
        for (const k of [1, 2, 3, 4, 5] as const) {
          if (extractRecordId(a.fields[`termin_${k}`]) !== t.record_id) continue;
          const v = lookupKey(a.fields[`antwort_${k}`]);
          if (v === 'ja') ja++;
          else if (v === 'vielleicht') vielleicht++;
        }
      }
      entry.termine.push({ termin: t, ja, vielleicht });
    }
    for (const e of map.values()) {
      e.termine.sort((x, y) => (x.termin.fields.beginn ?? '').localeCompare(y.termin.fields.beginn ?? ''));
    }
    return map;
  }, [umfragen, termine, antworten]);

  const open = umfragen.filter(isOpen);
  const noFinal = open.filter(u => !hasFinal(u));
  const visible = umfragen
    .filter(u => filter === 'open' ? isOpen(u) : filter === 'nofinal' ? isOpen(u) && !hasFinal(u) : true)
    .sort((a, b) => Number(isOpen(b)) - Number(isOpen(a)) || (b.createdat ?? '').localeCompare(a.createdat ?? ''));

  const latest = [...antworten]
    .sort((a, b) => (b.createdat ?? '').localeCompare(a.createdat ?? ''))
    .slice(0, 6);

  const contextLine = open.length > 0
    ? tx`${namen(open.map(u => u.fields.titel ?? ''))} — hier laufen noch Antworten ein.`
    : umfragen.length > 0
      ? tx('Alle Umfragen sind abgeschlossen.')
      : tx('Lege deine erste Umfrage an und teile den Link.');

  const create = () => crud.umfragen.openCreate({ status: 'offen' });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="text-sm text-muted-foreground">{contextLine}</p>
        </div>
        {crud.umfragen.canWrite && (
          <Button onClick={create}>
            <IconPlus size={16} className="shrink-0" />
            <span>{tx('Neue Umfrage')}</span>
          </Button>
        )}
      </header>

      <DashboardGrid
        variant="split"
        kpis={umfragen.length > 0 ? (
          <StatCardRow>
            <StatCard
              title={tx('Offene Umfragen')}
              value={open.length}
              description={open.length > 0 ? tx('Antworten laufen ein') : tx('Alles abgeschlossen')}
              onClick={() => setFilter(f => f === 'open' ? 'all' : 'open')}
              active={filter === 'open'}
              tone="primary"
            />
            <StatCard
              title={tx('Ohne finalen Termin')}
              value={noFinal.length}
              description={noFinal.length > 0 ? tx('Termin festlegen & schließen') : tx('Alles entschieden')}
              onClick={() => setFilter(f => f === 'nofinal' ? 'all' : 'nofinal')}
              active={filter === 'nofinal'}
              tone={noFinal.length > 0 ? 'warning' : 'default'}
            />
          </StatCardRow>
        ) : undefined}
        primary={
          // widget-rejected: no widget covers a per-survey vote matrix with share link/QR; cards built by hand
          <div className="space-y-4">
            {visible.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-[27px] bg-card p-8 text-center shadow-lg">
                <IconUsers size={48} className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{tx('Noch keine Umfrage in dieser Ansicht.')}</p>
                {crud.umfragen.canWrite && <Button onClick={create}>{tx('Erste Umfrage anlegen')}</Button>}
              </div>
            )}
            {visible.map(u => {
              const info = perSurvey.get(u.record_id);
              const stats = info?.termine ?? [];
              const maxJa = Math.max(0, ...stats.map(s => s.ja));
              const finalId = extractRecordId(u.fields.finaler_termin);
              const closed = !isOpen(u);
              const close = isOpen(u) ? flowActionFor('umfragen', 'status', u.record_id, 'geschlossen') : null;
              return (
                <article key={u.record_id} className="overflow-hidden rounded-[27px] bg-card p-4 shadow-lg sm:p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <button type="button" className="block max-w-full truncate text-left text-lg font-semibold hover:underline" onClick={() => crud.umfragen.openDetail(u)}>
                        {u.fields.titel}
                      </button>
                      <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                        <span className={closed ? 'font-medium text-foreground' : 'font-medium text-emerald-600'}>{u.fields.status?.label}</span>
                        <span>{countOf('antworten', info?.answers.length ?? 0, appLabel('antworten'))}</span>
                        {u.fields.ort && <span className="flex min-w-0 items-center gap-1 truncate"><IconMapPin size={14} className="shrink-0" />{u.fields.ort}</span>}
                      </p>
                    </div>
                    <ShareButtons recordId={u.record_id} />
                  </div>

                  {stats.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{tx('Noch keine Terminvorschläge.')}</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {stats.map(s => {
                        const isFinal = s.termin.record_id === finalId;
                        const best = maxJa > 0 && s.ja === maxJa;
                        return (
                          <button
                            key={s.termin.record_id}
                            type="button"
                            onClick={() => crud.terminvorschlaege.openDetail(s.termin)}
                            className={`min-w-0 rounded-2xl border p-3 text-left transition-colors hover:bg-muted/50 ${isFinal ? 'border-primary bg-primary/10' : best ? 'border-emerald-500 bg-emerald-500/10' : 'border-border'}`}
                          >
                            <div className="truncate text-sm font-medium">{fmtTermin(s.termin)}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                              <span><b className="text-foreground">{s.ja}</b> {tx('Ja')}</span>
                              <span><b className="text-foreground">{s.vielleicht}</b> {tx('Vielleicht')}</span>
                              {isFinal && <span className="flex items-center gap-1 font-medium text-primary"><IconCheck size={14} />{tx('Final')}</span>}
                              {!isFinal && best && <span className="font-medium text-emerald-600">{tx('Meiste Ja')}</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {!closed && (
                    <div className="flex flex-wrap gap-2">
                      {close && (
                        <Button size="sm" onClick={close}>{tx('Final festlegen & schließen')}</Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => crud.umfragen.openDetail(u)}>{tx('Alle Antworten ansehen')}</Button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        }
        aside={
          <WorkList
            title={tx('Neueste Antworten')}
            items={latest.map(a => ({
              id: a.record_id,
              title: [a.fields.teilnehmer_firstname, a.fields.teilnehmer_lastname].filter(Boolean).join(' ') || '—',
              secondLine: <span className="text-muted-foreground">{a.umfrageName}</span>,
            }))}
            onItemClick={id => {
              const rec = antworten.find(a => a.record_id === id);
              if (rec) crud.antworten.openDetail(rec);
            }}
            empty={{ text: tx('Noch keine Antworten — teile den Link deiner Umfrage.') }}
          />
        }
      />
      {crud.surfaces}
    </div>
  );
}

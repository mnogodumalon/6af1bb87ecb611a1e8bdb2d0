import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PublicShell } from '@/components/PublicShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/blocks/Field';
import { FieldErrorSummary } from '@/components/blocks/FieldErrorSummary';
import { LoadProblem } from '@/components/blocks/LoadProblem';
import {
  loadPublicPagesConfig, PageUnavailableError,
  type PublicPagesConfig, type PublicPageConfig,
} from '@/lib/publicClient';
import { createPublicPort } from '@/lib/journey/publicPort';
import {
  useStepForm, useJourneySubmit, useLiveList,
  fieldText, fieldRef, fieldLookup, recordIdOf,
  type JourneyRecord, type JourneyPort,
} from '@/lib/journey';
import { tx } from '@/i18n';

const SLUG = 'termin-abstimmen';
const MAX_TERMINE = 5;
const SLOTS = [1, 2, 3, 4, 5];

function newKennung(): string {
  const a = Math.random().toString(36).slice(2, 10);
  const b = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${a}${b}`;
}

function splitDateTime(text: string): { day: string; time: string } {
  const parts = text.split(' ');
  return { day: parts[0] ?? '', time: parts[1] ?? '' };
}

export default function TerminAbstimmen() {
  const [cfg, setCfg] = useState<PublicPagesConfig | null>(null);
  const [page, setPage] = useState<PublicPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    loadPublicPagesConfig(SLUG)
      .then(c => {
        setCfg(c);
        setPage(c?.pages[SLUG] ?? null);
        setLoading(false);
      })
      .catch(e => {
        if (e instanceof PageUnavailableError) setUnavailable(true);
        setLoading(false);
      });
  }, []);

  if (loading || unavailable || !cfg || !page) {
    return <PublicShell loading={loading} unavailable={!loading} />;
  }
  return <Umfrage cfg={cfg} page={page} />;
}

function AnswerMark({ k }: { k: string | undefined }) {
  if (k === 'ja') return <span className="font-semibold text-emerald-700">{tx('Ja')}</span>;
  if (k === 'vielleicht') return <span className="font-semibold text-amber-600">{tx('Vielleicht')}</span>;
  if (k === 'nein') return <span className="text-muted-foreground">{tx('Nein')}</span>;
  return <span className="text-muted-foreground">–</span>;
}

function Umfrage({ cfg, page }: { cfg: PublicPagesConfig; page: PublicPageConfig }) {
  const [params] = useSearchParams();
  const linkedId = params.get('umfrage');
  const port: JourneyPort = useMemo(() => createPublicPort(cfg, page), [cfg, page]);

  const umfragen = useLiveList(port, 'umfragen', { intervalMs: 0 });
  const termineLive = useLiveList(port, 'terminvorschlaege', { intervalMs: 0 });
  const antwortenLive = useLiveList(port, 'antworten', { intervalMs: 30000 });

  const [kennung, setKennung] = useState(newKennung);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const umfrage: JourneyRecord | null = useMemo(
    () => (linkedId ? umfragen.records.find(r => r.id === linkedId) ?? null : null),
    [umfragen.records, linkedId],
  );

  const termine = useMemo(() => {
    if (!linkedId) return [] as JourneyRecord[];
    return termineLive.records
      .filter(r => fieldRef(r, 'umfrage') !== null && recordIdOf(fieldRef(r, 'umfrage')) === linkedId)
      .sort((a, b) => (fieldText(a, 'beginn') > fieldText(b, 'beginn') ? 1 : -1))
      .slice(0, MAX_TERMINE);
  }, [termineLive.records, linkedId]);

  const antworten = useMemo(() => {
    if (!linkedId) return [] as JourneyRecord[];
    return antwortenLive.records.filter(r => recordIdOf(fieldRef(r, 'umfrage')) === linkedId);
  }, [antwortenLive.records, linkedId]);

  const f = useStepForm('antworten', {
    fields: ['teilnehmer_firstname', 'teilnehmer_lastname', ...SLOTS.map(i => `antwort_${i}`)],
    required: { teilnehmer_firstname: true, teilnehmer_lastname: true },
    autoComplete: true,
  });

  const submit = useJourneySubmit(
    port,
    [{
      key: 'antwort',
      entity: 'antworten',
      form: f,
      primary: true,
      values: () => ({
        umfrage: linkedId,
        eindeutige_kennung: kennung,
        termin_1: termine[0]?.id,
        termin_2: termine[1]?.id,
        termin_3: termine[2]?.id,
        termin_4: termine[3]?.id,
        termin_5: termine[4]?.id,
      }),
    }],
    {
      draftKey: `abstimmung-${linkedId ?? 'ohne'}`,
      check: async () => {
        if (!linkedId) return null;
        const u = await port.get('umfragen', linkedId);
        if (u && fieldLookup(u, 'status')?.key === 'geschlossen') {
          return tx('Diese Umfrage wurde inzwischen geschlossen.');
        }
        return null;
      },
      onSuccess: () => { void antwortenLive.reload(); setSent(true); },
    },
  );

  const counts = termine.map((t) => {
    let ja = 0;
    let vielleicht = 0;
    antworten.forEach(a => {
      for (const k of SLOTS) {
        if (recordIdOf(fieldRef(a, `termin_${k}`)) === t.id) {
          const key = fieldLookup(a, `antwort_${k}`)?.key;
          if (key === 'ja') ja += 1;
          if (key === 'vielleicht') vielleicht += 1;
        }
      }
    });
    return { ja, vielleicht };
  });
  const maxJa = counts.reduce((m, c) => Math.max(m, c.ja), 0);

  if (!linkedId) {
    return (
      <PublicShell title={page.title}>
        <p className="text-sm text-muted-foreground">
          {tx('Dieser Link ist unvollständig. Öffne bitte den Link zu deiner Umfrage noch einmal.')}
        </p>
      </PublicShell>
    );
  }
  if ((!umfragen.loaded && umfragen.error) || (!termineLive.loaded && termineLive.error) || (!antwortenLive.loaded && antwortenLive.error)) {
    return (
      <PublicShell title={page.title}>
        <LoadProblem onRetry={() => { void umfragen.reload(); void termineLive.reload(); void antwortenLive.reload(); }} />
      </PublicShell>
    );
  }
  if (!umfragen.loaded || !termineLive.loaded || !antwortenLive.loaded) {
    return <PublicShell loading />;
  }
  if (!umfrage) {
    return (
      <PublicShell title={page.title}>
        <p className="text-sm text-muted-foreground">
          {tx('Dieser Link passt zu keiner Umfrage. Öffne bitte den Link noch einmal.')}
        </p>
      </PublicShell>
    );
  }

  const closed = fieldLookup(umfrage, 'status')?.key === 'geschlossen';
  const finalId = recordIdOf(fieldRef(umfrage, 'finaler_termin'));
  const finalTermin = finalId ? termine.find(t => t.id === finalId) ?? null : null;
  const beschreibung = fieldText(umfrage, 'beschreibung');
  const ort = fieldText(umfrage, 'ort');

  const send = () => {
    setAnswerError(null);
    const namesOk = f.validate(['teilnehmer_firstname', 'teilnehmer_lastname']);
    const missing = termine.some((_, i) => !f.get(`antwort_${i + 1}`));
    if (missing) setAnswerError(tx('Bitte wähle für jeden Termin Ja, Vielleicht oder Nein.'));
    if (!namesOk || missing) return;
    void submit.run();
  };

  const another = () => {
    submit.reset();
    f.reset();
    setKennung(newKennung());
    setSent(false);
    setAnswerError(null);
  };

  return (
    <PublicShell title={fieldText(umfrage, 'titel') || page.title} description={beschreibung || undefined} wide>
      <div className="space-y-5">
        {ort && <p className="text-sm text-muted-foreground">{tx('Ort')}: {ort}</p>}

        {closed && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm">
            <p className="font-semibold text-emerald-800">{tx('Die Umfrage ist geschlossen.')}</p>
            {finalTermin ? (
              <p className="mt-1 text-emerald-900">
                {tx('Finaler Termin')}: <b>{fieldText(finalTermin, 'beginn')}</b>
                {fieldText(finalTermin, 'ende') ? ` – ${fieldText(finalTermin, 'ende')}` : ''}
              </p>
            ) : (
              <p className="mt-1 text-emerald-900">{tx('Ein finaler Termin wurde noch nicht festgelegt.')}</p>
            )}
          </div>
        )}

        {!closed && !sent && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field form={f} name="teilnehmer_firstname">
              <Input {...f.field('teilnehmer_firstname')} />
            </Field>
            <Field form={f} name="teilnehmer_lastname">
              <Input {...f.field('teilnehmer_lastname')} />
            </Field>
          </div>
        )}

        {termine.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tx('Für diese Umfrage gibt es noch keine Termine.')}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="sticky left-0 z-10 max-w-[40vw] bg-muted p-2 text-left font-medium">{tx('Teilnehmende')}</th>
                  {termine.map((t, i) => {
                    const b = splitDateTime(fieldText(t, 'beginn'));
                    const best = !closed && maxJa > 0 && counts[i].ja === maxJa;
                    const isFinal = closed && t.id === finalId;
                    return (
                      <th key={t.id} className={`min-w-[6rem] p-2 text-center font-medium ${best || isFinal ? 'bg-emerald-100 text-emerald-900' : ''}`}>
                        <div>{b.day}</div>
                        <div className="text-xs font-normal text-muted-foreground">{b.time}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {antworten.map(a => (
                  <tr key={a.id} className="border-t">
                    <td className="sticky left-0 z-10 max-w-[40vw] truncate bg-background p-2">
                      {fieldText(a, 'teilnehmer_firstname')} {fieldText(a, 'teilnehmer_lastname')}
                    </td>
                    {termine.map(t => {
                      let key: string | undefined;
                      for (const k of SLOTS) {
                        if (recordIdOf(fieldRef(a, `termin_${k}`)) === t.id) key = fieldLookup(a, `antwort_${k}`)?.key;
                      }
                      return <td key={t.id} className="p-2 text-center"><AnswerMark k={key} /></td>;
                    })}
                  </tr>
                ))}
                {antworten.length === 0 && (
                  <tr className="border-t">
                    <td colSpan={termine.length + 1} className="p-3 text-center text-muted-foreground">
                      {tx('Noch niemand hat abgestimmt.')}
                    </td>
                  </tr>
                )}
                <tr className="border-t bg-muted/30">
                  <td className="sticky left-0 z-10 max-w-[40vw] bg-muted p-2 text-xs font-medium">{tx('Ja / Vielleicht')}</td>
                  {termine.map((t, i) => (
                    <td key={t.id} className={`p-2 text-center text-xs ${!closed && maxJa > 0 && counts[i].ja === maxJa ? 'bg-emerald-100 font-semibold text-emerald-900' : ''}`}>
                      <span className="text-emerald-700">{counts[i].ja}</span> / <span className="text-amber-600">{counts[i].vielleicht}</span>
                    </td>
                  ))}
                </tr>
                {!closed && !sent && (
                  <tr className="border-t-2">
                    <td className="sticky left-0 z-10 max-w-[40vw] bg-background p-2 text-xs font-medium">{tx('Deine Antwort')}</td>
                    {SLOTS.map((slot, i) => {
                      const c = f.choice(`antwort_${slot}`);
                      const t = termine[i];
                      return (
                        <td key={slot} hidden={!t} className="p-1.5 align-top">
                          <div className="flex flex-col gap-1" role="group" data-key={`antwort_${slot}`}>
                            {c.options.map(o => (
                              <button
                                key={o.key}
                                type="button"
                                onClick={() => c.onChange(o.key)}
                                aria-pressed={c.value === o.key}
                                className={`rounded-md border px-2 py-1.5 text-xs ${c.value === o.key ? 'border-primary bg-primary text-primary-foreground' : 'bg-background'}`}
                              >
                                {o.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!closed && !sent && termine.length > 0 && (
          <div className="space-y-3">
            <FieldErrorSummary forms={[f]} />
            {answerError && <p role="alert" className="text-sm text-destructive">{answerError}</p>}
            {submit.error && !submit.offline && <p role="alert" className="text-sm text-destructive">{submit.error.message}</p>}
            {submit.offline && <p className="text-sm text-muted-foreground">{tx('Keine Verbindung — deine Eingaben sind gesichert.')}</p>}
            <Button type="button" className="w-full sm:w-auto" disabled={submit.submitting} onClick={send}>
              {tx('Antwort speichern')}
            </Button>
          </div>
        )}

        {!closed && sent && (
          <div className="space-y-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm">
            <p className="font-semibold text-emerald-800">{tx('Danke, deine Antwort steht jetzt in der Tabelle.')}</p>
            <Button type="button" variant="outline" onClick={another}>{tx('Weitere Person eintragen')}</Button>
          </div>
        )}
      </div>
    </PublicShell>
  );
}

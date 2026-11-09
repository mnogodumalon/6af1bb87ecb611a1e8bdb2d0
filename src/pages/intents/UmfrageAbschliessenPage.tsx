/**
 * Umfrage abschließen — 4-Schritt-Wizard.
 * Steps: 1) Offene Umfrage wählen → 2) Antworten und Auswertung ansehen → 3) Finalen Termin wählen → 4) Prüfen & schließen.
 * Reads: umfragen, terminvorschlaege, antworten. Writes: umfragen (finaler_termin, status=geschlossen) via useUmfrageAbschliessenFlow.
 * Composes: IntentWizardShell, EntitySelectStep, StepNav, SummaryStep, SuccessStep.
 */
import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup, fieldDate, fieldRef, useLiveList, refFilter } from '@/lib/journey';
import { useUmfrageAbschliessenFlow } from '@/lib/journey/flows/UmfrageAbschliessen';
import { tx } from '@/i18n';

function slotLabel(beginn: string | null, ende: string | null): string {
  if (!beginn) return '—';
  const b = parseISO(beginn);
  const start = format(b, 'dd.MM.yyyy HH:mm');
  if (!ende) return start;
  const e = parseISO(ende);
  const sameDay = format(b, 'yyyy-MM-dd') === format(e, 'yyyy-MM-dd');
  return `${start} – ${format(e, sameDay ? 'HH:mm' : 'dd.MM.yyyy HH:mm')}`;
}

export default function UmfrageAbschliessenPage() {
  const [step, setStep] = useState(1);
  const [umfrageId, setUmfrageId] = useState<string | null>(null);

  const flow = useUmfrageAbschliessenFlow({
    steps: { umfragen: 1, finaler_termin: 3 },
    items: {
      umfragen: r => ({
        id: r.id,
        title: fieldText(r, 'titel'),
        subtitle: fieldText(r, 'ort') || undefined,
        status: fieldLookup(r, 'status') ?? undefined,
      }),
      finaler_termin: r => ({
        id: r.id,
        title: slotLabel(fieldDate(r, 'beginn'), fieldDate(r, 'ende')),
      }),
    },
    where: {
      umfragen: r => fieldLookup(r, 'status')?.key === 'offen',
      finaler_termin: r => !umfrageId || fieldRef(r, 'umfrage') === umfrageId,
    },
  });

  const termine = useLiveList(flow.port, 'terminvorschlaege', {
    intervalMs: 0,
    enabled: Boolean(umfrageId),
    list: umfrageId ? { filter: refFilter('umfrage', umfrageId), orderby: ['r.v_beginn asc'] } : undefined,
  });
  const antworten = useLiveList(flow.port, 'antworten', {
    intervalMs: 0,
    enabled: Boolean(umfrageId),
    list: umfrageId ? { filter: refFilter('umfrage', umfrageId), limit: 500 } : undefined,
  });

  const tally = useMemo(() => {
    const own = termine.records.filter(t => fieldRef(t, 'umfrage') === umfrageId);
    return own.map(t => {
      let ja = 0;
      let vielleicht = 0;
      let nein = 0;
      for (const a of antworten.records) {
        for (let i = 1; i <= 5; i++) {
          if (fieldRef(a, `termin_${i}`) !== t.id) continue;
          const k = fieldLookup(a, `antwort_${i}`)?.key;
          if (k === 'ja') ja++;
          else if (k === 'vielleicht') vielleicht++;
          else if (k === 'nein') nein++;
        }
      }
      return { id: t.id, label: slotLabel(fieldDate(t, 'beginn'), fieldDate(t, 'ende')), ja, vielleicht, nein };
    });
  }, [termine.records, antworten.records, umfrageId]);

  const best = tally.reduce<number>((m, t) => Math.max(m, t.ja * 2 + t.vielleicht), -1);
  const pickUmfrage = flow.pick('umfragen');
  const loadingData = termine.loading || antworten.loading;

  return (
    <IntentWizardShell
      title={tx('Umfrage abschließen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Lege den finalen Termin fest und schließe die Umfrage.'),
        needs: [tx('Eine offene Umfrage')],
      }}
    >
      <WizardStep label={tx('Umfrage')} description={tx('Welche offene Umfrage möchtest du abschließen?')}>
        <EntitySelectStep
          {...flow.picks.umfragen.select}
          {...pickUmfrage}
          onSelect={id => {
            setUmfrageId(id);
            pickUmfrage.onSelect(id);
          }}
          avatar="none"
          searchPlaceholder={tx('Titel oder Ort …')}
          emptyText={tx('Es gibt keine offene Umfrage mehr.')}
        />
      </WizardStep>

      <WizardStep label={tx('Auswertung')} description={tx('So haben die Teilnehmenden abgestimmt.')}>
        {!umfrageId ? (
          <StepNav onBack={() => setStep(1)} nextDisabled>
            {tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}
          </StepNav>
        ) : (
          <div className="space-y-4">
            {loadingData ? (
              <p className="text-sm text-muted-foreground">{tx('Antworten werden geladen …')}</p>
            ) : tally.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tx('Diese Umfrage hat keine Terminvorschläge.')}</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {tx`${antworten.records.length} Antworten zu ${tally.length} Terminvorschlägen`}
                </p>
                <ul className="space-y-2">
                  {tally.map(t => (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-2 overflow-hidden rounded-2xl border bg-card p-3"
                    >
                      <span className="min-w-0 font-medium">
                        {t.label}
                        {t.ja * 2 + t.vielleicht === best && best > 0 && (
                          <span className="ml-2 text-xs font-normal text-emerald-600">{tx('Beste Zustimmung')}</span>
                        )}
                      </span>
                      <span className="flex flex-wrap gap-3 text-sm">
                        <span className="text-emerald-600">{tx`${t.ja} Ja`}</span>
                        <span className="text-amber-600">{tx`${t.vielleicht} Vielleicht`}</span>
                        <span className="text-red-600">{tx`${t.nein} Nein`}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {antworten.records.map(a => (
                    <li key={a.id}>
                      {fieldText(a, 'teilnehmer_firstname')} {fieldText(a, 'teilnehmer_lastname')}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <StepNav onBack={() => setStep(1)} onNext={() => true} nextStepLabel={tx('Termin wählen')} />
          </div>
        )}
      </WizardStep>

      <WizardStep label={tx('Finaler Termin')} description={tx('Welcher Terminvorschlag soll gelten?')}>
        {!umfrageId ? (
          <StepNav onBack={() => setStep(1)} nextDisabled>
            {tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}
          </StepNav>
        ) : (
          <EntitySelectStep
            {...flow.picks.finaler_termin.select}
            {...flow.pick('finaler_termin')}
            avatar="none"
            create={false}
            emptyText={tx('Diese Umfrage hat keine Terminvorschläge.')}
          />
        )}
      </WizardStep>

      <WizardStep label={tx('Prüfen')} description={tx('Prüfe die Angaben und schließe die Umfrage.')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'status', label: tx('Status'), value: tx('Geschlossen') }]}
            confirmLabel={tx('Umfrage schließen')}
            whatHappensNext={tx('Der Termin wird festgelegt und die Umfrage geschlossen.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          undo={flow.undo}
          next={[
            { label: tx('Umfrage anlegen'), href: '#/intents/umfrage-anlegen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}

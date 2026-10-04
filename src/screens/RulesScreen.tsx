import { Page } from '../components/Layout';
import { CAMP_NAMES, ROLES, SPECIAL_ROLES } from '../config/roles';
import { useApp } from '../store/app';

export function RulesScreen() {
  const go = useApp((s) => s.go);
  return (
    <Page title="Spielregeln" onBack={() => go('home')}>
      <article className="paper mb-5 text-lg">
        <h2 className="font-marker text-2xl">Worum geht's?</h2>
        <p>
          Die Klasse schreibt eine Arbeit – aber unter den Mitspielern verstecken sich <b>Lehrer</b>. Das{' '}
          <b>{CAMP_NAMES.schueler}</b> muss alle Lehrer enttarnen und rauswerfen. Das <b>{CAMP_NAMES.lehrer}</b> erwischt in
          jeder Pause heimlich einen Schüler.
        </p>
        <h2 className="mt-3 font-marker text-2xl">Ablauf</h2>
        <p>
          <b>Pause:</b> Alle legen den Kopf auf den Tisch, Augen zu. Das Handy ruft die Rollen nacheinander auf. Wer
          aufgerufen wird, tippt still seine Wahl ein. Auch Rollen, die gar nicht mitspielen, werden aufgerufen – so
          verrät nichts, wer dabei ist.
        </p>
        <p>
          <b>Stunde:</b> Das Handy verkündet, wer erwischt wurde – <b>BUSTED!</b> Dann wird diskutiert, und die{' '}
          <b>Klassenkonferenz</b> stimmt ab, wer rausfliegt. Bei Gleichstand gibt es eine Stichwahl, bei erneutem
          Gleichstand fliegt niemand.
        </p>
        <h2 className="mt-3 font-marker text-2xl">Wer gewinnt?</h2>
        <p>
          Die Schüler, sobald alle Lehrer raus sind. Die Lehrer, sobald sie mindestens so viele sind wie alle anderen.
          Eine gemischte Gruppenarbeit gewinnt, wenn nur noch die beiden übrig sind.
        </p>
        <p className="mt-2 text-base">Wer ausgeschieden ist, bleibt still – auch wenn's schwerfällt.</p>
      </article>

      <h2 className="chalk-title mb-3 text-2xl">Die Rollen</h2>
      <div className="flex flex-col gap-3 pb-4">
        {(['lehrer', 'schueler', ...SPECIAL_ROLES] as const).map((id) => {
          const r = ROLES[id];
          return (
            <section key={id} className="card-chalk p-4">
              <h3 className="flex items-center gap-2 text-2xl">
                <span>{r.emoji}</span> {r.name}
                <span className={`ml-auto rounded-full px-2 text-sm ${r.camp === 'lehrer' ? 'bg-chalk-red/30' : 'bg-chalk-blue/25'}`}>
                  {CAMP_NAMES[r.camp]}
                </span>
              </h3>
              <p className="mt-1 text-lg leading-snug text-chalk-dim">{r.rules}</p>
            </section>
          );
        })}
      </div>
    </Page>
  );
}

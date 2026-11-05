/** A tab for a job the desk will do, saying plainly that it can't yet and what's missing. */
export function NotBuilt({ title, why, needs, state }: { title: string; why: string; needs: string[]; state?: string }) {
  return (
    <section className="dk">
      <header className="dk__head">
        <div className="dk__headtext">
          <h1 className="display dk__title">{title}</h1>
          <p className="dk__note">{why}</p>
        </div>
      </header>
      {state && <p className="sample-note dk__state">{state}</p>}
      <div className="dk__panel dk__needs">
        <h2 className="dk__panelhead">What this tab is waiting for</h2>
        <ul>
          {needs.map((need) => <li key={need}>{need}</li>)}
        </ul>
      </div>
    </section>
  );
}

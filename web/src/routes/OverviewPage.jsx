import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button.jsx';

export default function OverviewPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">How CadQuery selection works</h2>
        <p className="mt-4 text-sm text-muted-foreground">
          CadQuery selectors are composable strings and helpers that identify sub-shapes of a model—faces, edges, vertices,
          wires, and more. This tutorial helps you master selectors from orientation filters to property-based matching,
          spatial queries, and advanced chaining.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/lessons/lesson-basic-all-faces">Start lessons</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/playground">Open playground</Link>
          </Button>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Selector building blocks</h3>
          <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-muted-foreground">
            <li>Orientation filters such as <code className="rounded bg-muted px-1">&gt;Z</code> or <code className="rounded bg-muted px-1">|Y</code>.</li>
            <li>Property filters by area, radius, or planarity.</li>
            <li>Chaining selections across faces, edges, and vertices.</li>
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Why selectors matter</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Accurate selections automate downstream operations such as fillets, chamfers, and feature detection. This tool
            provides live feedback and highlighting so you can iterate quickly and build reliable CadQuery scripts.
          </p>
        </div>
      </section>
    </div>
  );
}

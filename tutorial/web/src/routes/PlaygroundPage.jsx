import { useEffect, useMemo, useState } from 'react';
import CadViewport from '../components/CadViewport.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { useAppStore } from '../store/useAppStore.js';
import { compileModel, runSelection } from '../lib/api.js';

export default function PlaygroundPage() {
  const { examples, selectionResult, setSelectionResult, history, highlightOnly, toggleHighlightOnly } = useAppStore();
  const [selectedExample, setSelectedExample] = useState('');
  const [modelInfo, setModelInfo] = useState(null);
  const [source, setSource] = useState('');
  const [selection, setSelection] = useState('.faces("Z")');
  const [filters, setFilters] = useState({ areaMin: '', areaMax: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (examples.length && !selectedExample) {
      setSelectedExample(examples[0].id);
    }
  }, [examples, selectedExample]);

  const filterPayload = useMemo(() => {
    const payload = {};
    if (filters.areaMin) payload.minArea = Number(filters.areaMin);
    if (filters.areaMax) payload.maxArea = Number(filters.areaMax);
    return payload;
  }, [filters]);

  async function handleCompile() {
    setLoading(true);
    setError(null);
    try {
      let payload = {};
      let uploadFile = null;
      if (file) {
        uploadFile = file;
      } else if (source.trim()) {
        payload = { source };
      } else if (selectedExample) {
        payload = { asset: selectedExample };
      }
      const compiled = await compileModel(payload, uploadFile);
      setModelInfo(compiled);
      setSelectionResult(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to compile model.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelection() {
    if (!modelInfo) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        modelId: modelInfo.modelId,
        selection,
        filters: filterPayload
      };
      const result = await runSelection(payload);
      setSelectionResult({ ...result, expression: selection });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to run selection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Model source</h2>
            <Button onClick={handleCompile} disabled={loading}>
              Load model
            </Button>
          </div>
          <div className="mt-3 space-y-4 text-sm">
            <div>
              <label className="mb-1 block font-medium">Built-in example</label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2"
                value={selectedExample}
                onChange={(event) => setSelectedExample(event.target.value)}
              >
                {examples.map((example) => (
                  <option key={example.id} value={example.id}>
                    {example.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-medium">Paste CadQuery source</label>
              <Textarea
                rows={5}
                placeholder={'result = cq.Workplane("XY").box(20, 20, 5)'}
                value={source}
                onChange={(event) => setSource(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block font-medium">Upload STEP/STL</label>
              <Input type="file" accept=".step,.stp,.stl" onChange={(event) => setFile(event.target.files[0])} />
            </div>
          </div>
        </div>
        <CadViewport modelUrl={modelInfo?.meshUrl} selectionUrl={selectionResult?.previewMeshUrl} />
      </div>
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Selection</h3>
            <Button variant="outline" onClick={toggleHighlightOnly}>
              {highlightOnly ? 'Show base' : 'Highlight only'}
            </Button>
          </div>
          <Textarea value={selection} onChange={(event) => setSelection(event.target.value)} rows={4} />
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">Min area</label>
              <Input
                value={filters.areaMin}
                onChange={(event) => setFilters((state) => ({ ...state, areaMin: event.target.value }))}
                placeholder="e.g. 10"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">Max area</label>
              <Input
                value={filters.areaMax}
                onChange={(event) => setFilters((state) => ({ ...state, areaMax: event.target.value }))}
                placeholder="e.g. 200"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSelection} disabled={loading || !modelInfo}>
              Run selection
            </Button>
            <Button variant="secondary" onClick={() => setSelectionResult(null)}>
              Clear
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
        <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Results</h3>
          {selectionResult ? (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Faces: {selectionResult.counts.faces} · Edges: {selectionResult.counts.edges} · Vertices:
                {selectionResult.counts.vertices}
              </p>
              <ul className="space-y-1">
                {selectionResult.items.map((item) => (
                  <li key={item.id} className="rounded border border-dashed border-border px-2 py-1 font-mono text-xs">
                    {item.id}
                  </li>
                ))}
              </ul>
              {selectionResult.previewMeshUrl && (
                <Button asChild variant="outline">
                  <a href={selectionResult.previewMeshUrl} download>
                    Download selection (glTF)
                  </a>
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Run a selection to inspect results.</p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
          <h3 className="text-lg font-semibold">History</h3>
          <ul className="mt-2 space-y-2 text-xs">
            {history.map((entry) => (
              <li key={entry.timestamp} className="rounded border border-border p-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  <span>
                    F:{entry.result.counts.faces} E:{entry.result.counts.edges} V:{entry.result.counts.vertices}
                  </span>
                </div>
                <div className="mt-1 font-mono">{entry.result.expression || selection}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

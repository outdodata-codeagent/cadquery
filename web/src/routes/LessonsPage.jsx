import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CadViewport from '../components/CadViewport.jsx';
import { Button } from '../components/ui/button.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { useAppStore } from '../store/useAppStore.js';
import { compileModel, fetchLesson, fetchLessons, runSelection } from '../lib/api.js';

const lessonOrderCache = [];

export default function LessonsPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { lessons, setLessons, selectionResult, setSelectionResult, highlightOnly, toggleHighlightOnly } = useAppStore();
  const [lesson, setLesson] = useState(null);
  const [selection, setSelection] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function ensureLessons() {
      if (!lessons.length) {
        const data = await fetchLessons();
        setLessons(data);
      }
    }
    ensureLessons();
  }, [lessons.length, setLessons]);

  useEffect(() => {
    if (lessons.length && !lessonOrderCache.length) {
      lessonOrderCache.push(...lessons.map((item) => item.id));
    }
  }, [lessons]);

  useEffect(() => {
    if (!lessonId && lessons.length) {
      navigate(`/lessons/${lessons[0].id}`, { replace: true });
    }
  }, [lessonId, lessons, navigate]);

  useEffect(() => {
    if (!lessonId) return;
    async function loadLesson() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchLesson(lessonId);
        setLesson(data);
        setSelection(data.startingSelection || '');
        const compiled = await compileModel({ asset: data.model });
        setModelInfo(compiled);
        setSelectionResult(null);
      } catch (err) {
        console.error(err);
        setError('Could not load lesson.');
      } finally {
        setLoading(false);
      }
    }
    loadLesson();
  }, [lessonId]);

  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        handleRun();
      }
      if (event.key.toLowerCase() === 'h') {
        toggleHighlightOnly();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const lessonIndex = useMemo(() => lessonOrderCache.indexOf(lessonId), [lessonId]);

  const handleRun = useCallback(async () => {
    if (!selection || !modelInfo) return;
    setLoading(true);
    setError(null);
    try {
      const result = await runSelection({ modelId: modelInfo.modelId, selection });
      setSelectionResult({ ...result, expression: selection });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Selection failed.');
    } finally {
      setLoading(false);
    }
  }, [modelInfo, selection, setSelectionResult]);

  const goTo = (offset) => {
    const next = lessonOrderCache[lessonIndex + offset];
    if (next) {
      navigate(`/lessons/${next}`);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Lesson</p>
            <h2 className="text-2xl font-semibold">{lesson?.title || 'Loading...'}</h2>
            <p className="text-sm text-muted-foreground">{lesson?.goal}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setSelection(lesson?.startingSelection || '')}>
              Reset
            </Button>
            <Button onClick={() => goTo(-1)} disabled={lessonIndex <= 0}>
              Prev
            </Button>
            <Button onClick={() => goTo(1)} disabled={lessonIndex === lessonOrderCache.length - 1}>
              Next
            </Button>
          </div>
        </div>
        <CadViewport modelUrl={modelInfo?.meshUrl} selectionUrl={selectionResult?.previewMeshUrl} />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
            <p className="text-xs uppercase text-muted-foreground">Model snippet</p>
            <pre className="mt-2 overflow-x-auto rounded bg-muted p-3 text-xs leading-relaxed">{lesson?.snippet}</pre>
          </div>
          <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
            <p className="text-xs uppercase text-muted-foreground">Notes</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {lesson?.notes?.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Selection</h3>
            <span className="text-xs text-muted-foreground">Ctrl/Cmd + Enter to run — press H to toggle highlight</span>
          </div>
          <Textarea value={selection} onChange={(event) => setSelection(event.target.value)} rows={4} />
          <div className="flex gap-2">
            <Button onClick={handleRun} disabled={loading}>Run</Button>
            <Button variant="secondary" onClick={() => setShowSolution((value) => !value)}>
              {showSolution ? 'Hide solution' : 'Show solution'}
            </Button>
            <Button variant="outline" onClick={toggleHighlightOnly}>
              {highlightOnly ? 'Show base' : 'Highlight only'}
            </Button>
          </div>
          {showSolution && (
            <div className="mt-3 rounded bg-muted p-3 text-xs">
              Solution: <code>{lesson?.solution}</code>
            </div>
          )}
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
                    {item.id} ({item.type})
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Run the selection to see results.</p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Hints</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {lesson?.hints?.map((hint) => (
              <li key={hint}>{hint}</li>
            )) || <li>Think about the face orientation or property described in the goal.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

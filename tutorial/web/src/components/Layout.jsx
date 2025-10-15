import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, PlayCircle } from 'lucide-react';
import { fetchExamples, fetchLessons } from '../lib/api.js';
import { useAppStore } from '../store/useAppStore.js';
import { Button } from './ui/button.jsx';

export default function Layout({ children }) {
  const location = useLocation();
  const { lessons, setLessons, examples, setExamples } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!lessons.length) {
        try {
          const data = await fetchLessons();
          setLessons(data);
        } catch (error) {
          console.error('Unable to load lessons', error);
        }
      }
      if (!examples.length) {
        try {
          const data = await fetchExamples();
          setExamples(data);
        } catch (error) {
          console.error('Unable to load examples', error);
        }
      }
    }
    loadData();
  }, [lessons.length, examples.length, setLessons, setExamples]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside
        className={`z-20 w-72 flex-shrink-0 border-r border-border bg-background transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <Link to="/" className="font-semibold text-lg">
            CadQuery Selections
          </Link>
          <button
            type="button"
            className="rounded-md border border-border p-2 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>
        <nav className="h-full overflow-y-auto px-4 pb-8 pt-4 text-sm">
          <div className="mb-6">
            <p className="mb-2 font-semibold uppercase tracking-wide text-xs text-muted-foreground">
              Lessons
            </p>
            <ul className="space-y-1">
              {lessons.map((lesson) => (
                <li key={lesson.id}>
                  <Link
                    to={`/lessons/${lesson.id}`}
                    className={`block rounded-md px-3 py-2 hover:bg-secondary hover:text-secondary-foreground ${
                      location.pathname.includes(lesson.id) ? 'bg-secondary text-secondary-foreground' : ''
                    }`}
                  >
                    {lesson.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 font-semibold uppercase tracking-wide text-xs text-muted-foreground">
              Playground
            </p>
            <Link
              to="/playground"
              className={`flex items-center gap-2 rounded-md px-3 py-2 hover:bg-secondary hover:text-secondary-foreground ${
                location.pathname.startsWith('/playground') ? 'bg-secondary text-secondary-foreground' : ''
              }`}
            >
              <PlayCircle size={16} /> Try selections
            </Link>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Examples</p>
              {examples.map((example) => (
                <div key={example.id} className="flex items-center justify-between">
                  <span>{example.name}</span>
                  <span className="text-muted-foreground">{example.tags.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-border p-2 lg:hidden"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label="Toggle navigation"
            >
              <Menu size={18} />
            </button>
            <h1 className="text-lg font-semibold capitalize">
              {location.pathname === '/'
                ? 'Overview'
                : location.pathname.includes('playground')
                  ? 'Playground'
                  : 'Lessons'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary">
              <a href="https://cadquery.readthedocs.io/en/latest/selectors.html" target="_blank" rel="noreferrer">
                Selection docs
              </a>
            </Button>
            <Button asChild>
              <a href="https://github.com/CadQuery/cadquery" target="_blank" rel="noreferrer">
                CadQuery GitHub
              </a>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4">{children}</main>
      </div>
    </div>
  );
}

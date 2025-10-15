import { Route, Routes, Navigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import LessonsPage from './LessonsPage.jsx';
import PlaygroundPage from './PlaygroundPage.jsx';
import OverviewPage from './OverviewPage.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/lessons/:lessonId?" element={<LessonsPage />} />
        <Route path="/playground" element={<PlaygroundPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

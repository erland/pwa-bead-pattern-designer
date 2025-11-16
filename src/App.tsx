import { Link, Route, Routes } from 'react-router-dom';
import {
  HomePage,
  PatternEditorPage,
  PatternGroupEditorPage,
  ImageConvertPage,
  PatternPrintPage,
  PatternGroupPrintPage,
} from './routes';
import './App.css';
import { ThemeToggle } from './settings/ThemeToggle';

export default function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header__title">Bead Pattern Designer</div>
        <nav className="app-header__nav">
          <Link to="/">Patterns</Link>
          <Link to="/convert">Convert Image</Link>
        </nav>
        <div className="app-header__theme">
          <ThemeToggle />
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/editor/:projectId" element={<PatternEditorPage />} />
          <Route path="/group/:groupId" element={<PatternGroupEditorPage />} />
          <Route path="/convert" element={<ImageConvertPage />} />
          <Route path="/print/:projectId" element={<PatternPrintPage />} />
          <Route path="/print-group/:groupId" element={<PatternGroupPrintPage />} />
        </Routes>
      </main>
    </div>
  );
}
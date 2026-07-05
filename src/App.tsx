import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { ResearchToolDisclaimer } from './components/ResearchToolDisclaimer';
import { BacktestConfigPage } from './pages/BacktestConfigPage';
import { BacktestResultsPage } from './pages/BacktestResultsPage';

function App() {
  return (
    <BrowserRouter>
      <ResearchToolDisclaimer />
      <nav style={{ padding: '0.75rem 1rem' }}>
        <Link to="/">New backtest</Link>
      </nav>
      <main style={{ padding: '0 1rem 2rem' }}>
        <Routes>
          <Route path="/" element={<BacktestConfigPage />} />
          <Route path="/results/:resultId" element={<BacktestResultsPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;

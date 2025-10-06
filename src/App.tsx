import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigPage } from '@/routes/ConfigPage';
import { WidgetPage } from '@/routes/WidgetPage';
import { HomePage } from '@/routes/HomePage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<ConfigPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/config" element={<ConfigPage />} />
          <Route path="/widget/:uuid" element={<WidgetPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

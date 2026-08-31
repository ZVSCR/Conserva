import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota raiz (/) - Redireciona automaticamente para /home */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Rota da sua página principal */}
        <Route path="/home" element={<Home />} />

        {/* Rota de página não encontrada (404) - opcional mas recomendado */}
        <Route path="*" element={<h1>Página não encontrada (404)</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
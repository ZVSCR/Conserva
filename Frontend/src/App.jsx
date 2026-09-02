import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/PageHome';
import Login from './pages/Login/PageLogin';
import Register from './pages/Register/PageRegister';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota raiz (/) - Redireciona automaticamente para /home */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Rota da sua página principal */}
        <Route path="/home" element={<Home />} />

        <Route path="/Login" element={<Login />} />
        <Route path="/Registrar" element={<Register />} />

        {/* Rota de página não encontrada (404) - opcional mas recomendado */}
        <Route path="*" element={<h1>Página não encontrada (404)</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
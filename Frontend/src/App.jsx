import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/PageHome';
import Login from './pages/Login/PageLogin';
import Register from './pages/Register/PageRegister';
import Estoque from './pages/Estoque/PageEstoque';
import UserData from './pages/UserData/PageUserData';
import UserPreferences from './pages/UserPreferences/PageUserPreferences';
import ExtratoCompras from './pages/ExtratoCompras/PageExtratoCompras';
import NovaCompra from './pages/NovaCompra/PageNovaCompra';

const router = createBrowserRouter(createRoutesFromElements(
    <>
        {/* Rota raiz (/) - Redireciona automaticamente para /home */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Rota da sua página principal */}
        <Route path="/home" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/registrar" element={<Register />} />
        <Route path="/alterar-dados" element={<UserData/>}/>
        <Route path="/configuracoes" element={<UserPreferences />} />
        <Route path="/extrato-compras" element={<ExtratoCompras/>}/>
        <Route path="/nova-compra" element={<NovaCompra/>}/>
        <Route path='/estoque' element={<Estoque />} />

        {/* Rota de página não encontrada (404) - opcional mas recomendado */}
        <Route path="*" element={<h1>Página não encontrada (404)</h1>} />
    </>
));

function App() {
  return <RouterProvider router={router} />;
}

export default App;

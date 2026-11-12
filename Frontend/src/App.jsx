import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/PageLogin';
import Register from './pages/Register/PageRegister';
import Estoque from './pages/Estoque/PageEstoque';
import UserData from './pages/UserData/PageUserData';
import UserPreferences from './pages/UserPreferences/PageUserPreferences';
import ExtratoCompras from './pages/ExtratoCompras/PageExtratoCompras';
import NovaCompra from './pages/NovaCompra/PageNovaCompra';
import ViewReceita from './pages/Receitas/PageViewReceita';
import RefeicoesPreparadas from './pages/RefeicoesPreparadas/PageRefeicoesPreparadas';
import RequireAuth from './components/auth/RequireAuth';
import { AuthProvider } from './contexts/AuthContext';
import PageIngredientes from './pages/Ingredientes/PageIngredientes';
import PageInserirImagem from './pages/DigitalizarCupom/PageDigitalizarCupom';

const router = createBrowserRouter(createRoutesFromElements(
    <>
        {/* Rota raiz (/) - Redireciona automaticamente para /login (no futuro será /home) */}
        <Route path="/" element={<Navigate to="/estoque" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/registrar" element={<Register />} />
        <Route element={<RequireAuth />}>
            <Route path="/home" element={<Navigate to="/estoque" replace />} />
            <Route path="/alterar-dados" element={<UserData />} />
            <Route path="/configuracoes" element={<UserPreferences />} />
            <Route path="/extrato-compras" element={<ExtratoCompras />} />
            <Route path="/nova-compra" element={<NovaCompra />} />
            <Route path='/estoque' element={<Estoque />} />
            <Route path='/receitas' element={<ViewReceita />} />
            <Route path='/historico-refeicoes' element={<RefeicoesPreparadas />} />
            <Route path='/ingredientes' element={<PageIngredientes/>} />
            <Route path='/digitalizar-cupom' element={<PageInserirImagem />} />
        </Route>

        {/* Rota de página não encontrada (404) - opcional mas recomendado */}
        <Route path="*" element={<h1>Página não encontrada (404)</h1>} />
    </>
));

function App() {
    return (
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    );
}

export default App;
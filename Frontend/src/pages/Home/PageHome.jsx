import { Link } from 'react-router-dom';
import AppHeader from '../../components/shared/AppHeader/AppHeader';

function Home() {
  return (
    <div>
      <AppHeader />
      <h1>Página Principal - ConservIA</h1>
      <p>Bem-vindo ao painel de controle.</p>
      <nav aria-label="Funcionalidades">
        <Link to="/estoque">Estoque</Link>{' · '}
        <Link to="/extrato-compras">Compras</Link>{' · '}
        <Link to="/receitas">Receitas</Link>
      </nav>
    </div>
  );
}

export default Home;

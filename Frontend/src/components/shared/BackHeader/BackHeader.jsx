import { Link } from 'react-router-dom';
import setaVoltar from '../../../assets/Ingredientes/arrow-left.svg';
import logoConserva from '../../../assets/Ingredientes/conserva-logo.svg';
import styles from './BackHeader.module.css';

function BackHeader() {
    return (
        <header className={styles.header}>
            <Link className={styles.voltar} to="/estoque" aria-label="Voltar ao estoque">
                <img src={setaVoltar} alt="" />
            </Link>
            <img className={styles.marca} src={logoConserva} alt="Conserva" />
        </header>
    );
}

export default BackHeader;

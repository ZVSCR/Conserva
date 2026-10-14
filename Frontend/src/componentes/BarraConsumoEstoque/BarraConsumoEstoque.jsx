import styles from './Estoque.module.css';

function BarraEstoque({ quantidadeAtual, quantidadeMaxima }) {
    const percentual = quantidadeMaxima > 0
        ? Math.min(100, Math.max(0, (quantidadeAtual / quantidadeMaxima) * 100))
        : 0;

    let corClasse = styles.barraVerde;
    if (percentual <= 25) {
        corClasse = styles.barraVermelha;
    } else if (percentual <= 75) {
        corClasse = styles.barraAmarela;
    }

    return (
        <div className={styles.barraBase}>
            <div
                className={`${styles.barraPreenchimento} ${corClasse}`}
                style={{ width: `${percentual}%` }}
            />
        </div>
    );
}

export default BarraEstoque;
import styles from './Estoque.module.css';

function ConfirmarExclusao({ produto, onConfirmar, onCancelar }) {

    return (
        <div className={styles.overlay}>

            <div className={styles.modal}>

                <h2>Excluir produto</h2>

                <p className={styles.labelNomeQtd}>
                    Tem certeza que deseja excluir
                    "{produto.nome}"?
                </p>

                <div className={styles.modalAcoes}>

                    <button className={styles.botaoCancelar} onClick={onCancelar}>
                        Cancelar
                    </button>

                    <button className={styles.botaoExcluir} onClick={onConfirmar}>
                        Excluir
                    </button>

                </div>

            </div>

        </div>
    );
}

export default ConfirmarExclusao;
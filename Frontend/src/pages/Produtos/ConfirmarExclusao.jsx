import styles from './Produtos.module.css';

function ConfirmarExclusao({ produto, onConfirmar, onCancelar }) {

    return (
        <div className={styles.overlay}>

            <div className={styles.modal}>

                <h2>Excluir produto</h2>

                <p>
                    Tem certeza que deseja excluir
                    "{produto.nome}"?
                </p>

                <div className={styles.modalAcoes}>

                    <button onClick={onCancelar}>
                        Cancelar
                    </button>

                    <button onClick={onConfirmar}>
                        Excluir
                    </button>

                </div>

            </div>

        </div>
    );
}

export default ConfirmarExclusao;
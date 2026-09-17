import styles from './Estoque.module.css';
import IconEditar from '../../assets/IconsEstoque/editar.png';
import IconDeletar from '../../assets/IconsEstoque/delete.png';

function Produto({ produto, onEditar, onExcluir }) {
    return (
        <div className={styles.produto}>

            <div className={styles.informacoes}>
                <span className={styles.nomeProduto}>
                    {produto.nome}
                </span>

                <span className={styles.quantidade}>
                    Quantidade: {produto.quantidade}
                </span>
            </div>

            <div className={styles.acoes}>

                <button
                    className={styles.botaoEditar}
                    onClick={() => onEditar(produto)}
                >
                    <img
                        src={IconEditar}
                        alt="Editar produto"
                    />
                </button>

                <button
                    className={styles.botaoExcluir}
                    onClick={() => onExcluir(produto)}
                >
                    <img src={IconDeletar} className={styles.iconDeletar} alt="Deletar produto"  />
                </button>

            </div>

        </div>
    );
}

export default Produto;
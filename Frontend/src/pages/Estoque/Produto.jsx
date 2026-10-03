import styles from './Estoque.module.css';
import IconEditar from '../../assets/IconsEstoque/editar.png';
import IconDeletar from '../../assets/IconsEstoque/delete.png';
import BarraEstoque from './BarraConsumo';

function Produto({ produto, onEditar, onExcluir }) {
    return (
        <div className={styles.produto}>

            <div className={styles.informacoes}>
                {/* nome do produto e barra de consumo na mesma coluna*/}
                <div className={styles.informacoesProduto}>
                    <span className={styles.nomeProduto}>
                        {produto.nome}
                    </span>
                    <BarraEstoque
                        quantidadeAtual={produto.quantidade}
                        quantidadeMaxima={produto.quantidadeOriginal}
                    />
                </div>

                <span className={styles.nomeProduto}>
                    {Number.isInteger(produto.quantidade) // Se for inteiro mostra apenas o valor
                    ? produto.quantidade
                    : produto.quantidade.toFixed(1)   //Caso seja um valor quebrado, deixa apenas 1 casa decimal
                    }  
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
import './ProdutoEstoque.css';
import IconEditar from '../../../assets/IconsEstoque/editar.png';
import IconDeletar from '../../../assets/IconsEstoque/delete.png';
import BarraConsumo from '../BarraConsumoEstoque/BarraConsumoEstoque';

function ProdutoEstoque({ produto, onEditar, onExcluir }) {
    return (
         <div className="estoque-produto">

            <div className="estoque-produto-informacoes">
                {/* nome do produto e barra de consumo na mesma coluna */}
                <div className="estoque-produto-nome-e-barra">
                    <span className="estoque-produto-nome">
                        {produto.nome}
                    </span>
                    <BarraConsumo
                        quantidadeAtual={produto.quantidade}
                        quantidadeMaxima={produto.quantidadeOriginal}
                    />
                </div>

                <span className="estoque-produto-quantidade">
                    {Number.isInteger(produto.quantidade) // Se for inteiro mostra apenas o valor
                        ? produto.quantidade
                        : produto.quantidade.toFixed(1)   // Caso seja quebrado, deixa 1 casa decimal
                    }
                </span>
            </div>

            <div className="estoque-produto-acoes">
                <button className="estoque-produto-botao-acao" onClick={() => onEditar(produto)}>
                    <img className="estoque-produto-icone-editar" src={IconEditar} alt="Editar produto" />
                </button>

                <button className="estoque-produto-botao-acao" onClick={() => onExcluir(produto)}>
                    <img className="estoque-produto-icone-excluir" src={IconDeletar} alt="Deletar produto" />
                </button>
            </div>

        </div>
    );
}

export default ProdutoEstoque;
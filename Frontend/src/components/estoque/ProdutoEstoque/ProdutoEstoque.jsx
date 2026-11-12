import './ProdutoEstoque.css';
import IconEditar from '../../../assets/IconsEstoque/editar.png';
import IconDeletar from '../../../assets/IconsEstoque/delete.png';
import BarraConsumo from '../BarraConsumoEstoque/BarraConsumoEstoque';

const formatoQuantidade = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

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
                    {formatoQuantidade.format(produto.quantidade)}
                    {produto.unidade && ` ${produto.unidade}`} 
                </span>
            </div>

            <div className="estoque-produto-acoes">
                <button
                    type="button"
                    className="estoque-produto-botao-acao"
                    aria-label={`Editar ${produto.nome}`}
                    onClick={() => onEditar(produto)}
                >
                    <img className="estoque-produto-icone-editar" src={IconEditar} alt="" />
                </button>

                <button
                    type="button"
                    className="estoque-produto-botao-acao"
                    aria-label={`Excluir ${produto.nome}`}
                    onClick={() => onExcluir(produto)}
                >
                    <img className="estoque-produto-icone-excluir" src={IconDeletar} alt="" />
                </button>
            </div>

        </div>
    );
}

export default ProdutoEstoque;
import './ProdutoEstoque.css';
import IconEditar from '../../../assets/IconsEstoque/edit_item_icon_1.svg';
import IconDeletar from '../../../assets/IconsEstoque/delete_item_icon_1.svg';
import BarraConsumo from '../BarraConsumoEstoque/BarraConsumoEstoque';

const formatoQuantidade = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const DIAS_ALERTA = 3; // mesmo padrão do backend

function rotuloVencimento(dias) {
    if (dias === null || dias === undefined || dias > DIAS_ALERTA) return null;
    if (dias <= 0) return { texto: 'Vencido', nivel: 'vencido' };
    if (dias === 1) return { texto: 'Vence amanhã', nivel: 'urgente' };
    return { texto: `Vence em ${dias} dias`, nivel: 'proximo' };
}

function ProdutoEstoque({ produto, onEditar, onExcluir }) {
    const vencimento = rotuloVencimento(produto.diasParaVencer);
    return (
        <div className="estoque-produto">
            <div className="estoque-produto-nome-e-barra">
                <span className="estoque-produto-nome">{produto.nome}</span>
                {vencimento && (
                    <span className={`estoque-produto-vencimento estoque-produto-vencimento--${vencimento.nivel}`}>
                        {vencimento.texto}
                    </span>
                )}
                <BarraConsumo
                    quantidadeAtual={produto.quantidade}
                    quantidadeMaxima={produto.quantidadeOriginal}
                />
            </div>

            <span className="estoque-produto-quantidade">
                {formatoQuantidade.format(produto.quantidade)}
                {produto.unidade && ` ${produto.unidade}`}
            </span>

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

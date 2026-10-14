import './EstoqueBarraConsumo.css';

function BarraConsumoEstoque({ quantidadeAtual, quantidadeMaxima }) {
    const percentual = quantidadeMaxima > 0
        ? Math.min(100, Math.max(0, (quantidadeAtual / quantidadeMaxima) * 100))
        : 0;

    let corClasse = 'estoque-barra-verde';
    if (percentual <= 25) {
        corClasse = 'estoque-barra-vermelha';
    } else if (percentual <= 75) {
        corClasse = 'estoque-barra-amarela';
    }

    return (
        <div className="estoque-barra-base">
            <div
                className={`estoque-barra-preenchimento ${corClasse}`}
                style={{ width: `${percentual}%` }}
            />
        </div>
    );
}

export default BarraConsumoEstoque;
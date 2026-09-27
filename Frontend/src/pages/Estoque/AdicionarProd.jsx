import { useState } from 'react';
import styles from './Estoque.module.css';

function AdicionarProduto({ onSalvar, onCancelar }) {

    const [nome, setNome] = useState('');
    const [quantidade, setQuantidade] = useState(1);
    const [unidadeDeMedida, setUnidadeDeMedida] = useState('');
    const [valorUnitario, setValorUnitario] = useState('');
    const [validadeEstimada, setValidadeEstimada] = useState('');
    const [estabelecimento, setEstabelecimento] = useState('');

    const [erros, setErros] = useState({}); // um erro por campo, ex: { nome: '...', valorUnitario: '...' }

    function validar() {
        const novosErros = {};

        if (nome.trim() === '') {
            novosErros.nome = 'Informe o nome do produto.';
        }
        if (unidadeDeMedida.trim() === '') {
            novosErros.unidadeDeMedida = 'Informe a unidade de medida (ex: kg, L, un).';
        }
        if (estabelecimento.trim() === '') {
            novosErros.estabelecimento = 'Informe onde o produto foi comprado.';
        }
        if (!(Number(quantidade) > 0)) {
            novosErros.quantidade = 'Quantidade deve ser maior que zero.';
        }
        if (valorUnitario === '' || Number(valorUnitario) < 0) {
            novosErros.valorUnitario = 'Informe um valor unitário válido (0 ou mais).';
        }
         if (validadeEstimada === '') {
            novosErros.validadeEstimada = 'Informe a validade estimada do produto.';
        }

        setErros(novosErros);
        return Object.keys(novosErros).length === 0;
    }

    function salvar() {
        if (!validar()) return;

        // Formato compatível com o payload de POST /api/compras (um item só)
        onSalvar({
            estabelecimento: estabelecimento.trim(),
            data_compra: undefined, // banco usa CURRENT_TIMESTAMP se não enviado
            itens: [{
                nome_item: nome.trim(),
                quantidade: Number(quantidade),
                unidade_de_medida: unidadeDeMedida.trim(),
                valor_unitario: Number(valorUnitario),
                validade_estimada: validadeEstimada
            }]
        });
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>

                <h2 className={styles.nomeProduto}>Adicionar produto</h2>

                <label className={styles.labelNomeQtd}>Nome</label>
                <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                />
                {erros.nome && <p className={styles.mensagemErro}>{erros.nome}</p>}

                <label className={styles.labelNomeQtd}>Quantidade</label>
                <input
                    type="number"
                    min="0"
                    step="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                />
                {erros.quantidade && <p className={styles.mensagemErro}>{erros.quantidade}</p>}

                <label className={styles.labelNomeQtd}>Unidade de medida</label>
                <input
                    type="text"
                    placeholder="kg, L, un..."
                    value={unidadeDeMedida}
                    onChange={(e) => setUnidadeDeMedida(e.target.value)}
                />
                {erros.unidadeDeMedida && <p className={styles.mensagemErro}>{erros.unidadeDeMedida}</p>}

                <label className={styles.labelNomeQtd}>Valor unitário</label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={valorUnitario}
                    onChange={(e) => setValorUnitario(e.target.value)}
                />
                {erros.valorUnitario && <p className={styles.mensagemErro}>{erros.valorUnitario}</p>}

                <label className={styles.labelNomeQtd}>Validade estimada</label>
                <input
                    type="date"
                    value={validadeEstimada}
                    onChange={(e) => setValidadeEstimada(e.target.value)}
                />
                {erros.validadeEstimada && <p className={styles.mensagemErro}>{erros.validadeEstimada}</p>}

                <label className={styles.labelNomeQtd}>Estabelecimento</label>
                <input
                    type="text"
                    value={estabelecimento}
                    onChange={(e) => setEstabelecimento(e.target.value)}
                />
                {erros.estabelecimento && <p className={styles.mensagemErro}>{erros.estabelecimento}</p>}

                <div className={styles.modalAcoes}>
                    <button className={styles.botaoCancelar} onClick={onCancelar}>
                        Cancelar
                    </button>
                    <button className={styles.botaoSalvar} onClick={salvar}>
                        Salvar
                    </button>
                </div>

            </div>
        </div>
    );
}

export default AdicionarProduto;
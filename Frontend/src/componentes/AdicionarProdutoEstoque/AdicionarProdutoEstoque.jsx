import { useState } from 'react';
import ModalEstoque from '../ModalEstoque/ModalEstoque';
import CampoEstoque from '../CampoEstoque/CampoEstoque';

function AdicionarProdutoEstoque({ onSalvar, onCancelar }) {

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
         <ModalEstoque titulo="Adicionar produto">

            <CampoEstoque rotulo="Nome" type="text" value={nome}
                onChange={(e) => setNome(e.target.value)} erro={erros.nome} />

            <CampoEstoque rotulo="Quantidade" type="number" min="0" step="1" value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)} erro={erros.quantidade} />

            <CampoEstoque rotulo="Unidade de medida" type="text" placeholder="kg, L, un..." value={unidadeDeMedida}
                onChange={(e) => setUnidadeDeMedida(e.target.value)} erro={erros.unidadeDeMedida} />

            <CampoEstoque rotulo="Valor unitário" type="number" min="0" step="0.01" value={valorUnitario}
                onChange={(e) => setValorUnitario(e.target.value)} erro={erros.valorUnitario} />

            <CampoEstoque rotulo="Validade estimada" type="date" value={validadeEstimada}
                onChange={(e) => setValidadeEstimada(e.target.value)} erro={erros.validadeEstimada} />

            <CampoEstoque rotulo="Estabelecimento" type="text" value={estabelecimento}
                onChange={(e) => setEstabelecimento(e.target.value)} erro={erros.estabelecimento} />

            <div className="estoque-modal-acoes">
                <button className="estoque-modal-botao-cancelar" onClick={onCancelar}>
                    Cancelar
                </button>
                <button className="estoque-modal-botao-salvar" onClick={salvar}>
                    Salvar
                </button>
            </div>

        </ModalEstoque>
    );
}

export default AdicionarProdutoEstoque;
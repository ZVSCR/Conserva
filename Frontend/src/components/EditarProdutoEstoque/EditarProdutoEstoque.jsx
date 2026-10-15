import { useState } from 'react';
import ModalEstoque from '../ModalEstoque/ModalEstoque';
import CampoEstoque from '../CampoEstoque/CampoEstoque';

function EditarProdutoEstoque({ produto, onSalvar, onCancelar }) {

    const [nome, setNome] = useState(produto.nome); //Mostra o nome do produto associado
    const [quantidade, setQuantidade] = useState(produto.quantidade); // Quantidade 
    const [erroNome, setErroNome] = useState(''); //Mostra um erro caso tente salvar com o campo de nome do produto vazio.

    function salvar() {
        if (nome.trim() === '') {
        setErroNome('Informe o nome do produto.');
        return; // impede o salvamento
        }
         const quantidadeNumerica = Math.max(0, Number(Number(quantidade) || 0).toFixed(1)); //Permite salvar o produto com quantidade 0, caso o campo de input esteja vazio e deixa 1 casa decimal
        onSalvar({
            ...produto, //se o prod for null, não adiciona
            nome: nome.trim(),
            quantidade: quantidadeNumerica
        });
    }

    return (
        <ModalEstoque titulo="Editar produto">

            <CampoEstoque
                rotulo="Nome"
                type="text"
                value={nome}
                erro={erroNome}
                onChange={(e) => {
                    setNome(e.target.value);
                    if (erroNome) setErroNome(''); // limpa o erro assim que a pessoa começa a corrigir
                }}
            />

            <CampoEstoque
                rotulo="Quantidade"
                type="number"
                min="0"
                step="0.1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
            />

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

export default EditarProdutoEstoque;
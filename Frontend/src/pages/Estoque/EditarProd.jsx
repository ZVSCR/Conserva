import { useState } from 'react';
import styles from './Estoque.module.css';

function EditarProduto({ produto, onSalvar, onCancelar }) {

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
        <div className={styles.overlay}>

            <div className={styles.modal}>

                {/* Apenas editar */}
                <h2 className={styles.nomeProduto}>Editar produto</h2>

                <label className={styles.labelNomeQtd}>
                    Nome
                </label>

                <input
                    type="text"
                    value={nome}
                    onChange={(e) => {
                        setNome(e.target.value);
                        if (erroNome) setErroNome(''); // limpa o erro assim que a pessoa começa a corrigir
                    }}
                />
                {erroNome && (
                    <p className={styles.mensagemErro}>{erroNome}</p>
                )}

                <label className={styles.labelNomeQtd}>
                    Quantidade
                </label>

                <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                />

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

export default EditarProduto;
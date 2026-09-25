import { useState } from 'react';
import styles from './Estoque.module.css';

function EditarProduto({ produto, onSalvar, onCancelar }) {

     const [nome, setNome] = useState(produto?.nome ?? ''); //Se o valor for null, ele vai mostrar ''. Para poder usar o mesmo modal de adicionar ou editar.
    const [quantidade, setQuantidade] = useState(produto?.quantidade ?? 1); //Inicia com 1 no input
    const [erroNome, setErroNome] = useState(''); //Mostra um erro caso tente salvar com o campo de nome do produto vazio.

    function salvar() {
        if (nome.trim() === '') {
        setErroNome('Informe o nome do produto.');
        return; // impede o salvamento
        }
         const quantidadeNumerica = Math.max(0, Math.floor(Number(quantidade) || 0)); //Permite salvar o produto com quantidade 0, caso o campo de input esteja vazio
        onSalvar({
            ...produto, //se o prod for null, não adiciona
            nome: nome.trim(),
            quantidade: quantidadeNumerica
        });
    }

    return (
        <div className={styles.overlay}>

            <div className={styles.modal}>

                {/* Título muda conforme o modo: editar ou adicionar */}
                <h2 className={styles.nomeProduto}>{produto ? 'Editar produto' : 'Adicionar produto'}</h2>

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
                    step="1"
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
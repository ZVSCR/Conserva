import { useState } from 'react';
import styles from './Produtos.module.css';

function EditarProduto({ produto, onSalvar, onCancelar }) {

    const [nome, setNome] = useState(produto.nome);
    const [quantidade, setQuantidade] = useState(produto.quantidade);

    function salvar() {
        onSalvar({
            ...produto,
            nome: nome,
            quantidade: quantidade
        });
    }

    return (
        <div className={styles.overlay}>

            <div className={styles.modal}>

                <h2>Editar produto</h2>

                <label>
                    Nome
                </label>

                <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                />

                <label>
                    Quantidade
                </label>

                <input
                    type="number"
                    value={quantidade}
                    onChange={(e) => setQuantidade(Number(e.target.value))}
                />

                <div className={styles.modalAcoes}>

                    <button onClick={onCancelar}>
                        Cancelar
                    </button>

                    <button onClick={salvar}>
                        Salvar
                    </button>

                </div>

            </div>

        </div>
    );
}

export default EditarProduto;
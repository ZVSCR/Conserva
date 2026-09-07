import { useState } from 'react';

import styles from './Produtos.module.css';
import Header from './Header';
import Produto from './Produto';
import EditarProduto from './EditarProd';
import ConfirmarExclusao from './ConfirmarExclusao';
import IconAdcionar from '../../assets/IconsProd/maisV.png';

function PageProd(){
    
    //Para integração ao BD usar essa parte com [id, nome, qtd]
    const [produtos, setProdutos] = useState([]);

    const [produtoEditando, setProdutoEditando] = useState(null);
    
    const [adicionandoProduto, setAdicionandoProduto] = useState(false);

    const [produtoExcluindo, setProdutoExcluindo] = useState(null);


    function editarProduto(produto) {
        setProdutoEditando(produto);
    }
    
    //Enviar {nome, quantidade} e usar id criado
    function adicionarProduto(novoProduto) {
    setProdutos([
        ...produtos,
        {
            id: Date.now(), //Substituir  pelo id do BD
            nome: novoProduto.nome,
            quantidade: novoProduto.quantidade
        }
    ]);

    setAdicionandoProduto(false);
    }

    //Deve atualizar as edições no BD
    function salvarEdicao(produtoAtualizado) {

        setProdutos(
            produtos.map((produto) =>
                produto.id === produtoAtualizado.id
                    ? produtoAtualizado
                    : produto
            )
        );

        setProdutoEditando(null);
    }

    //Deve excluir o produto
    function excluirProduto(produto) {
        setProdutoExcluindo(produto);
    }


    function confirmarExclusao() {

        setProdutos(
            produtos.filter(
                (produto) => produto.id !== produtoExcluindo.id
            )
        );

        setProdutoExcluindo(null);
    }

    return(
        <>
            <Header />
            <main>
                <div className={styles.cabecalhoLista}>
                <h1>Lista de Produtos</h1>
                

                    <button
                    className={styles.botaoAdicionar}
                    onClick={() => setAdicionandoProduto(true)}
                >
                    <img src={IconAdcionar} alt="Adicionar produto" />
                </button>
                </div>

        
                <div>
                    {produtos.map((produto) => (
                        <Produto
                            key={produto.id}
                            produto={produto}
                            onEditar={editarProduto}
                            onExcluir={excluirProduto}
                        />
                    ))}

                </div>
            </main>

                {/*Modal de Adicionar ou Editar*/}
             {(produtoEditando || adicionandoProduto) && (
                <EditarProduto
                    produto={produtoEditando}
                    onSalvar={adicionandoProduto ? adicionarProduto : salvarEdicao}
                    onCancelar={() => {
                        setProdutoEditando(null);
                        setAdicionandoProduto(false);
                    }}
                />
            )}

            {/*Modal de excluir*/}
            {produtoExcluindo && (
                <ConfirmarExclusao
                    produto={produtoExcluindo}
                    onConfirmar={confirmarExclusao}
                    onCancelar={() => setProdutoExcluindo(null)}
                />
            )}  




        </>
    );
}

export default PageProd;
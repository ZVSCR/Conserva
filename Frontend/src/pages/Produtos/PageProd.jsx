import { useState } from 'react';

import styles from './Produtos.module.css';
import Header from './Header';
import Produto from './Produto';
import EditarProduto from './EditarProd';
import ConfirmarExclusao from './ConfirmarExclusao';

function PageProd(){

    const [produtos, setProdutos] = useState([
        { id: 1, nome: "Arroz", quantidade: 2 },
        { id: 2, nome: "Feijão", quantidade: 5 },
        { id: 3, nome: "Macarrão", quantidade: 1 }
    ]);

    const [produtoEditando, setProdutoEditando] = useState(null);

    const [produtoExcluindo, setProdutoExcluindo] = useState(null);


    function editarProduto(produto) {
        setProdutoEditando(produto);
    }


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
                <h1>Lista de Produtos</h1>
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

            
             {produtoEditando && (
                <EditarProduto
                    produto={produtoEditando}
                    onSalvar={salvarEdicao}
                    onCancelar={() => setProdutoEditando(null)}
                />
            )}


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
import { useState } from 'react';

import styles from './Estoque.module.css';
import Header from './Header';
import Produto from './Produto';
import NavBar from './NavBar';
import EditarProduto from './EditarProd';
import AdicionarProduto from './AdicionarProd';
import ConfirmarExclusao from './ConfirmarExclusao';

// ---------- A ser modificado !!!!!---------------------------
async function criarProdutoNoBackend(dadosCompra) {
    return {
        idItem: Date.now(),
        nome_item: dadosCompra.itens[0].nome_item,
        quantidade: dadosCompra.itens[0].quantidade,
        unidade_de_medida: dadosCompra.itens[0].unidade_de_medida,
        valor_unitario: dadosCompra.itens[0].valor_unitario,
        validade_estimada: dadosCompra.itens[0].validade_estimada
    };
}
// -------------------------------------------------------
function PageEstoque(){
    
    //Para integração ao BD usar essa parte com [id, nome, qtd]
    const [produtos, setProdutos] = useState([]);

    const [produtoEditando, setProdutoEditando] = useState(null);
    
    const [adicionandoProduto, setAdicionandoProduto] = useState(false);

    const [produtoExcluindo, setProdutoExcluindo] = useState(null);


    function editarProduto(produto) {
        setProdutoEditando(produto);
    }
    
    // ------------- Parte a ser modificada, apenas para manutenção do front no momento! --------
    async function adicionarProduto(dadosCompra) {
    const criado = await criarProdutoNoBackend(dadosCompra);

    setProdutos([
        ...produtos,
        {
            id: criado.idItem,
            nome: criado.nome_item,
            quantidade: criado.quantidade,
            unidadeDeMedida: criado.unidade_de_medida,
            valorUnitario: criado.valor_unitario,
            validadeEstimada: criado.validade_estimada
        }
    ]);

    setAdicionandoProduto(false);
}
// -----------------------------------------------------------------------------------

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
        <div className={styles.paginaEstoque}>
            <Header />
            <main>
                
                <h1 className={styles.tituloLista}>Lista de produtos</h1>
        
                <div className={styles.listaProdutosContainer}>
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
            <NavBar onAdicionar={() => setAdicionandoProduto(true)} />            
                
                {/*Modal de Editar*/}
              {produtoEditando && (
                <EditarProduto
                    produto={produtoEditando}
                    onSalvar={salvarEdicao}
                    onCancelar={() => setProdutoEditando(null)}
                />
            )}
            {/*Modal de Adicionar*/}
            {adicionandoProduto && (
                <AdicionarProduto
                    onSalvar={adicionarProduto}
                    onCancelar={() => setAdicionandoProduto(false)}
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




        </div>
    );
}

export default PageEstoque;
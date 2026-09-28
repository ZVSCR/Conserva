import { useState, useEffect } from 'react';

import styles from './Estoque.module.css';
import Header from './Header';
import Produto from './Produto';
import NavBar from './NavBar';
import EditarProduto from './EditarProd';
 // import AdicionarProduto from './AdicionarProd';
import ConfirmarExclusao from './ConfirmarExclusao';

// ---------- A ser modificado !!!!!---------------------------
/*async function criarProdutoNoBackend(dadosCompra) {
    return {
        idItem: Date.now(),
        nome_item: dadosCompra.itens[0].nome_item,
        quantidade: dadosCompra.itens[0].quantidade,
        unidade_de_medida: dadosCompra.itens[0].unidade_de_medida,
        valor_unitario: dadosCompra.itens[0].valor_unitario,
        validade_estimada: dadosCompra.itens[0].validade_estimada
    };
}
    */
// -------------------------------------------------------
function PageEstoque(){
    
    useEffect(() => { //Mapeia o retorno da API para buscar os dados reais ao carregar a página
    fetch('http://localhost:3000/api/estoque')
        .then((res) => res.json())
        .then((data) => {
            setProdutos(
                data.map((item) => ({
                    id: item.item_id,
                    nome: item.nome_item,
                    quantidade: Number(item.quantidade_disponivel)
                }))
            );
        })
        .catch((erro) => console.error('Erro ao buscar estoque:', erro));
}, []); 

    //Para integração ao BD usar essa parte com [id, nome, qtd]
    const [produtos, setProdutos] = useState([]);

    const [produtoEditando, setProdutoEditando] = useState(null);
    
    const [adicionandoProduto, setAdicionandoProduto] = useState(false);

    const [produtoExcluindo, setProdutoExcluindo] = useState(null);


    function editarProduto(produto) {
        setProdutoEditando(produto);
    }
    
    // ------------- Parte a ser modificada, apenas para manutenção do front no momento! --------
    /*async function adicionarProduto(dadosCompra) {
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
}*/
// -----------------------------------------------------------------------------------

    //atualizar as edições no BD
 async function salvarEdicao(produtoAtualizado) {
    try {
        const [resNome, resQuantidade] = await Promise.all([
            fetch(`http://localhost:3000/api/items/${produtoAtualizado.id}`, { //Usa a parte de atualizar o nome do ITEM
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome_item: produtoAtualizado.nome })
            }),
            fetch(`http://localhost:3000/api/estoque/${produtoAtualizado.id}`, { //Atualiza a quantidade no ESTOQUE
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantidade: produtoAtualizado.quantidade })
            })
        ]);

        if (!resNome.ok || !resQuantidade.ok) throw new Error('Erro ao salvar edição');

        setProdutos(
            produtos.map((produto) =>
                produto.id === produtoAtualizado.id ? produtoAtualizado : produto
            )
        );
    } catch (erro) {
        console.error(erro);
    }

    setProdutoEditando(null);
}

    //Guarda qual produto foi clicado para controlar a exibição do modal
    function excluirProduto(produto) {
        setProdutoExcluindo(produto);
    }


    async function confirmarExclusao() {
    try {
        const resposta = await fetch(`http://localhost:3000/api/items/${produtoExcluindo.id}`, { //chama a rota para excluir item
            method: 'DELETE'
        });

        if (!resposta.ok) throw new Error('Erro ao excluir produto');

        setProdutos(
            produtos.filter(
                (produto) => produto.id !== produtoExcluindo.id
            )
        );
    } catch (erro) {
        console.error(erro);
    }

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
            <NavBar /*onAdicionar={() => setAdicionandoProduto(true)}*/ />          {/*Botão de adicionar omitido */}  
                
                {/*Modal de Editar*/}
              {produtoEditando && (
                <EditarProduto
                    produto={produtoEditando}
                    onSalvar={salvarEdicao}
                    onCancelar={() => setProdutoEditando(null)}
                />
            )}
            {/*Modal de Adicionar
            {adicionandoProduto && (
                <AdicionarProduto
                    onSalvar={adicionarProduto}
                    onCancelar={() => setAdicionandoProduto(false)}
                />
            )}
            */}

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
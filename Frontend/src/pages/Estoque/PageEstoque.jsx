import { useState, useEffect } from 'react';

import styles from './Estoque.module.css';
import Header from './Header';
import Produto from './Produto';
import NavBar from './NavBar';
import EditarProduto from './EditarProd';
import ConfirmarExclusao from './ConfirmarExclusao';

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




        </div>
    );
}

export default PageEstoque;
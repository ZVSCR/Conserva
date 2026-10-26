import { useState, useEffect } from 'react';

import './Estoque.css';
import AppHeader from '../../components/shared/AppHeader/AppHeader';
import BottomNav from '../../components/shared/BottomNav/BottomNav';
import EstoqueProduto from '../../components/estoque/ProdutoEstoque/ProdutoEstoque';
import EditarProdutoEstoque from '../../components/estoque/EditarProdutoEstoque/EditarProdutoEstoque';
import ExcluirProdutoEstoque from '../../components/estoque/ExcluirProdutoEstoque/ExcluirProdutoEstoque';
// import EstoqueAdicionarProduto from '../../components/estoque/AdicionarProdutoEstoque/AdicionarProdutoEstoque';

const USUARIO_MOCK_ID = 1;

function PageEstoque(){
    
    useEffect(() => { //Mapeia o retorno da API para buscar os dados reais ao carregar a página
    fetch(`http://localhost:3000/api/estoque?usuario_id=${USUARIO_MOCK_ID}`)
        .then((res) => res.json())
        .then((data) => {
            setProdutos(
                data.map((item) => ({
                    id: item.item_id,
                    nome: item.nome_item,
                    quantidade: Number(item.quantidade_disponivel),
                    quantidadeOriginal: Number(item.quantidade_original)
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
    
    //atualizar as edições no BD
 async function salvarEdicao(produtoAtualizado) {
    try {
        const [resNome, resQuantidade] = await Promise.all([
            fetch(`http://localhost:3000/api/items/${produtoAtualizado.id}`, { //Usa a parte de atualizar o nome do ITEM
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome_item: produtoAtualizado.nome })
            }),
            fetch(`http://localhost:3000/api/estoque/${produtoAtualizado.id}?usuario_id=${USUARIO_MOCK_ID}`, {
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

        return (
        <div className="estoque-pagina">
            <AppHeader />
            <main>
                <h1 className="estoque-titulo">Lista de produtos</h1>

                <div className="estoque-lista">
                    {produtos.map((produto) => (
                        <EstoqueProduto
                            key={produto.id}
                            produto={produto}
                            onEditar={editarProduto}
                            onExcluir={excluirProduto}
                        />
                    ))}
                </div>
            </main>
            <BottomNav />

            {/*Modal de editar*/}
            {produtoEditando && (
                <EditarProdutoEstoque
                    produto={produtoEditando}
                    onSalvar={salvarEdicao}
                    onCancelar={() => setProdutoEditando(null)}
                />
            )}

            {/*Modal de adicionar (em espera)
            {adicionandoProduto && (
                <EstoqueAdicionarProduto
                    onSalvar={adicionarProduto}
                    onCancelar={() => setAdicionandoProduto(false)}
                />
            )}
            */}

            {/*Modal de excluir*/}
            {produtoExcluindo && (
                <ExcluirProdutoEstoque
                    produto={produtoExcluindo}
                    onConfirmar={confirmarExclusao}
                    onCancelar={() => setProdutoExcluindo(null)}
                />
            )}
        </div>
    );
}

export default PageEstoque;

import { apiFetch } from '../../services/apiClient.js';
import { useState, useEffect } from 'react';

import './Estoque.css';
import AppHeader from '../../components/shared/AppHeader/AppHeader';
import BottomNav from '../../components/shared/BottomNav/BottomNav';
import EstoqueProduto from '../../components/estoque/ProdutoEstoque/ProdutoEstoque';
import EditarProdutoEstoque from '../../components/estoque/EditarProdutoEstoque/EditarProdutoEstoque';
import ExcluirProdutoEstoque from '../../components/estoque/ExcluirProdutoEstoque/ExcluirProdutoEstoque';
// import EstoqueAdicionarProduto from '../../components/estoque/AdicionarProdutoEstoque/AdicionarProdutoEstoque';
function PageEstoque(){
    const [produtos, setProdutos] = useState([]);

    useEffect(() => { //Mapeia o retorno da API para buscar os dados reais ao carregar a página
    const controller = new AbortController();
    apiFetch(`/api/estoque`, { signal: controller.signal })
        .then((res) => {
            if (res.status === 401) return null; // O controle de sessão encaminha para o login.
            if (!res.ok) throw new Error('Não foi possível carregar o estoque.');
            return res.json();
        })
        .then((data) => {
            if (data === null || controller.signal.aborted) return;
            if (!Array.isArray(data)) throw new Error('Resposta de estoque inválida.');
            setProdutos(
                data.map((item) => ({
                    id: item.item_id,
                    nome: item.nome_item,
                    quantidade: Number(item.quantidade_disponivel),
                    quantidadeOriginal: Number(item.quantidade_original)
                }))
            );
        })
        .catch((erro) => {
            if (erro.name !== 'AbortError') console.error('Erro ao buscar estoque:', erro);
        });
    return () => controller.abort();
}, []);

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
            apiFetch(`/api/items/${produtoAtualizado.id}`, { //Usa a parte de atualizar o nome do ITEM
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome_item: produtoAtualizado.nome })
            }),
            apiFetch(`/api/estoque/${produtoAtualizado.id}`, {
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
        const resposta = await apiFetch(`/api/items/${produtoExcluindo.id}`, { //chama a rota para excluir item
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

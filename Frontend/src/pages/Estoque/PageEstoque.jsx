import { apiFetch } from '../../services/api.js';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Estoque.css';
import AppHeader from '../../components/shared/AppHeader/AppHeader';
import BottomNav from '../../components/shared/BottomNav/BottomNav';
import EstoqueProduto from '../../components/estoque/ProdutoEstoque/ProdutoEstoque';
import EditarProdutoEstoque from '../../components/estoque/EditarProdutoEstoque/EditarProdutoEstoque';
import ExcluirProdutoEstoque from '../../components/estoque/ExcluirProdutoEstoque/ExcluirProdutoEstoque';
import IconBusca from '../../assets/IconsEstoque/lupa.png';
// import EstoqueAdicionarProduto from '../../components/estoque/AdicionarProdutoEstoque/AdicionarProdutoEstoque';

function normalizarBusca(texto) {
    return texto.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{M}/gu, '');
}

function PageEstoque(){
    const [produtos, setProdutos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erroEstoque, setErroEstoque] = useState('');
    const [busca, setBusca] = useState('');
    const [filtroAberto, setFiltroAberto] = useState(false);
    const [filtroEstoque, setFiltroEstoque] = useState('disponiveis');

    useEffect(() => { //Mapeia o retorno da API para buscar os dados reais ao carregar a página
    const controller = new AbortController();
    setCarregando(true);
    setErroEstoque('');
    const endpoint = filtroEstoque === 'proximos' ? '/api/estoque/vida-util-critica' : '/api/estoque';
    apiFetch(endpoint, { signal: controller.signal })
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
                    quantidadeOriginal: Number(item.quantidade_original),
                    unidade: item.unidade_de_medida,
                    diasParaVencer: item.dias_para_vencer == null ? null : Number(item.dias_para_vencer)
                }))
            );
            setCarregando(false);
        })
        .catch((erro) => {
            if (erro.name === 'AbortError') return;
            console.error('Erro ao buscar estoque:', erro);
            setErroEstoque('Não foi possível carregar o estoque.');
            setCarregando(false);
        });
    return () => controller.abort();
}, [filtroEstoque]);
    const produtosDisponiveis = filtroEstoque === 'proximos'
        ? produtos
        : produtos.filter((produto) => produto.quantidade > 0);
    const termo = normalizarBusca(busca);
    const produtosFiltrados = produtosDisponiveis.filter((produto) => {
        const vencido = produto.diasParaVencer !== null && produto.diasParaVencer <= 0;
        const correspondeFiltro = filtroEstoque === 'vencidos' ? vencido
            : filtroEstoque === 'nao-vencidos' ? !vencido
                : true;
        return correspondeFiltro && normalizarBusca(produto.nome).includes(termo);
    });

    const estoqueCarregado = !carregando && !erroEstoque;
    const estoqueVazio = estoqueCarregado && filtroEstoque !== 'proximos' && produtosDisponiveis.length === 0;
    const buscaSemResultados = estoqueCarregado && !estoqueVazio && produtosFiltrados.length === 0;
    const titulosEstoque = {
        proximos: 'Lista de produtos próximos da validade',
        disponiveis: 'Lista de produtos disponíveis',
        vencidos: 'Lista de produtos vencidos',
        'nao-vencidos': 'Lista de produtos não vencidos'
    };

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
            <AppHeader variante="estoque" />
            <main className="estoque-conteudo">
                <h1 className="estoque-titulo">
                    {titulosEstoque[filtroEstoque]}
                </h1>

                {estoqueCarregado && (!estoqueVazio || filtroEstoque === 'proximos') && (
                    <div className="estoque-controles">
                        <div className="estoque-busca">
                            <img src={IconBusca} alt="" />
                            <input
                                type="search"
                                aria-label="Pesquisar produtos por nome"
                                placeholder="Pesquisar..."
                                value={busca}
                                onChange={(event) => setBusca(event.target.value)}
                            />
                        </div>
                        <div className="estoque-filtro-container">
                            <button
                                type="button"
                                className="estoque-filtro-botao"
                                aria-label="Abrir filtros"
                                aria-expanded={filtroAberto}
                                aria-haspopup="dialog"
                                onClick={() => setFiltroAberto((aberto) => !aberto)}
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M4 6h16M7 12h10m-7 6h4" />
                                </svg>
                            </button>
                            {filtroAberto && (
                                <div className="estoque-filtro-modal" role="dialog" aria-label="Filtros do estoque">
                                    <button
                                        type="button"
                                        className="estoque-filtro-opcao"
                                        aria-pressed={filtroEstoque === 'proximos'}
                                        onClick={() => {
                                            setFiltroEstoque('proximos');
                                            setFiltroAberto(false);
                                            setBusca('');
                                        }}
                                    >
                                        Próximos da validade
                                    </button>
                                    <button
                                        type="button"
                                        className="estoque-filtro-opcao"
                                        aria-pressed={filtroEstoque === 'disponiveis'}
                                        onClick={() => {
                                            setFiltroEstoque('disponiveis');
                                            setFiltroAberto(false);
                                            setBusca('');
                                        }}
                                    >
                                        Disponíveis
                                    </button>
                                    <button type="button" className="estoque-filtro-opcao" aria-pressed={filtroEstoque === 'vencidos'} onClick={() => { setFiltroEstoque('vencidos'); setFiltroAberto(false); setBusca(''); }}>Vencidos</button>
                                    <button type="button" className="estoque-filtro-opcao" aria-pressed={filtroEstoque === 'nao-vencidos'} onClick={() => { setFiltroEstoque('nao-vencidos'); setFiltroAberto(false); setBusca(''); }}>Não vencidos</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="estoque-lista">
                    {carregando && <p className="estoque-status">Carregando estoque...</p>}
                    {erroEstoque && <p className="estoque-status estoque-status-erro" role="alert">{erroEstoque}</p>}

                    {estoqueVazio && (
                        <div className="estoque-vazio">
                            <p className="estoque-vazio-titulo">Seu estoque está vazio</p>
                            <p className="estoque-vazio-texto">
                                Registre uma compra para começar a acompanhar seus produtos.
                            </p>
                            <Link to="/nova-compra" className="estoque-vazio-botao">
                                + Registrar nova compra
                            </Link>
                        </div>
                    )}

                    {estoqueCarregado && filtroEstoque === 'proximos' && produtosDisponiveis.length === 0 && (
                        <p className="estoque-status" role="status">Nenhum produto próximo da validade.</p>
                    )}

                    {buscaSemResultados && (
                        <p className="estoque-status" role="status">Nenhum produto encontrado.</p>
                    )}

                    {produtosFiltrados.map((produto) => (
                        <EstoqueProduto
                            key={produto.id}
                            produto={produto}
                            onEditar={editarProduto}
                            onExcluir={excluirProduto}
                        />
                    ))}
                </div>
            </main>
            <BottomNav padronizada />

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

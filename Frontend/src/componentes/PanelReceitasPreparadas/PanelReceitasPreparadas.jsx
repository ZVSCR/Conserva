import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import IconReceitas from '../../assets/IconsEstoque/livro-de-receitas.png';
import './PanelReceitasPreparadas.css';

const API_URL = 'http://localhost:3000/api/receitas/preparadas';

function formatarData(valor) {
    if (!valor) return 'Data não informada';
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return 'Data não informada';
    return new Intl.DateTimeFormat('pt-BR').format(data);
}

function formatarCusto(valor) {
    if (valor === null || valor === undefined || valor === '') return 'Custo indisponível';
    const custo = Number(valor);
    if (!Number.isFinite(custo)) return 'Custo indisponível';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custo);
}

function PanelRefeicoesPreparadas() {
    const navigate = useNavigate();
    const [refeicoes, setRefeicoes] = useState([]);
    const [busca, setBusca] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        async function carregarHistorico() {
            try {
                const response = await fetch(API_URL, { signal: controller.signal });
                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.error || data.erro || 'Não foi possível carregar o histórico de refeições.');
                }

                // Contrato provisório: array direto ou { refeicoesPreparadas: [...] }.
                const lista = Array.isArray(data) ? data : data.refeicoesPreparadas;
                if (!Array.isArray(lista)) {
                    throw new Error('Formato inesperado do histórico de refeições.');
                }

                setRefeicoes(lista);
            } catch (error) {
                if (error.name !== 'AbortError') setErro(error.message);
            } finally {
                if (!controller.signal.aborted) setCarregando(false);
            }
        }

        carregarHistorico();
        return () => controller.abort();
    }, []);

    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    const refeicoesFiltradas = refeicoes.filter((refeicao) =>
        String(refeicao.nome ?? refeicao.receita?.nome ?? '').toLocaleLowerCase('pt-BR').includes(termo)
    );

    // Nota: Possivelmente o container de criar nova receita será removido,
    //       pois o fluxo atual talvez não seja muito ideal.
    return (
        <div>
            <main className="refeicoes-container">
                <h1>Histórico de refeições</h1>
                <div className="container-nova-receita">
                    <button
                        type="button"
                        className="btn-preparar-receita"
                        onClick={() => navigate('/receitas')}>
                        Preparar nova receita
                    </button>
                </div>

                <div className="search-box">
                    <input
                        id="buscar-refeicao"
                        type="search"
                        placeholder="Pesquisar..."
                        value={busca}
                        onChange={(event) => setBusca(event.target.value)}
                    />
                </div>

                {carregando && <p role="status">Carregando refeições...</p>}
                {!carregando && erro && <p role="alert">{erro}</p>}

                {!carregando && !erro && (
                    refeicoesFiltradas.length === 0 ? (
                        <p>
                            {refeicoes.length === 0
                                ? 'Nenhuma refeição preparada ainda.'
                                : 'Nenhuma refeição corresponde à pesquisa.'}
                        </p>
                    ) : (
                        <ul>
                            {refeicoesFiltradas.map((refeicao) => (
                                <li key={refeicao.id ?? refeicao.receita_preparada_id}>
                                    <img src={IconReceitas} alt="" width="48" height="48" />
                                    <h2>{refeicao.nome ?? refeicao.receita?.nome ?? 'Receita sem nome'}</h2>
                                    <p>Data: {formatarData(refeicao.data_preparo)}</p>
                                    <p>{formatarCusto(refeicao.custo)}</p>
                                    {(refeicao.descricao || refeicao.modo_preparo) && (
                                        <details>
                                            <summary>Detalhes da refeição</summary>
                                            {refeicao.descricao && <p>{refeicao.descricao}</p>}
                                            {refeicao.modo_preparo && <p>Preparo: {refeicao.modo_preparo}</p>}
                                        </details>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )
                )}
            </main>
        </div>
    );
}

export default PanelRefeicoesPreparadas;

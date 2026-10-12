import { useState, useEffect, use } from "react";
import "./PanelViewReceita.css";

function PanelViewReceita() {
    const [receitas, setReceitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [busca, setBusca] = useState("");
    const [receitaExpandidaId, setReceitaExpandidaId] = useState(null);

    const navigate = useNavigate();

    // Busca as receitas registradas para exibição
    const fetchReceitas = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/receitas`, {
                method: "GET",
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMsg(data.message || "Erro ao carregar o catálogo de receitas.");
                return;
            }

            const listaReceitas = data.data || data;

            setReceitas(listaReceitas);
        } catch (error) {
            console.error("Erro na requisição:", error);
            setErrorMsg("Não foi possível conectar ao servidor para carregar o catálogo de receitas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceitas();
    }, []);

    // Barra de busca do catálogo de receitas
    const receitasFiltradas = receitas.filter(
        (receita) =>
            (receita.nome && receita.nome.toLowerCase().includes(busca.toLowerCase())) ||
            (receita.descricao && receita.descricao.toLowerCase().includes(busca.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="receita-container">
                <p style={{ color: "#fff", textAlign: "center" }}>Carregando receitas...</p>
            </div>
        )
    }

    return (
        <div className="receita-container">
            <h2 className="receita-title">Catálogo de Receitas</h2>

            {errorMsg && <p className="error-message" style={{ color: "red" }}>{errorMsg}</p>}

            <div className="search-box">
                <input
                    type="text"
                    placeholder="Pesquisar por nome ou descrição..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />
            </div>

            <div className="receitas-list">
                {receitasFiltradas.length > 0 ? (
                    receitasFiltradas.map((receita) => (
                        <div key={receita.id} className="receita-card">
                            <div className="receita-info">
                                <h3>
                                    {receita.nome}
                                </h3>
                                <p className="receita-descricao">
                                    {receita.descricao}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-results">Nenhuma receita encontrada.</p>
                )}
            </div>
        </div>
    );
}

export default PanelViewReceita;
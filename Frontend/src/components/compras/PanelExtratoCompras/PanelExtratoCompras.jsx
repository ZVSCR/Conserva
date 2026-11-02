import { useState, useEffect } from "react";
import "./PanelExtratoCompras.css";
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../services/api';
import EditarCompra from "../EditarCompra/EditarCompra";


function ExtratoCompras() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [busca, setBusca] = useState("");
  const [compraExpandidaId, setCompraExpandidaId] = useState(null);

  const navigate = useNavigate();
  
  // Busca as compras do usuário para exibir em scroll
  const fetchComprasComItens = async () => {
    try {
      const response = await apiFetch('/api/compras', {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || "Erro ao carregar o extrato de compras.");
        return;
      }

      const listaCompras = data.data || data;

      const comprasComQuantidade = await Promise.all(
        listaCompras.map(async (compra) => {
          try {
            const resItens = await apiFetch(`/api/compras/${compra.id}`);
            const dataItens = await resItens.json();
            const itens = dataItens.data || dataItens;

            return {
              ...compra,
              quantidadeItens: Array.isArray(itens) ? itens.length : 0,
            };
          } catch (err) {
            console.error(`Erro ao buscar itens da compra ${compra.id}:`, err);
            return { ...compra, quantidadeItens: 0 };
          }
        })
      );

      setCompras(comprasComQuantidade);
    } catch (err) {
      console.error("Erro na requisição:", err);
      setErrorMsg("Não foi possível conectar ao servidor para carregar as compras.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComprasComItens();
  }, []);

  // Some com o fuso da data fornecida pelo banco
  const formatarData = (dataString) => {
    if (!dataString) return "";
    const data = new Date(dataString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }).format(data);
  };

  // Barra de busca das compras via texto
  const comprasFiltradas = compras.filter(
    (compra) =>
      (compra.estabelecimento && compra.estabelecimento.toLowerCase().includes(busca.toLowerCase())) ||
      (compra.data_compra && formatarData(compra.data_compra).includes(busca))
  );

  const gastoTotal = comprasFiltradas.reduce((acc, item) => acc + Number(item.valor_total || 0), 0);

  // Abre o card e carrega os dados detalhados pra edição
  const handleEditar = (id) => {
    setCompraExpandidaId((atual) => (atual === id ? null : id));
};

  // Apaga a compra e os itens dela em cascata
  const handleExcluir = async (id) => {
    try {
      const response = await apiFetch(`/api/compras/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        console.error("Erro ao excluir compra no backend");
        return;
      }

      setCompras(compras.filter((compra) => compra.id !== id));
    } catch (err) {
      console.error("Erro ao conectar com o servidor para exclusão:", err);
    }
  };

  if (loading) {
    return (
      <div className="extrato-container">
        <p style={{ color: "#fff", textAlign: "center" }}>Carregando extrato...</p>
      </div>
    );
  }

  return (
    <div className="extrato-container">
      <h2 className="extrato-title">Extrato de compras</h2>

      {errorMsg && <p className="error-message" style={{ color: "red" }}>{errorMsg}</p>}

      <p className="extrato-total">
        Gasto total: R${" "}
        {gastoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>

      <div className="search-box">
        <input
          type="text"
          placeholder="Pesquisar por estabelecimento ou data..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="compras-list">
        {comprasFiltradas.length > 0 ? (
          comprasFiltradas.map((compra) => (
            <div key={compra.id} className="compra-card">
              {/* Conteúdo principal do card que fica sempre visível */}
              <div className="compra-header-content">
                <div className="compra-info">
                  <h3>
                    {compra.estabelecimento} - {formatarData(compra.data_compra)}
                  </h3>
                  <p className="compra-custo">
                    Custo: R$ {Number(compra.valor_total).toFixed(2).replace(".", ",")}
                  </p>
                  <p className="compra-itens">Quantidade de itens: {compra.quantidadeItens ?? 0}</p>
                </div>
    
                <div className="compra-actions">
                  <button className="btn-icon btn-edit" onClick={() => handleEditar(compra.id)} title="Editar">
                    {compraExpandidaId === compra.id ? "Fechar" : "Editar"}
                  </button>
                  <button className="btn-icon btn-delete" onClick={() => handleExcluir(compra.id)} title="Excluir">
                    Excluir
                  </button>
                </div>
              </div>

              {compraExpandidaId === compra.id && (
                <EditarCompra
                  compraId={compra.id}
                  onFechar={() => setCompraExpandidaId(null)}
                  onSalvo={async () => {
                    await fetchComprasComItens();
                    setCompraExpandidaId(null);
                  }}
                />
              )}
            </div>
          ))
        ) : (
          <p className="no-results">Nenhuma compra encontrada.</p>
        )}
      </div>

      <div className="extrato-footer"> 
        <button type="button" className="btn btn-cancel" onClick={() => navigate('/estoque')}> 
          CANCELAR
        </button>
        <button type="button" className="btn btn-concluir" onClick={() => navigate('/estoque')}>
          CONCLUIR
        </button>
      </div>
    </div>
  );
}

export default ExtratoCompras;
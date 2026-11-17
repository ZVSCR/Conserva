import { useState, useEffect, useMemo, useRef } from "react";
import "./PanelExtratoCompras.css";
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../services/api';
import EditarCompra from "../EditarCompra/EditarCompra";
import iconeBusca from "../../../assets/IconsEstoque/lupa.png";
import iconeEditar from "../../../assets/IconsEstoque/editar.png";
import iconeExcluir from "../../../assets/Ingredientes/delete-item-icon.svg";


function ExtratoCompras() {
  const [compras, setCompras] = useState([]);
  const [totalArmazenado, setTotalArmazenado] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [busca, setBusca] = useState("");
  const [compraEditandoId, setCompraEditandoId] = useState(null);
  const botaoEditarRef = useRef(null);

  const navigate = useNavigate();
  
  // Busca as compras do usuário para exibir em scroll
  const fetchComprasComItens = async () => {
    try {
      const response = await apiFetch('/api/compras?resumo=true', {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.erro || data.message || "Erro ao carregar o extrato de compras.");
        return;
      }

      setCompras(data.data.map((compra) => ({
        ...compra,
        quantidadeItens: Number(compra.quantidade_itens),
      })));
      setTotalArmazenado(Number(data.gasto_total));
      setErrorMsg("");
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
  const formatarData = (dataString, comAno = true) => {
    if (!dataString) return "";
    const data = new Date(dataString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: comAno ? "numeric" : undefined,
      timeZone: "UTC",
    }).format(data);
  };

  // Barra de busca das compras via texto
  const comprasFiltradas = useMemo(() => compras.filter(
    (compra) =>
      busca === "" || (compra.estabelecimento && compra.estabelecimento.toLowerCase().includes(busca.toLowerCase())) ||
      (compra.data_compra && formatarData(compra.data_compra).includes(busca))
  ), [compras, busca]);

  const gastoTotal = useMemo(() => busca === ""
    ? totalArmazenado
    : comprasFiltradas.reduce((acc, item) => acc + Math.round(Number(item.valor_total || 0) * 100), 0) / 100,
  [busca, totalArmazenado, comprasFiltradas]);

  const fecharEdicao = () => {
    setCompraEditandoId(null);
    botaoEditarRef.current?.focus();
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

      await fetchComprasComItens();
    } catch (err) {
      console.error("Erro ao conectar com o servidor para exclusão:", err);
    }
  };

  return (
    <main className="extrato-container">
      <h2 className="extrato-title">Extrato de compras</h2>

      {errorMsg && <p className="extrato-error" role="alert">{errorMsg}</p>}

      <div className="extrato-total">
        <span>Gasto total:</span>
        <strong>R$ {gastoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
      </div>

      <div className="extrato-busca">
        <img src={iconeBusca} alt="" />
        <input
          type="search"
          aria-label="Pesquisar compras por estabelecimento ou data"
          placeholder="Pesquisar..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="compras-list">
        {loading ? (
          <p className="extrato-status">Carregando extrato...</p>
        ) : comprasFiltradas.length > 0 ? (
          comprasFiltradas.map((compra) => (
            <div key={compra.id} className="compra-card">
              <div className="compra-header-content">
                <div className="compra-info">
                  <h3>
                    {compra.estabelecimento} - {formatarData(compra.data_compra, false)}
                  </h3>
                  <p className="compra-custo">
                    Custo: <strong>R$ {Number(compra.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </p>
                  <p className="compra-itens">Quantidade de itens: {compra.quantidadeItens ?? 0}</p>
                </div>
    
                <div className="compra-actions">
                  <button type="button" className="compra-action" onClick={(event) => {
                    botaoEditarRef.current = event.currentTarget;
                    setCompraEditandoId(compra.id);
                  }} aria-label={`Editar compra de ${compra.estabelecimento}`}>
                    <img src={iconeEditar} alt="" />
                  </button>
                  <button type="button" className="compra-action" onClick={() => handleExcluir(compra.id)} aria-label={`Excluir compra de ${compra.estabelecimento}`}>
                    <img src={iconeExcluir} alt="" />
                  </button>
                </div>
              </div>

            </div>
          ))
        ) : (
          <p className="extrato-status">Nenhuma compra encontrada.</p>
        )}
      </div>

      {compraEditandoId !== null && (
        <EditarCompra
          compraId={compraEditandoId}
          onFechar={fecharEdicao}
          onSalvo={async () => {
            await fetchComprasComItens();
            fecharEdicao();
          }}
        />
      )}

      <div className="extrato-footer"> 
        <button type="button" className="extrato-btn extrato-btn-cancelar" onClick={() => navigate('/estoque')}>
          CANCELAR
        </button>
        <button type="button" className="extrato-btn extrato-btn-concluir" onClick={() => navigate('/estoque')}>
          CONCLUIR
        </button>
      </div>
    </main>
  );
}

export default ExtratoCompras;

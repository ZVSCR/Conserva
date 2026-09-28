import { useState, useEffect } from "react";
import "./PanelExtratoCompras.css";

function ExtratoCompras() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [busca, setBusca] = useState("");
  const [compraExpandidaId, setCompraExpandidaId] = useState(null);
  const [compraEditando, setCompraEditando] = useState({ data_compra: "", estabelecimento: "" });
  const [itensEditando, setItensEditando] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState("");

  const USUARIO_MOCK_ID = 1;

  // Busca as compras do usuário para exibir em scroll
  const fetchComprasComItens = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/compras?usuario_id=${USUARIO_MOCK_ID}`, {
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
            const resItens = await fetch(`http://localhost:3000/api/compras/${compra.id}`);
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
  const handleEditar = async (id) => {
    // Clicar de novo no mesmo "Editar" fecha o card
    if (compraExpandidaId === id) {
      setCompraExpandidaId(null);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/compras/${id}`);
      const data = await response.json();

      if (!response.ok) {
        console.error("Erro ao buscar detalhes da compra");
        return;
      }

      const linhas = data.data || data; // um array, uma linha por item
      const primeiraLinha = linhas[0];

      setCompraEditando({
        data_compra: primeiraLinha.data_compra?.slice(0, 10) || "",
        estabelecimento: primeiraLinha.estabelecimento || "",
      });

      setItensEditando(
        linhas.map((linha) => ({
        id: linha.item_id,
        nome_item: linha.nome_item,
        quantidade: Number(linha.quantidade),
        unidade_de_medida: linha.unidade_de_medida,
        valor_unitario: Number(linha.valor_unitario),
        validade_estimada: linha.validade_estimada?.slice(0, 10) || "",
  }))
);

      setCompraExpandidaId(id);
      setErroSalvar("");
    } catch (err) {
      console.error("Erro ao buscar detalhes para edição:", err);
    }
  };

  // Atualiza os campos da compra (data/estabelecimento)
  const handleChangeCompra = (e) => {
    const { name, value } = e.target;
    setCompraEditando((prev) => ({ ...prev, [name]: value }));
  };

  // Atualiza um item específico dentro do array
  const handleChangeItem = (itemId, campo, valor) => {
    setItensEditando((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, [campo]: valor } : item))
    );
  };

  // Dispara todas as requisições ao clicar em "Salvar"
  const handleSalvarEdicao = async (compraId) => {
    setSalvando(true);
    setErroSalvar("");

    const promises = [];

    promises.push(
      fetch(`http://localhost:3000/api/compras/${compraId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(compraEditando),
      })
    );

    itensEditando.forEach((item) => {
      const { id, ...camposItem } = item;
      promises.push(
        fetch(`http://localhost:3000/api/compras/${compraId}/items/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(camposItem),
        })
      );
    });

    const resultados = await Promise.allSettled(promises);

    for (const resultado of resultados) {
      if (resultado.status === "rejected") {
        console.error("Requisição rejeitada:", resultado.reason);
      } else if (!resultado.value.ok) {
        const corpoErro = await resultado.value.json();
        console.error("Falha na requisição:", resultado.value.status, corpoErro);
  }
}
    const falhas = resultados.filter((r) => r.status === "rejected" || !r.value.ok);

    if (falhas.length > 0) {
      setErroSalvar(`${falhas.length} de ${resultados.length} atualizações falharam.`);
    } else {
      await fetchComprasComItens();
      setCompraExpandidaId(null);
    }

    setSalvando(false);
  };

  // Apaga a compra e os itens dela em cascata
  const handleExcluir = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/compras/${id}`, {
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

              {/* Bloco de edição, só aparece pra compra expandida */}
              {compraExpandidaId === compra.id && (
                <div className="compra-edicao">
                  <label>
                    Estabelecimento:
                    <input
                      type="text"
                      name="estabelecimento"
                      value={compraEditando.estabelecimento}
                      onChange={handleChangeCompra}
                    />
                  </label>
                  <label>
                    Data:
                    <input
                      type="date"
                      name="data_compra"
                      value={compraEditando.data_compra}
                      onChange={handleChangeCompra}
                    />
                  </label>

                  {itensEditando.map((item) => (
                    <div key={item.id} className="edicao-item-linha">
                      <input
                        type="text"
                        value={item.nome_item}
                        onChange={(e) => handleChangeItem(item.id, "nome_item", e.target.value)}
                      />
                      <input
                        type="number"
                        value={item.quantidade}
                        onChange={(e) => handleChangeItem(item.id, "quantidade", Number(e.target.value))}
                      />
                      <input
                        type="text"
                        value={item.unidade_de_medida}
                        onChange={(e) => handleChangeItem(item.id, "unidade_de_medida", e.target.value)}
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={item.valor_unitario}
                        onChange={(e) => handleChangeItem(item.id, "valor_unitario", Number(e.target.value))}
                      />
                      <input
                        type="date"
                        value={item.validade_estimada}
                        onChange={(e) => handleChangeItem(item.id, "validade_estimada", e.target.value)}
                      />
                    </div>
                  ))}

                  {erroSalvar && <p className="error-message" style={{ color: "red" }}>{erroSalvar}</p>}

                  <button
                    type="button"
                    className="btn btn-concluir"
                    onClick={() => handleSalvarEdicao(compra.id)}
                    disabled={salvando}
                  >
                    {salvando ? "Salvando..." : "Salvar edição"}
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="no-results">Nenhuma compra encontrada.</p>
        )}
      </div>

      <div className="extrato-footer"> 
        <button type="button" className="btn btn-cancel"> 
          CANCELAR
        </button>
        <button type="button" className="btn btn-concluir">
          CONCLUIR
        </button>
      </div>
    </div>
  );
}

export default ExtratoCompras;
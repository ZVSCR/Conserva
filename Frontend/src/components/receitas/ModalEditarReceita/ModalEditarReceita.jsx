import { useState } from "react";
import { apiFetch } from '../../../services/api';
import "../ModalAdicionarReceita/ModalAdicionarReceita.css";

function ModalEditarReceita({ receita, onClose, onUpdated }) {
    const [dadosReceita, setDadosReceita] = useState({
        nome: receita.nome ?? "",
        descricao: receita.descricao ?? "",
        modo_preparo: receita.modo_preparo ?? "",
    });
    const [errorMsg, setErrorMsg] = useState("");
    const [enviando, setEnviando] = useState(false);

    function atualizarCampo(event) {
        const { name, value } = event.target;
        setDadosReceita((atual) => ({ ...atual, [name]: value }));
        setErrorMsg("");
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (enviando) return;

        setErrorMsg("");
        setEnviando(true);
        try {
            const response = await apiFetch(`/api/receitas/${receita.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dadosReceita),
            });
            const data = await response.json();

            if (!response.ok) {
                const mensagem = Array.isArray(data.errors)
                    ? data.errors.map((erro) => erro.message).join(" ")
                    : data.error || data.erro || data.message;
                setErrorMsg(mensagem || "Não foi possível atualizar a receita.");
                return;
            }

            onUpdated(data.receitaAtualizada);
            onClose();
        } catch (error) {
            console.error("Erro ao atualizar receita:", error);
            setErrorMsg("Não foi possível conectar ao servidor para atualizar a receita.");
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div
            className="container-modal-adicionar-receita"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-editar-receita"
        >
            <h2 id="titulo-editar-receita">Editar receita</h2>
            <button
                type="button"
                aria-label="Fechar"
                disabled={enviando}
                onClick={onClose}
            >
                ×
            </button>

            {errorMsg && <p className="receita-feedback receita-erro" role="alert">{errorMsg}</p>}

            <form className="form-modal-nova-receita" onSubmit={handleSubmit}>
                <label htmlFor="nome-receita-editar">Nome</label>
                <input
                    id="nome-receita-editar"
                    name="nome"
                    type="text"
                    value={dadosReceita.nome}
                    onChange={atualizarCampo}
                    maxLength={100}
                    autoFocus
                    required
                />

                <label htmlFor="descricao-receita-editar">Descrição</label>
                <textarea
                    id="descricao-receita-editar"
                    name="descricao"
                    value={dadosReceita.descricao}
                    onChange={atualizarCampo}
                    maxLength={1000}
                    required
                />

                <label htmlFor="modo-preparo-receita-editar">Modo de preparo</label>
                <textarea
                    id="modo-preparo-receita-editar"
                    name="modo_preparo"
                    value={dadosReceita.modo_preparo}
                    onChange={atualizarCampo}
                    maxLength={10000}
                    required
                />

                <button type="button" disabled={enviando} onClick={onClose}>
                    Cancelar
                </button>
                <button type="submit" disabled={enviando} className="btn-adicionar-receita">
                    {enviando ? "Salvando..." : "Salvar alterações"}
                </button>
            </form>
        </div>
    );
}

export default ModalEditarReceita;

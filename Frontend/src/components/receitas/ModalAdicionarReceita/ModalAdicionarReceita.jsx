import { useState } from "react";
import "./ModalAdicionarReceita.css";

function ModalAdicionarReceita({ onClose, onCreated }) {
    const [receita, setReceita] = useState({
        nome: "",
        descricao: "",
        modo_preparo: "",
    });
    const [errorMsg, setErrorMsg] = useState("");
    const [enviando, setEnviando] = useState(false);

    function atualizarCampo(event) {
        const { name, value } = event.target;
        setReceita((atual) => ({...atual, [name]: value}));
        setErrorMsg("");
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (enviando) return;

        if (!receita.nome.trim()) {
            setErrorMsg("Informe um nome para a receita.");
            return;
        }

        if (!receita.modo_preparo.trim()) {
            setErrorMsg("Informe o modo de preparo da receita.");
            return;
        }

        // Inserir verificação de ingredientes usados para montar a receita

        setErrorMsg("");
        setEnviando(true);
        try {
            const response = await fetch("http://localhost:3000/api/receitas/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: receita.nome,
                    descricao: receita.descricao,
                    modo_preparo: receita.modo_preparo,
                    // ingredientes
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                const mensagem = Array.isArray(data.errors)
                    ? data.errors.map((erro) => erro.message).join(" ")
                    : data.error || data.message;
                setErrorMsg(mensagem || "Não foi possível registrar a receita.");
                return;
            }

            await onCreated();
            onClose();
        } catch (erro) {
            console.error("Erro na requisição: ", erro);
            setErrorMsg("Não foi possível conectar ao servidor.")
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div
            className="container-modal-adicionar-receita"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-adicionar-receita"
        >
            <h2 id="titulo-adicionar-receita">Adicionar receita</h2>
            <button
                type="button"
                aria-label="Fechar"
                disabled={enviando}
                onClick={onClose}>
                    ×
            </button>

            {errorMsg && <p className="receita-feedback receita-erro" role="alert">{errorMsg}</p>}

            <form className="form-modal-nova-reeita" onSubmit={handleSubmit}>
                <label htmlFor="nome-receita">Nome</label>
                <input
                    id="nome-receita"
                    name="nome"
                    type="text"
                    onChange={atualizarCampo}
                    maxLength={100}
                    required
                />

                <label htmlFor="descricao-receita">Descrição</label>
                <textarea
                    id="descricao-receita"
                    name="descricao"
                    onChange={atualizarCampo}
                    maxLength={1000}
                    required
                />

                <label htmlFor="modo-preparo-receita">Modo de preparo</label>
                <textarea
                    id="modo-preparo-receita"
                    name="modo_preparo"
                    onChange={atualizarCampo}
                    maxLength={10000}
                    required
                />

                <button
                    type="button"
                    disabled={enviando}
                    onClick={onClose}>
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={enviando}
                    className="btn-adicionar-receita">
                    {enviando ? "Adicionando..." : "Adicionar receita"}
                </button>
            </form>
        </div>
    )
}

export default ModalAdicionarReceita;

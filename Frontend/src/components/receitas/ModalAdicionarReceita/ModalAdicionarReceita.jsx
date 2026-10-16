import { useState, useEffect } from "react";
import "./ModalAdicionarReceita.css";

function ModalAdicionarReceita({ onClose }) {
    const [receita, setReceita] = useState({
        nome: "",
        descricao: "",
        modo_preparo: "",
    });

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
                onClick={onClose}>
                    ×
            </button>

            <form className="form-modal-nova-reeita">
                <label htmlFor="nome-receita">Nome</label>
                <input id="nome-receita" name="nome" type="text" maxLength={100} required />

                <label htmlFor="descricao-receita">Descrição</label>
                <textarea id="descricao-receita" name="descricao" maxLength={1000} required />

                <label htmlFor="modo-preparo-receita">Modo de preparo</label>
                <textarea id="modo-preparo-receita" name="modo_preparo" maxLength={10000} required />

                <button 
                    type="button"
                    onClick={onClose}>
                    Cancelar
                </button>
                <button 
                    type="submit"
                    className="btn-adicionar-receita">
                    Adicionar receita
                </button>
            </form>
        </div>
    )
}

export default ModalAdicionarReceita;

import './EstoqueCampo.css';

// Campo de formulário do estoque: rótulo + input + mensagem de erro.
// Qualquer prop extra (type, value, onChange, min, step...) vai direto para o input.
function EstoqueCampo({ rotulo, erro, ...propsDoInput }) {
    return (
        <>
            <label className="estoque-campo-rotulo">{rotulo}</label>
            <input className="estoque-campo-input" {...propsDoInput} />
            {erro && <p className="estoque-campo-erro">{erro}</p>}
        </>
    );
}

export default EstoqueCampo;
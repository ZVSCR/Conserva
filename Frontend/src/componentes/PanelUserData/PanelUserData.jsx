import './PanelUserData.css';
function PanelUserData(){
    return(
        <div className="panel-data">
            <h2> Altere seus dados </h2>
            <form className="data-form">
                <label htmlFor="username">Nome completo:</label>
                <input type="text" name="username" id="username"/>
                <label htmlFor="email">Email:</label>
                <input type="email" name="email" id="email"/>
                <label htmlFor="senha">Senha: </label>
                <input type="password" name="senha" id="senha" />
                <label htmlFor="TipoConta">Tipo de conta:</label>
                <div className='data-radio'>
                    <input type="radio" name="TipoConta" id="TipoDomestico"/>
                    <label htmlFor="TipoDomestico">Doméstico</label>
                    <input type="radio" name="TipoConta" id="TipoComercial"/>
                    <label htmlFor="TipoComercial">Comercial</label>
                </div>
                <div className='data-confirm'>
                    <button type = "button">Cancelar</button> 
                    <button type = "button">Aplicar</button>
                </div>
            </form>
        </div>
    );
}

export default PanelUserData;
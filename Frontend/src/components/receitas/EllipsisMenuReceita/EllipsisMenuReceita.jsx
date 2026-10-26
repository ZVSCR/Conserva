import "./EllipsisMenuReceita.css";

function EllipsisMenuReceita({ onClick, rotulo = "Opções da receita" }) {
    return (
        <button
            type="button"
            className="ellipsis-menu-receita"
            aria-label={rotulo}
            onClick={onClick}
        >
            <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="#ffffff"
                stroke="none"
                aria-hidden="true"
                focusable="false"
            >
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
            </svg>
        </button>
    );
}

export default EllipsisMenuReceita;

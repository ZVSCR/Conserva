import { useState } from 'react';

import styles from './Estoque.module.css';
import Header from './Header';
import Produto from './Produto';
import NavBar from './NavBar';
import EditarProduto from './EditarProd';
import ConfirmarExclusao from './ConfirmarExclusao';
import IconAdcionar from '../../assets/IconsEstoque/adicionar.png';


function PageEstoque(){
    
    //Para integração ao BD usar essa parte com [id, nome, qtd]
    const [produtos, setProdutos] = useState([]);

    const [produtoEditando, setProdutoEditando] = useState(null);
    
    const [adicionandoProduto, setAdicionandoProduto] = useState(false);

    const [produtoExcluindo, setProdutoExcluindo] = useState(null);


    function editarProduto(produto) {
        setProdutoEditando(produto);
    }
    
    //Enviar {nome, quantidade} e usar id criado
    function adicionarProduto(novoProduto) {
    setProdutos([
        ...produtos,
        {
            id: Date.now(), //Substituir  pelo id do BD
            nome: novoProduto.nome,
            quantidade: novoProduto.quantidade
        }
    ]);

    setAdicionandoProduto(false);
    }

    //Deve atualizar as edições no BD
    function salvarEdicao(produtoAtualizado) {

        setProdutos(
            produtos.map((produto) =>
                produto.id === produtoAtualizado.id
                    ? produtoAtualizado
                    : produto
            )
        );

        setProdutoEditando(null);
    }

    //Deve excluir o produto
    function excluirProduto(produto) {
        setProdutoExcluindo(produto);
    }


    function confirmarExclusao() {

        setProdutos(
            produtos.filter(
                (produto) => produto.id !== produtoExcluindo.id
            )
        );

        setProdutoExcluindo(null);
    }

    return(
        <div className={styles.paginaEstoque}>
            <Header />
            <main>
                
                <h1 className={styles.tituloLista}>Lista de produtos</h1>
        
                <div className={styles.listaProdutosContainer}>
                    {produtos.map((produto) => (
                        <Produto
                            key={produto.id}
                            produto={produto}
                            onEditar={editarProduto}
                            onExcluir={excluirProduto}
                        />
                    ))}
                </div>
                    {/*}
                <div className={styles.rodapeLista}>
                    <button
                        className={styles.botaoAdicionar}
                        onClick={() => setAdicionandoProduto(true)}
                    >
                        <img src={IconAdcionar} alt="Adicionar produto" />
                    </button>
                </div> 
                */}

            </main>
            <NavBar onAdicionar={() => setAdicionandoProduto(true)} />            
                {/*Modal de Adicionar ou Editar*/}
             {(produtoEditando || adicionandoProduto) && (
                <EditarProduto
                    produto={produtoEditando}
                    onSalvar={adicionandoProduto ? adicionarProduto : salvarEdicao}
                    onCancelar={() => {
                        setProdutoEditando(null);
                        setAdicionandoProduto(false);
                    }}
                />
            )}

            {/*Modal de excluir*/}
            {produtoExcluindo && (
                <ConfirmarExclusao
                    produto={produtoExcluindo}
                    onConfirmar={confirmarExclusao}
                    onCancelar={() => setProdutoExcluindo(null)}
                />
            )}  




        </div>
    );
}

export default PageEstoque;
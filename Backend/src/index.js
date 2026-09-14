const express = require('express');
const cors = require('cors');
const sql = require('./config/database'); // Importa conexão com o banco de dados
const userRoutes = require('./routes/userRoutes'); // Importa rotas de usuário
const items = require('./routes/itemRoutes');

const app = express();

app.use(cors()); // Libera o acesso para o frontend
app.use(express.json());
app.use('/api/users', userRoutes); // Rota para operações de usuário
app.use('/api/items', items); // Rota para itens do estoque

// Rota de teste
app.get('/api/teste-banco', async (req, res) => {
  try {
    // Executa uma query simples só para ver se responde
    const resultado = await sql`SELECT NOW() AS horaNoBanco;`;

    res.json({ 
      sucesso: true, 
      mensagem: 'Conexão com o banco funcionou!', 
      horaNoBanco: resultado[0] 
    });
  } catch (erro) {
    console.error('Erro na conexão:', erro);
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
});

app.post('/api/estoque', async (req, res) => { //Create de itens no estoque
  const { usuario_id, nome_item, quantidade, unidade_de_medida, valor_unitario, validade_estimada } = req.body; //Entrada do JSON

  try {
    const valorTotal = quantidade * valor_unitario;
    // Como item depende de compra, gera uma compra pra cada item a ser adicionado. Quando a feature de compra estiver organizada, altera-se
    const resultadoCompra = await sql`
      INSERT INTO compra (usuario_id, valor_total, estabelecimento)
      VALUES (${usuario_id}, ${valorTotal}, 'Adição manual')
      RETURNING id
    `;
    const idCompra = resultadoCompra[0].id;
    // Gera o item com as entradas do JSON
    const resultadoItem = await sql`
      INSERT INTO item (compra_id, nome_item, quantidade, unidade_de_medida, valor_unitario, validade_estimada)
      VALUES (${idCompra}, ${nome_item}, ${quantidade}, ${unidade_de_medida}, ${valor_unitario}, ${validade_estimada})
      RETURNING id
    `;
    const idItem = resultadoItem[0].id;
    // Adiciona o item criado ao estoque
    const resultadoEstoque = await sql`
      INSERT INTO estoque (usuario_id, item_id, quantidade_disponivel)
      VALUES (${usuario_id}, ${idItem}, ${quantidade})
      RETURNING id
    `;
    const idEstoque = resultadoEstoque[0].id;

    res.status(201).json({ idCompra, idItem, idEstoque });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ sucesso: false, erro: erro.message });
  }
});
/* Itens de debug que podem ser úteis mais pra frente, vou manter como comentário
app.get('/api/debug-usuarios', async (req, res) => {
  const usuarios = await sql`SELECT id, username, email FROM users`;
  res.json(usuarios);
});

app.get('/api/debug-compras', async (req, res) => {
  const compras = await sql`SELECT * FROM compra`;
  res.json(compras);
});

app.get('/api/debug-itens', async (req, res) => {
  const itens = await sql`SELECT * FROM item`;
  res.json(itens);
});

app.get('/api/debug-estoque', async (req, res) => {
  const estoque = await sql`SELECT * FROM estoque`;
  res.json(estoque);
});
*/
app.listen(3000, () => console.log('Backend rodando na porta 3000'));
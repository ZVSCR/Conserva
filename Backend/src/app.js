const express = require('express');
const cors = require('cors');
const sql = require('./config/database'); // Importa conexão com o banco de dados
const userRoutes = require('./routes/userRoutes'); // Importa rotas de usuário
const items = require('./routes/itemRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors()); // Libera o acesso para o frontend
app.use(express.json());
app.use('/api/users', userRoutes); // Rota para operações de usuário
app.use('/api/items', items); // Rota para itens do estoque
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'API funcionando.'
  });
});

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
/*
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

module.exports = app;
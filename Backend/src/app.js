const express = require('express');
const cors = require('cors');
const sql = require('./config/database');                 // Importa conexão com o banco de dados
const userRoutes = require('./routes/userRoutes');        // Importa rotas de operações de usuário
const itemsRoutes = require('./routes/itemRoutes');       // Importa rotas de manipulação de itens
const authRoutes = require('./routes/authRoutes');        // Importa rotas de autenticação
const estoqueRoutes = require('./routes/estoqueRoutes');  // Importa rotas do Estoque
const comprasRoutes = require('./routes/compraRoutes');   // Importa rotas de manipulação de compras
const receitasRoutes = require('./routes/receitaRoutes'); // Importa rotas de manipulação de receitas
const ingredienteRoutes = require('./routes/ingredienteRoutes'); // Importa rotas de manipulação de ingredientes

const app = express();

const frontendOrigin = process.env.FRONTEND_URL;

app.use(cors({
  origin(origin, callback) {
    const isLocalDevelopmentOrigin = process.env.NODE_ENV !== 'production'
      && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
    const isConfiguredOrigin = frontendOrigin && origin === frontendOrigin;

    if (!origin || isLocalDevelopmentOrigin || isConfiguredOrigin) {
      return callback(null, true);
    }

    return callback(new Error('Origem não autorizada para acessar a API.'));
  },
  credentials: true
}));
app.use(express.json());
app.use('/api/users', userRoutes);        // Rota para operações de usuário
app.use('/api/items', itemsRoutes);       // Rota para itens do estoque
app.use('/api/auth', authRoutes);         // Rota para autenticação de usuário
app.use('/api/estoque', estoqueRoutes);   // Rota de estoque
app.use('/api/compras', comprasRoutes);   // Rota para operações de compras
app.use('/api/receitas', receitasRoutes); // Rota para operações com receitas
app.use('/api/ingredientes', ingredienteRoutes); // Rota para operações com ingredientes

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

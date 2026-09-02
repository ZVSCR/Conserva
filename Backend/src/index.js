const express = require('express');
const cors = require('cors');
const sql = require('./config/database'); // Importa conexão com o banco de dados

const app = express();

app.use(cors()); // Libera o acesso para o frontend
app.use(express.json());

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

app.listen(3000, () => console.log('Backend rodando na porta 3000'));
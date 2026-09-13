// Lidar com variáveis de ambiente
require('dotenv').config();

// Uso do Express
const express = require('express');
const app = express();

// localhost:PORT
const PORT = process.env.PORT || 3000;

app.use(express.json())

// Testa API
app.get('/', (req, res) => {
  res.json({
    message: 'API funcionando'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// endpoints de autenticação
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
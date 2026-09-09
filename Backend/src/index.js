require('dotenv').config();

const express = require('express');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json())

app.get('/', (req, res) => {
    res.json({
        message: 'API funcionando'
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

const authRoutes = require('./routes/authRoutes');

app.use('/api/auth', authRoutes);
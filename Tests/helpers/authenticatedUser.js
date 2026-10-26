// Somente para testes de regras de negócio que simulam a camada de autenticação.
// Os testes de sessão e autorização usam o middleware real e cookies reais.
module.exports = function authenticatedUser(defaultId = 1) {
    return (req, res, next) => {
        const selected = req.get('X-Test-User');
        if (selected === 'anonymous') return res.status(401).json({ error: 'Faça login para continuar.' });
        req.user = { id: selected ? Number(selected) : defaultId, username: 'teste', email: 'teste@example.com', tipo: 'domestico' };
        return next();
    };
};

const { getSessionConfig } = require('../config/session');

module.exports = function sessionOrigin(req, res, next) {
    const origin = req.get('Origin');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && origin &&
        origin !== getSessionConfig().frontendOrigin) {
        return res.status(403).json({ error: 'Origem da solicitação não permitida.' });
    }
    return next();
};

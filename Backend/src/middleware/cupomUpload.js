const multer = require('multer');
const os = require('node:os');

const MAX_IMAGENS = 1;
const MAX_BYTES = 3 * 1024 * 1024;

const upload = multer({
    dest: os.tmpdir(),
    limits: { files: MAX_IMAGENS, fileSize: MAX_BYTES, fields: 1, parts: MAX_IMAGENS + 1 },
    fileFilter(req, arquivo, callback) {
        if (!arquivo.mimetype.startsWith('image/')) {
            const erro = new Error('Envie apenas arquivos de imagem.');
            erro.code = 'FORMATO_INVALIDO';
            return callback(erro);
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.mimetype)) {
            const erro = new Error('Use imagens JPEG, PNG ou WebP.');
            erro.code = 'FORMATO_NAO_SUPORTADO';
            return callback(erro);
        }
        callback(null, true);
    }
}).array('imagens', MAX_IMAGENS);

function receberImagensCupom(req, res, next) {
    upload(req, res, (erro) => {
        if (!erro) return next();
        if (erro.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'Cada imagem deve ter no máximo 3 MB.' });
        }
        if (['LIMIT_FILE_COUNT', 'LIMIT_PART_COUNT'].includes(erro.code)) {
            return res.status(400).json({ error: 'Envie uma imagem por solicitação.' });
        }
        return res.status(400).json({ error: ['FORMATO_INVALIDO', 'FORMATO_NAO_SUPORTADO'].includes(erro.code)
            ? erro.message : 'Upload inválido. Envie uma imagem no campo imagens.' });
    });
}

module.exports = { receberImagensCupom, MAX_IMAGENS, MAX_BYTES };

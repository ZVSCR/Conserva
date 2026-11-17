const multer = require('multer');
const os = require('node:os');

const MAX_IMAGENS = 10;
const MAX_BYTES = 10 * 1024 * 1024;

const upload = multer({
    dest: os.tmpdir(),
    limits: { files: MAX_IMAGENS, fileSize: MAX_BYTES, fields: 0, parts: MAX_IMAGENS },
    fileFilter(req, arquivo, callback) {
        if (!arquivo.mimetype.startsWith('image/')) {
            const erro = new Error('Envie apenas arquivos de imagem.');
            erro.code = 'FORMATO_INVALIDO';
            return callback(erro);
        }
        callback(null, true);
    }
}).array('imagens', MAX_IMAGENS);

function receberImagensCupom(req, res, next) {
    upload(req, res, (erro) => {
        if (!erro) return next();
        if (erro.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'Cada imagem deve ter no máximo 10 MB.' });
        }
        if (['LIMIT_FILE_COUNT', 'LIMIT_PART_COUNT'].includes(erro.code)) {
            return res.status(400).json({ error: 'Envie no máximo 10 imagens por solicitação.' });
        }
        return res.status(400).json({ error: erro.code === 'FORMATO_INVALIDO'
            ? erro.message : 'Upload inválido. Envie as imagens no campo imagens.' });
    });
}

module.exports = { receberImagensCupom, MAX_IMAGENS, MAX_BYTES };

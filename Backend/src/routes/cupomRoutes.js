const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const { receberImagensCupom } = require('../middleware/cupomUpload');
const { digitalizarCupons } = require('../controllers/cupomController');

const router = express.Router();
router.post('/digitalizar', requireAuth, receberImagensCupom, digitalizarCupons);

module.exports = router;

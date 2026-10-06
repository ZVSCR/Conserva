const express = require('express');
const receitaRouter = express.Router;

receitaRouter.route('/')
    .get()
    .patch()
    .post()
    .delete();

module.exports = receitaRouter;
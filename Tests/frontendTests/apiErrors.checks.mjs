import test from 'node:test';
import assert from 'node:assert/strict';
import { getApiErrorMessage } from '../../Frontend/src/services/apiErrors.js';

test('apresenta todos os erros de validação do cadastro', () => {
  assert.equal(getApiErrorMessage({ errors: [{ message: 'Nome obrigatório.' }, { message: 'Tipo inválido.' }] }),
    'Nome obrigatório. Tipo inválido.');
});

test('aceita os formatos de erro usados pelos controladores', () => {
  assert.equal(getApiErrorMessage({ error: 'Conta já existe.' }), 'Conta já existe.');
  assert.equal(getApiErrorMessage({ message: 'Falha no perfil.' }), 'Falha no perfil.');
  assert.equal(getApiErrorMessage(null, 'Falha inesperada.'), 'Falha inesperada.');
});

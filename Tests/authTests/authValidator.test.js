const { validateRegister, validateLogin, validateTipo } = require('../../Backend/src/middleware/authValidator');

const cadastro = { username: 'ana', email: 'ana@example.com', password: 'senha', tipo: 'domestico' };

test.each(['domestico', 'comercial', ' COMERCIAL '])('aceita o tipo de conta %s', (tipo) => {
    expect(validateRegister({ ...cadastro, tipo }).isValid).toBe(true);
});

test.each(['adm', 'user', 'dev', '', null, 1])('recusa tipo de conta inválido %s', (tipo) => {
    expect(validateTipo(tipo)).not.toHaveLength(0);
});

test.each(['ana', 'ana@example.com'])('aceita login usando identifier %s', (identifier) => {
    expect(validateLogin({ identifier, password: 'senha' }).isValid).toBe(true);
});

test('o login exige identifier, não username', () => {
    expect(validateLogin({ username: 'ana', password: 'senha' }).isValid).toBe(false);
});

test.each(['ana@example.com', 'ana@', '@ana', ' ANA@EXAMPLE.COM '])('reserva @ para emails, recusando username %s', (username) => {
    expect(validateRegister({ ...cadastro, username })).toEqual({
        isValid: false,
        errors: expect.arrayContaining([expect.objectContaining({ field: 'username', message: expect.stringContaining('@') })])
    });
});

test.each(['ana', 'ana@', '@example.com', 'ana@@example.com', 'ana @example.com'])('recusa email sem formato apropriado %s', (email) => {
    expect(validateRegister({ ...cadastro, email }).isValid).toBe(false);
});

test.each(['ana.silva', 'ana_silva', 'ana-silva', ' ANA '])('preserva nomes válidos sem @: %s', (username) => {
    expect(validateRegister({ ...cadastro, username }).isValid).toBe(true);
});

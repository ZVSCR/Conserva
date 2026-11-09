# OCR de cupom (independente)

O servico nao esta conectado a rotas, compras ou telas.

Instale Python e as dependencias com `python -m pip install -r Backend/requirements-ocr.txt`.
No Windows, siga tambem as instrucoes de instalacao de torch e torchvision do
[EasyOCR](https://github.com/JaidedAI/EasyOCR#installation).
O comando `python` deve estar disponivel no PATH do processo Node.
O primeiro uso baixa os modelos de portugues e ingles; a leitura usa CPU.

```js
const { extrairCupom } = require('../Backend/src/services/cupomService');
const resultado = await extrairCupom('caminho/cupom.png');
// { texto: '...', itens: [
//   { nome_item: 'ARROZ INTEGRAL 1KG', quantidade: 2, preco_total_item: 11 }
// ] }
```

O campo `texto` contem os trechos reconhecidos separados por quebra de linha.
Essas quebras separam caixas OCR, nao necessariamente linhas visuais do cupom.
Erros do Python/EasyOCR rejeitam a Promise.

Execute `npm.cmd test -- --runInBand Tests/cupomTests` no Windows.
Os testes isolam o processo Python e nao exigem modelos nem acesso a rede.
A leitura de uma imagem real ainda precisa ser validada com EasyOCR instalado.

`extrairItensCupom(texto)` tambem pode ser usada sem executar OCR.
O parser segue o exemplo fornecido: indice, codigo numerico de pelo menos oito
digitos, descricao, quantidade inteira, UN, preco unitario e total com virgula
e duas casas decimais. Usa `VL TOT` como `preco_total_item`, conforme o contrato
de compras existente. Nao infere quantidade a partir do tamanho da embalagem
no nome (por exemplo, 1KG). Ignora cabecalhos, totais e itens incompletos; texto
sem itens reconhecidos retorna `[]`. Outros layouts, unidades, quantidades
fracionarias e separadores de milhar ainda nao sao suportados.

A ordem dos trechos OCR precisa seguir a leitura das colunas de cada item.
Fotos inclinadas ou caixas detectadas fora de ordem podem exigir ajustes futuros.
Confira os itens contra o texto original antes de usa-los em uma compra.

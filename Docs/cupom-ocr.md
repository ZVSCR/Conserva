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

## Preprocessamento e parametros

O perfil padrao foi comparado nas duas amostras de cupom fornecidas.
Veja as comparacoes e limitacoes em [ajuste-ocr.md](ajuste-ocr.md).

Edite os tres dicionarios no inicio de
`Backend/src/scripts/extrairTextoCupom.py`:

- `PREPROCESSAMENTO`: escala, recorte do papel, contraste, desfoque,
  binarizacao, inclinacao, espessura dos tracos e borda.
- `LEITOR_OCR`: idiomas e CPU/GPU usados por `easyocr.Reader`.
- `LEITURA_OCR`: parametros de `readtext`, como decoder, limiares de deteccao,
  contraste, tamanho da tela e agrupamento das caixas. `detail=0` permanece
  fixo para preservar a string JSON esperada pelo backend.

O fluxo combina transparencia sobre branco, converte para cinza, inverte se
configurado, recorta se configurado, redimensiona, equaliza o histograma,
aplica Gaussian blur, corrige inclinacao se configurado, binariza, ajusta
tracos se configurado e adiciona uma borda branca. As etapas seguem a secao
de processamento de imagens do
[guia de qualidade](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html);
o motor de reconhecimento continua sendo EasyOCR. Consulte tambem a
[documentacao dos parametros EasyOCR](https://www.jaided.ai/easyocr/documentation/).

Para comparar resultados, defina `salvar_em` como `'cupom-processado.png'` e
inspecione a imagem antes de mudar outros parametros. O arquivo sera salvo
relativo ao diretorio de execucao; nao use o mesmo caminho da imagem original.
Use `None` para nao salvar. `binarizacao` aceita `'otsu'`,
`'adaptativa'` (iluminacao desigual), `'manual'` (ajuste `limiar_manual`) ou
`None` (padrao: manter tons de cinza). A escala padrao e 2, com limite de 2560 pixels
no maior lado antes da borda; isso nao recupera detalhes de uma foto borrada.
Ao aumentar esse limite, ajuste tambem `canvas_size` para evitar que EasyOCR
reduza a imagem novamente. O fluxo nao deduz DPI da imagem.

Recorte, inversao, equalizacao, blur, binarizacao, deskew e morfologia ficam
desligados inicialmente, pois o perfil agressivo removeu texto das amostras:
o recorte pressupoe papel claro em fundo escuro; deskew estima somente
pequenas inclinacoes por segmentos quase horizontais, nao perspectiva ou
orientacao de 90 graus. Equalizacao, blur e binarizacao tambem podem apagar
caracteres pequenos; compare com essas etapas desligadas. Engrossar/afinar
tracos exige ajuste conforme a imagem. Nenhum perfil garante melhor acuracia
para todos os cupons, nem altera o parser de itens.

Para experimentar uma sequencia semelhante ao exemplo enviado, use
`equalizar_histograma=True`, `desfoque_kernel=5`, `desfoque_sigma=1.0`,
`binarizacao='manual'` e `limiar_manual=60`. Diferentemente daquele exemplo,
o blur aqui realmente alimenta a binarizacao. Compare a imagem salva com
o original e ajuste o limiar. Nao e necessario instalar pylab/matplotlib.

No PowerShell, para executar e visualizar quebras de linha:

```powershell
.\.venv-ocr\Scripts\python.exe Backend/src/scripts/extrairTextoCupom.py "C:\caminho\cupom.png" | ConvertFrom-Json
```

Testes de preprocessamento (sem baixar modelos):

```powershell
.\.venv-ocr\Scripts\python.exe -m unittest discover -s Tests/cupomTests -p "test_*.py"
```

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

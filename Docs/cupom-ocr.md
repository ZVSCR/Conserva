# OCR de cupom (independente)

Documentacao conferida com o codigo em 10/11/2026. Os valores abaixo descrevem
o perfil atual, nao uma garantia de acuracia.

O reconhecimento usa EasyOCR, com preprocessamento em OpenCV/NumPy. A tela
de digitalizacao existe, mas ainda nao chama esse servico. Nao ha rota HTTP
de OCR nem integracao automatica com o cadastro de compras.

## Instalacao e execucao

Execute os comandos da raiz do repositorio. Python 3.12 de 64 bits foi usado
nos testes locais anteriores; nao ha arquivo de runtime fixando essa versao.
Com Python 3.12 instalado, execute um comando por vez no PowerShell:

```powershell
py -3.12 -m venv .venv-ocr
.\.venv-ocr\Scripts\python.exe -m pip install --upgrade pip
.\.venv-ocr\Scripts\python.exe -m pip install -r Backend/requirements-ocr.txt
```

Se a criacao do ambiente falhar, resolva esse erro antes de continuar.
O arquivo declara `easyocr==1.7.2`, `numpy` e `opencv-python-headless`;
somente EasyOCR tem versao fixada. Torch e torchvision sao dependencias
do EasyOCR; em caso de problemas no Windows, consulte suas
[instrucoes de instalacao](https://github.com/JaidedAI/EasyOCR#installation).

Cada maquina ou servidor precisa instalar seu proprio ambiente. `.venv/`,
`.venv-ocr/`, `venv/`, `__pycache__/` e bytecode Python sao ignorados pelo Git.
Usuarios do site nao precisam instalar Python no navegador.

O primeiro uso pode baixar modelos de portugues e ingles. O perfil atual
usa `gpu=True`: EasyOCR tenta usar aceleracao disponivel e pode recorrer a
CPU se nao houver dispositivo compativel. Isso nao garante que a instalacao
do PyTorch tenha suporte a GPU. `gpu=False` forca CPU.

Para executar o script diretamente, substitua o caminho por uma imagem real:

```powershell
.\.venv-ocr\Scripts\python.exe Backend/src/scripts/extrairTextoCupom.py "C:\caminho\cupom.png"
```

O stdout contem uma string JSON, por exemplo `"ARROZ\n2 UN 10,00"`.
Avisos do EasyOCR ficam no stderr e podem aparecer junto do resultado no
terminal. O script nao retorna itens, coordenadas nem confianca.

## Servico Node

O [servico](../Backend/src/services/cupomService.js) chama literalmente
`python` pelo PATH do processo Node, nao o executavel `.venv-ocr` diretamente.
Ative o ambiente antes de iniciar a API existente:

```powershell
.\.venv-ocr\Scripts\Activate.ps1
python --version
node Backend/src/index.js
```

Iniciar a API nao cria uma rota de OCR. Para testar o servico diretamente,
execute da raiz no mesmo ambiente ativado:

```powershell
node -e "require('./Backend/src/services/cupomService').extrairCupom('C:/caminho/cupom.png').then(console.log).catch(console.error)"
```

Exemplo de uso em um modulo CommonJS (ajuste o caminho relativo ao arquivo):

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
`extrairTextoCupom(caminhoImagem)` retorna somente o texto como Promise;
`extrairCupom(caminhoImagem)` retorna `{ texto, itens }`. Respostas JSON
invalidas tambem rejeitam a Promise. O servico usa `execFile`, sem interpretar
o caminho da imagem como comando de shell.

Execute `npm.cmd test -- --runInBand Tests/cupomTests` no Windows.
Os testes isolam o processo Python e nao exigem modelos nem acesso a rede.
Esses testes nao medem acuracia. As leituras reais anteriores estao registradas
em [ajuste-ocr.md](ajuste-ocr.md); novos perfis precisam de nova conferencia.

## Preprocessamento e parametros

O experimento anterior comparou um perfil em cinza/CPU. O perfil atual usa
binarizacao adaptativa, deskew e `gpu=True`; os resultados historicos nao
validam automaticamente esses novos valores.

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
`None` (manter tons de cinza). O modo atual e `'adaptativa'`.
A escala atual e 2, com limite de 2560 pixels
no maior lado antes da borda; isso nao recupera detalhes de uma foto borrada.
Ao aumentar esse limite, ajuste tambem `canvas_size` para evitar que EasyOCR
reduza a imagem novamente. O fluxo nao deduz DPI da imagem.

No perfil atual, binarizacao adaptativa e deskew estao ligados; recorte,
inversao, equalizacao, blur e morfologia estao desligados. Recorte pressupoe
papel claro em fundo escuro; deskew estima somente pequenas inclinacoes por
segmentos quase horizontais, nao perspectiva nem orientacao de 90 graus.
A tela pode crescer na rotacao para preservar as extremidades. O limite de
2560 e aplicado antes dessa rotacao e da borda. A imagem precisa ser
decodificavel e de 8 bits, como PNG/JPEG.

O caminho de `salvar_em` deve ter pasta existente. Um arquivo de depuracao
existente pode ser sobrescrito; o script rejeita o mesmo caminho da imagem
original. Atualmente `salvar_em=None`, portanto nada e salvo.

### Valores atuais de PREPROCESSAMENTO

| Parametro | Valor | Efeito / quando se aplica |
| --- | --- | --- |
| `escala` | `2.0` | Multiplica largura e altura, respeitando o limite. |
| `lado_maximo` | `2560` | Maior lado antes de deskew e borda; pode reduzir imagens grandes. |
| `inverter` | `False` | Troca claro e escuro para texto claro sobre fundo escuro. |
| `recortar_fundo` | `False` | Recorta a maior regiao clara. |
| `limiar_papel` | `190` | Brilho minimo de papel, de 0 a 255; inativo sem recorte. |
| `equalizar_histograma` | `False` | Redistribui intensidades para aumentar contraste. |
| `desfoque_kernel` | `0` | Desliga Gaussian blur; para ligar, inteiro impar >= 3. |
| `desfoque_sigma` | `2.0` | Espalhamento do blur; inativo com kernel 0. |
| `binarizacao` | `'adaptativa'` | Limiar local gaussiano. |
| `limiar_manual` | `215` | Pixels >= esse valor ficam brancos; inativo no modo atual. |
| `bloco_adaptativo` | `41` | Vizinhanca do limiar local; inteiro impar >= 3. |
| `constante_adaptativa` | `13` | Constante subtraida do limiar local; aumentar tende a deixar mais pixels brancos. |
| `corrigir_inclinacao` | `True` | Estima e corrige inclinacao por segmentos quase horizontais. |
| `angulo_maximo` | `10` | Limite em graus das inclinacoes consideradas. |
| `morfologia` | `None` | Desligada; `'engrossar'` engrossa texto preto, `'afinar'` afina. |
| `morfologia_kernel` | `1` | Tamanho do kernel; 1 nao altera tracos, mesmo com a etapa ligada. |
| `borda` | `10` | Pixels brancos adicionados em cada lado ao final. |
| `salvar_em` | `None` | Nao salva imagem processada. |

### Valores atuais de LEITOR_OCR e LEITURA_OCR

`LEITOR_OCR` usa `lang_list=['pt', 'en']` e `gpu=True`.
Os parametros de `LEITURA_OCR` sao:

| Parametro | Valor | Significado |
| --- | --- | --- |
| `decoder` | `'greedy'` | Seleciona caracteres pelo caminho mais provavel; beamsearch explora alternativas. |
| `beamWidth` | `5` | Alternativas exploradas pelo beam search; inativo com greedy. |
| `batch_size` | `1` | Regioes reconhecidas por lote; afeta memoria e velocidade. |
| `workers` | `0` | Carregamento no processo principal. |
| `paragraph` | `False` | Nao combina caixas em paragrafos. |
| `min_size` | `10` | Filtra caixas pequenas em pixels. |
| `contrast_ths` | `0.3` | Regioes abaixo desse contraste podem ser reconhecidas de novo. |
| `adjust_contrast` | `0.5` | Contraste alvo da segunda tentativa. |
| `text_threshold` | `0.3` | Limiar de deteccao de texto. |
| `low_text` | `0.4` | Corte inferior de pontuacao para formar regioes de texto. |
| `link_threshold` | `0.9` | Limiar das conexoes entre regioes de caracteres. |
| `canvas_size` | `2560` | Limita a maior dimensao na deteccao. |
| `mag_ratio` | `1.0` | Magnificacao na deteccao; preprocessamento ja redimensiona. |
| `slope_ths` | `0.1` | Inclinacao tolerada ao unir caixas. |
| `ycenter_ths` | `0.5` | Diferenca vertical tolerada entre centros. |
| `height_ths` | `0.5` | Diferenca de altura tolerada na uniao. |
| `width_ths` | `0.5` | Distancia horizontal tolerada na uniao. |
| `add_margin` | `0.1` | Margem adicionada em torno das caixas. |
| `allowlist` | `None` | Sem restricao adicional de caracteres permitidos. |
| `blocklist` | `None` | Sem exclusao adicional; ignorada quando ha allowlist. |
| `rotation_info` | `None` | Sem tentativas adicionais de rotacao de cada caixa. |

Os limiares de agrupamento, exceto `slope_ths`, usam altura de caixa como
referencia; `slope_ths` e uma razao de inclinacao. `detail=0` fica fixo fora
do dicionario para preservar o contrato com o Node.

### Comparar ajustes

Mude um parametro por vez e confira nomes, codigos, quantidades, separadores
decimais e totais contra o original. Equalizacao, blur, binarizacao e
morfologia podem apagar detalhes pequenos. Nenhum perfil garante melhor
acuracia para todos os cupons, nem altera o parser de itens.

Confusoes entre 9/0/8 e 7/1 exigem conferir os detalhes na imagem processada.
Uma allowlist numerica nao distingue digitos parecidos e nao deve restringir
o cupom inteiro, que contem descricoes. O projeto nao corrige esses digitos
automaticamente nem valida digitos verificadores ou quantidade x preco
contra totais. Essas verificacoes exigiriam implementacao.

Para experimentar equalizacao, blur e limiar manual, use
`equalizar_histograma=True`, `desfoque_kernel=5`, `desfoque_sigma=1.0`,
`binarizacao='manual'` e `limiar_manual=60`. O resultado do blur alimenta
a binarizacao. Esse e um exemplo de configuracao, nao o perfil atual.
Compare a imagem salva com
o original e ajuste o limiar. Nao e necessario instalar pylab/matplotlib.

No PowerShell, para executar e visualizar quebras de linha:

```powershell
.\.venv-ocr\Scripts\python.exe Backend/src/scripts/extrairTextoCupom.py "C:\caminho\cupom.png" | ConvertFrom-Json
```

Testes de preprocessamento (sem baixar modelos):

```powershell
.\.venv-ocr\Scripts\python.exe -m unittest discover -s Tests/cupomTests -p "test_*.py"
```

Esses testes Python cobrem preprocessamento e adaptador com EasyOCR simulado.
Sao independentes do Jest e nao sao executados por `npm test`. Ambos os
conjuntos dispensam banco de dados. Passar nos testes nao mede acuracia de
reconhecimento: execute tambem o script com imagens reais.

## Parser de itens e limitacoes

`extrairItensCupom(texto)` tambem pode ser usada sem executar OCR.
O parser segue o exemplo fornecido: indice, codigo numerico de pelo menos oito
digitos, descricao, quantidade inteira, UN, preco unitario e total com virgula
e duas casas decimais. Usa `VL TOT` como `preco_total_item`, conforme o contrato
de compras existente. Nao infere quantidade a partir do tamanho da embalagem
no nome (por exemplo, 1KG). Ignora cabecalhos, totais e itens incompletos; texto
sem itens reconhecidos retorna `[]`. Outros layouts, unidades, quantidades
fracionarias e separadores de milhar ainda nao sao suportados.

Exemplo aceito: `1 78910001 ARROZ INTEGRAL 1KG 2 UN 5,50 11,00`.
Campos precisam estar separados por espacos (quebras viram espacos);
codigo colado ao indice nao e suportado. Texto legivel pode nao gerar itens.

A ordem dos trechos OCR precisa seguir a leitura das colunas de cada item.
Fotos inclinadas ou caixas detectadas fora de ordem podem exigir ajustes futuros.
Confira os itens contra o texto original antes de usa-los em uma compra.
`paragraph=False` nao reconstroi tabelas. O resultado nao e persistido
automaticamente como compra nem validado contra o cadastro de ingredientes.

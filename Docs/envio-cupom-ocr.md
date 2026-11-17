# Envio de imagens ao OCR

O botao **Digitalizar** de `PanelDigitalizarCupom` chama o helper
`Frontend/src/services/cupom.js`. O helper converte as Data URLs da camera
ou galeria em arquivos e envia `multipart/form-data` pela API autenticada.
Nao define `Content-Type` manualmente: o navegador inclui o boundary.

## Contrato HTTP

- Rota: `POST /api/cupons/digitalizar`.
- Autenticacao: cookie de sessao existente, enviado por `apiFetch`.
- Corpo: campo de arquivo repetido `imagens`, de 1 a 10 imagens.
- Limite: 10 MiB por imagem (10 * 1024 * 1024 bytes).
- Formato declarado: MIME `image/*`. A imagem tambem precisa ser
  decodificavel pelo OpenCV existente; o upload nao converte formatos.
- Resposta de sucesso: `{ resultados: [{ texto, itens }, ...] }`.
  Cada elemento e o retorno original de `extrairCupom`, na ordem do upload.
- Erros: `400` para upload invalido/ausente ou quantidade excedida,
  `401` para sessao ausente/invalida, `413` para tamanho excedido e
  `500` para falha no processamento. O corpo de erro usa `{ error: "..." }`.
  Se uma imagem falhar, o lote falha; nao retorna resultados parciais.

Exemplo de chamada no frontend:

```js
import { digitalizarCupons } from './services/cupom.js';

const { resultados } = await digitalizarCupons(fotos);
// resultados conserva os campos texto e itens retornados pelo OCR.
```

## Fluxo no servidor

`cupomRoutes` autentica antes do upload. `cupomUpload` usa Multer com nomes
temporarios gerados pelo servidor. `cupomUploadService` chama o servico OCR e, em seguida, o modelo Gemini
sequencialmente; tambem remove todos os arquivos de upload ao terminar,
inclusive quando o OCR falha. Nao grava imagens nem resultados no banco.
Referencia do middleware: [Multer](https://expressjs.com/en/resources/middleware/multer/).

O script Python, seu preprocessamento, parser e formato de saida nao foram
alterados. O ambiente que inicia o Node precisa disponibilizar `python` no
PATH com as dependencias de `Backend/requirements-ocr.txt` instaladas.
O primeiro uso do EasyOCR pode baixar modelos.

## Processamento pelo Gemini

Depois do OCR, o backend envia o texto para `POST /api/v1/process-receipt`
do serviço FastAPI em `Chat_model`. O endereço completo deve ser configurado
no backend como `CHAT_MODEL_API_URL`; defina também `INTERNAL_API_SECRET` com
o mesmo segredo configurado no deploy do serviço Gemini. Configure
`GEMINI_API_KEY` no deploy de `Chat_model`. Não use um segredo padrão nem
exponha essas variáveis no frontend.

O catálogo atual de ingredientes do banco é enviado como `lista_referencia`.
O backend imprime a resposta do Gemini no console do servidor para inspeção
temporária, mas a resposta HTTP do upload continua contendo apenas os
resultados OCR (`texto` e `itens`). Falhas de configuração, rede ou resposta
do serviço interrompem o processamento e são reportadas como falha do upload.

A configuracao atual do Python grava `cupom-processado.png` para depuracao.
Essa gravacao preexistente permanece ativa e nao faz parte da limpeza dos
arquivos recebidos no upload.

## Integracao de resultados pendente

A tela informa andamento, sucesso ou falha e preserva as fotos para uma nova
tentativa. O retorno e mantido em `resultadoOcr.current` no componente;
o helper tambem retorna a resposta para quem implementar o consumo.
Exibir/editar os itens do Gemini ou preencher Nova Compra continua fora
do escopo. Nenhuma compra e cadastrada.

## Verificacao

```powershell
npm.cmd test -- --runInBand Tests/cupomTests
node --test Tests/frontendTests/cupomUpload.checks.mjs
```

Os testes de upload exercitam HTTP, sessao, arquivos temporarios e limpeza,
com o OCR simulado. Nao medem acuracia nem validam o ambiente Python real.

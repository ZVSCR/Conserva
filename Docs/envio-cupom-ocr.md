# Envio de imagens para o Gemini Vision

O botao **Digitalizar** de `PanelDigitalizarCupom` chama o helper
`Frontend/src/services/cupom.js`. O helper prepara cada imagem para no maximo
3 MiB e a envia em uma requisicao autenticada separada. Assim, cada chamada
permanece dentro do limite de payload das funcoes Vercel. Imagens grandes ou
em outros formatos sao convertidas para JPEG no navegador.

## Contrato HTTP

- Rota: `POST /api/cupons/digitalizar`.
- Autenticacao: cookie de sessao existente, enviado por `apiFetch`.
- Corpo: um arquivo no campo `imagens`.
- Formatos: JPEG, PNG ou WebP.
- Limite: 3 MiB por imagem antes de codificar para envio ao Gemini.
- Resposta de sucesso: `{ resultados: [{ texto, itens, itens_alimenticios }] }`.
  Cada imagem retorna seu texto OCR e a lista padronizada pelo Chat_model.
- Erros: `400` para upload invalido, formato nao suportado ou imagem ausente,
  `401` para sessao ausente/invalida, `413` para tamanho excedido e `500` para
  falha de processamento. O corpo de erro usa `{ error: "..." }`.

## Fluxo no servidor

`cupomRoutes` autentica antes do upload. `cupomUpload` grava a imagem em um
arquivo temporario. `cupomUploadService` le os bytes e envia a imagem e o
catalogo de ingredientes ao servico FastAPI em `Chat_model`. O Gemini Vision
retorna o texto OCR e os itens alimenticios padronizados em uma chamada. O
backend devolve ambos ao frontend e remove os arquivos temporarios mesmo quando
o processamento falha. O resultado OCR nao e salvo automaticamente.

O backend nao inicia mais Python nem depende de EasyOCR/OpenCV no runtime Node.
Configure `CHAT_MODEL_API_URL` como a URL do endpoint
`/api/v1/process-receipt`. Configure `INTERNAL_API_SECRET` no backend e no
servico `Chat_model`, e `GEMINI_API_KEY` somente no servico `Chat_model`.
Mantenha esses segredos fora do frontend.

## Revisao e registro da compra

A tela exibe os itens, quantidades, unidades e valores identificados, junto com
o texto OCR para conferencia. Nome, quantidade, unidade, valor unitario, data e
estabelecimento podem ser revisados antes do envio. Ao selecionar **Registrar
compra**, o frontend converte o valor unitario em preco total e chama
`POST /api/compras`; o endpoint autenticado grava a compra e seus itens no
banco. Medidas nao suportadas pela compra precisam ser corrigidas na revisao.

## Verificacao

```powershell
npm.cmd test -- --runInBand Tests/cupomTests
node --test Tests/frontendTests/cupomUpload.checks.mjs
```

Os testes validam upload, sessao, limpeza de temporarios, envio ao Gemini e
compressao/preparacao do payload; nao medem a acuracia real do OCR.

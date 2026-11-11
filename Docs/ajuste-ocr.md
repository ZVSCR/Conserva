# Ajuste empirico do EasyOCR — 10/11/2026

Este arquivo preserva o experimento realizado naquele momento, nao os
parametros atuais. Para instalacao, execucao e valores em uso, consulte
[cupom-ocr.md](cupom-ocr.md). O script atualmente habilita binarizacao
adaptativa (bloco 41, constante 13), deskew e `gpu=True`, e usa
`contrast_ths=0.3`, `text_threshold=0.3` e `link_threshold=0.9`.
Essas alteracoes nao foram avaliadas pelo experimento registrado abaixo.

Foram comparadas 20 combinacoes de preprocessamento/leitura em cada uma das
duas amostras fornecidas, totalizando 40 leituras reais. Foram usados os
modelos existentes do EasyOCR 1.7.2, portugues/ingles e CPU. Nenhum resultado
foi corrigido por substituicoes especificas para esses cupons.

## Comparacoes

- Perfil anterior: escala 3, binarizacao adaptativa, bloco 69, constante 15,
  deskew ligado e morfologia afinar com kernel 1 (sem efeito).
- Cinza em escalas 2, 3 e 4, sem deskew nem morfologia.
- Adaptativa: blocos 31/69/101, constantes 9/15/5 conforme a combinacao.
- Limiar manual 170 ou 200, Otsu e equalizacao de histograma.
- Sobre cinza em escala 2: beamsearch, alfabeto restrito, beamsearch com
  alfabeto restrito, deteccao mais sensivel e margens 0/0.3.
- Alfabeto somente em maiusculas com cinza ou binarizacao adaptativa.

A triagem comparou aproximacoes de oito trechos visiveis por imagem usando
distancia de edicao: nomes, codigos, precos e totais. A comparacao normalizou
acentos, caixa e pontuacao, portanto serviu apenas para ordenar candidatos:
nao mede acuracia integral, nao valida casas decimais e nao deve ser
interpretada como percentual de confiabilidade. Os textos dos candidatos
tambem foram inspecionados para verificar os erros remanescentes.

## Perfil compartilhado escolhido no experimento

Escala 2, tons de cinza, borda branca 10; equalizacao, blur, binarizacao,
deskew e morfologia desligados. Parametros de leitura EasyOCR mantidos:
greedy, text_threshold 0.7, low_text 0.4, link_threshold 0.4, add_margin 0.1.
Beamsearch e alfabeto restrito nao trouxeram ganhos nos trechos conferidos.

O perfil cinza preservou melhor os campos de CF-e. A escala 3 empatou nos
trechos conferidos de CF-e, mas foi mais lenta e pior em NFC-e. Equalizacao
isolada foi particularmente ruim. Os resultados nao justificaram adotar
limiarizacao agressiva como padrao para as duas imagens.

Exemplos de CF-e, sem correcoes de texto:

| Campo impresso | Perfil anterior | Perfil escolhido |
| --- | --- | --- |
| Blusa n3 | `8luse n3` | `Blusa n3` |
| Codigo 530236310 | `001 530236370` | `001530236310` |
| PERFUME PA | `PERFuhe Pa` | `Perfuhe Pa` |
| Total 288,90 | `288.9` | `288,90` |

Mesmo o perfil escolhido ainda troca M por H em PERFUME, confunde unidades
e fragmenta linhas. Em NFC-e, nenhum dos candidatos recuperou os tres nomes
de produtos e todos os valores com confiabilidade. O perfil adaptativo
anterior pontuou ligeiramente melhor na triagem de NFC-e isoladamente,
mas continuou ilegivel; nao foi considerado uma solucao para essa imagem.

Este ajuste escolhe um compromisso para duas amostras, nao o melhor perfil
possivel para qualquer nota. Validar novas fotos, especialmente originais
com maior resolucao, antes de usar os campos em compras. O parser de itens
continua com as mesmas limitacoes de layout.

As comparacoes desativaram `salvar_em` para nao substituir a imagem de
depuracao existente. No codigo atual, `salvar_em=None`; habilite um caminho
de destino no script para inspecionar a imagem processada de uma nova leitura.

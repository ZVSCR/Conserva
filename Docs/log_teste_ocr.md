# Log Técnico: Avaliação e Diagnóstico do Módulo de OCR

* **Módulo:** Extração de Dados de Notas Fiscais (OCR)
* **Status:** Em Desenvolvimento / Fase de Testes
* **Objetivo:** Documentar o comportamento atual do motor de OCR, falhas identificadas durante a leitura de cupons fiscais e planos de ação para mitigação.

---

## 1. Pontos Positivos (Comportamento Esperado)

* **Precisão na Extração Numérica:** O motor demonstra alta acurácia na identificação de valores numéricos, incluindo números de ponto flutuante (*floats*), garantindo confiabilidade inicial na captura de preços e quantidades.
* **Resiliência a Baixa Qualidade de Imagem:** A extração mantém consistência mesmo em capturas com resolução mediana ou documentos levemente amassados. Isso indica que os gargalos atuais são decorrentes da configuração de parâmetros e pré-processamento, e não da qualidade da captura pelo usuário final.

---

## 2. Problemas Identificados (Gargalos Técnicos)

### 2.1. Substituição de Caracteres (Erros de Reconhecimento)
* **Descrição:** Ocorre confusão frequente entre caracteres morfologicamente semelhantes durante a leitura de texto (ex.: `"m"` interpretado como `"h"`, `"p"` como `"f"`).
* **Impacto:** Compromete a identificação correta das descrições dos produtos.

### 2.2. Falha na Leitura de Orientação (Metadados EXIF)
* **Descrição:** Imagens capturadas com metadados de orientação internos são exibidas corretamente na interface, mas processadas na orientação original (rotacionadas) pelo OCR. Alterações manuais na visualização não corrigem o eixo interno da matriz da imagem, exigindo rotação via código (solução inviável para o fluxo do usuário final).
* **Impacto:** Falha total ou parcial na leitura quando a imagem não está na orientação nativa esperada.

### 2.3. Ausência de Delimitação de Área (Recorte/Crop)
* **Descrição:** O OCR processa a imagem integralmente, capturando informações irrelevantes para o escopo atual (ex.: dados de pagamento, rodapés fiscais).
* **Impacto:** Aumento de ruído nos dados extraídos e maior complexidade no tratamento posterior.

### 2.4. Desestruturação de Layout (Quebra de Linhas e Colunas)
* **Descrição:** A saída textual não preserva a estrutura tabular (linhas e colunas) do cupom fiscal, fragmentando os dados de um mesmo item em múltiplas linhas desconexas.
* **Impacto:** Dificulta o *parsing* direto para estruturas padronizadas (como JSON) e compromete a legibilidade.

### 2.5. Heterogeneidade de Layouts entre Emissores
* **Descrição:** Variações estruturais entre notas fiscais de diferentes estabelecimentos (ordem das colunas, formatação de casas decimais, disposição de códigos).
* **Impacto:** Impede o uso de regras rígidas (ex.: *Regex* estático) para extração universal.

---

## 3. Plano de Ação e Soluções Propostas

| ID Problema | Ação Corretiva / Mitigação | Detalhes de Implementação |
| :--- | :--- | :--- |
| **2.1 (Caracteres)** | Ajuste de Pré-processamento / Conversão | Estudar e calibrar os parâmetros de pré-processamento de imagem (binarização, contraste) ou testar a conversão prévia da imagem para o formato PDF antes da submissão ao OCR. |
| **2.2 (Rotação)** | Normalização de Orientação | Implementar rotina no *backend*/*pipeline* para ler os metadados de orientação (EXIF) e aplicar a rotação física na imagem antes da execução do OCR. |
| **2.3 (Recorte)** | Delimitação de Região de Interesse (ROI) | Aplicar recorte automático no pré-processamento e/ou adicionar guias visuais (máscara de enquadramento) na interface de captura do usuário. |
| **2.4 (Layout)** | Pós-processamento Inteligente | Revisar os parâmetros de segmentação de página (PSM) do OCR e/ou utilizar um modelo de linguagem (LLM) para estruturar o texto bruto. |
| **2.5 (Variações)** | Normalização Semântica via Modelo | Submeter a saída do OCR a um modelo treinado/instruído para identificar entidades (produto, quantidade, valor) e padronizar o retorno no esquema JSON esperado, independentemente da ordem original. |

---

## 4. Evidência Técnica (Exemplo de Saída Bruta)

Abaixo, registra-se uma amostra real do retorno atual do OCR, evidenciando a fragmentação de linhas (item 2.4) e a substituição de caracteres (item 2.1):

```text
7896598301277
LTE PAST
otP ` GF
1L
2
W
W
1,000
Un
X
6,99
6,99
007
3381
CEBOLA HAc
kg
9
0
1,235.
Kg
X
5,99
7,39
```
# Conserva

## 1. Visão Geral

**Conserva** é uma ferramenta web de gerenciamento de estoque alimentício e sugestão de receitas, com foco em **consumo consciente** — reduzindo desperdício de alimentos e ajudando o usuário a entender melhor seus gastos com comida.

O usuário fotografa a nota fiscal de uma compra; o sistema reconhece os itens, quantidades e valores automaticamente, registra a despesa (como um extrato bancário) e atualiza o estoque. A partir do estoque disponível, o sistema sugere receitas, permite marcar o quanto de cada ingrediente foi consumido, e calcula o custo médio de cada refeição preparada.

## 2. Público-Alvo

- **Domicílios**: famílias/indivíduos que querem controlar gastos e reduzir desperdício.
- **Pequenos restaurantes / cozinhas comerciais**: controle de estoque de insumos e custo por prato.

> Nota: os dois públicos têm necessidades distintas (volume de itens, granularidade de custo, número de usuários simultâneos). Vale decidir se o MVP atende só um público inicialmente ou os dois com funcionalidades compartilhadas.

## 3. Funcionalidades Principais

### 3.1 Reconhecimento de Nota Fiscal (OCR)
- Upload/foto da nota de compra.
- Extração de: itens, quantidade, valor unitário, valor total, data, estabelecimento.
- Validação/edição manual pelo usuário antes de confirmar (para corrigir erros de OCR).

### 3.2 Extrato Financeiro
- Cada compra gera um registro tipo "transação bancária" (data, valor total, itens).
- Histórico navegável por período, categoria de item, estabelecimento.
- Relatórios simples: gasto mensal, gasto por categoria de alimento.

### 3.3 Gestão de Estoque
- Cada item comprado entra no estoque com quantidade e validade estimada (se aplicável).
- Baixa de estoque manual (ao usar em receita) ou por marcação direta.
- Alertas de itens perto do vencimento (consumo consciente).

### 3.4 Sugestão de Receitas
- Sugestão baseada nos itens disponíveis no estoque.
- Indicação de receitas que exigem poucos itens adicionais ("falta só X e Y").
- Ao preparar a receita, usuário marca quanto de cada ingrediente usou → baixa automática no estoque.

### 3.5 Custo por Refeição
- Cálculo do custo médio de cada receita/refeição preparada, com base no valor pago pelos ingredientes usados.
- Histórico de custo por refeição ao longo do tempo.

## 4. Arquitetura Proposta

### 4.1 Frontend
- **React + JavaScript**
- **HTML + CSS + Bootstrap** para estilização e responsividade

### 4.2 Backend
- A definir (não especificado ainda — sugestão: Node.js/Express, já que o stack já usa JS, mantendo a stack unificada)

### 4.3 Banco de Dados
Em aberto entre relacional (MySQL) e não-relacional (MongoDB). Pontos a considerar:

| Critério | MySQL | MongoDB |
|---|---|---|
| Estrutura dos dados | Boa p/ dados tabulares (transações, itens, estoque) | Boa p/ dados variáveis (receitas com ingredientes heterogêneos) |
| Hospedagem gratuita | PlanetScale (free tier limitado), Railway, Aiven | MongoDB Atlas (free tier 512MB) |
| Relacionamentos (usuário → compras → itens → receitas) | Nativo, com JOINs | Requer modelagem por referência ou embedding |

**Sugestão inicial**: como o domínio tem relações claras (usuário, compra, item, receita, estoque), um banco relacional tende a facilitar consultas como "gasto médio por refeição". MongoDB Atlas free tier é mais generoso, mas exige mais cuidado na modelagem. Vale prototipar com **MongoDB Atlas (free)** ou **Supabase (Postgres, free tier)** — este último também resolve autenticação de usuários de forma nativa.

### 4.4 Reconhecimento de Imagem (OCR)
Não mencionado explicitamente — funcionalidade crítica que precisa de definição técnica:
- Opções: Google Cloud Vision API, AWS Textract, Tesseract OCR (open-source, mais barato mas menos preciso), ou APIs de LLM multimodal (ex: Claude, GPT-4V) para extração estruturada.

## 5. Modelo de Sugestão de Receitas (em aberto)

Abordagens possíveis, do mais simples ao mais complexo:

1. **Matching direto de ingredientes** (regra simples): buscar receitas de um banco de dados/API onde todos ou a maioria dos ingredientes estão no estoque do usuário.
2. **Ranking por "distância" de ingredientes faltantes**: ordenar receitas pela quantidade de itens que faltam.
3. **Recomendação baseada em API de receitas externas** (ex: Spoonacular, TheMealDB) filtrando por ingredientes disponíveis.
4. **Modelo próprio (ML/LLM)**: usar um LLM para gerar receitas dinamicamente a partir da lista de ingredientes do estoque — mais flexível, mas requer custo de API e validação de qualidade/segurança alimentar.

**Recomendação para MVP**: começar com a abordagem 1 ou 2, usando uma API de receitas existente (evita ter que curar um banco de receitas do zero), e considerar geração via LLM como evolução futura.

## 6. Modelo de Dados (rascunho inicial)

```
Usuário
 ├── id, nome, email, tipo (doméstico/restaurante)

Compra
 ├── id, usuário_id, data, valor_total, estabelecimento

ItemComprado
 ├── id, compra_id, nome_item, quantidade, unidade, valor_unitário, validade_estimada

EstoqueItem
 ├── id, usuário_id, item_id, quantidade_disponível

Receita
 ├── id, nome, ingredientes[], modo_preparo, tempo_preparo

ReceitaPreparada
 ├── id, usuário_id, receita_id, data, itens_usados[], custo_total
```

## 7. Fluxo do Usuário (alto nível)

1. Usuário tira foto da nota → sistema extrai itens/valores.
2. Usuário confirma/corrige dados extraídos.
3. Sistema registra a compra no extrato e atualiza o estoque.
4. Sistema sugere receitas com base no estoque atual.
5. Usuário escolhe uma receita e marca os itens/quantidades usados.
6. Sistema baixa o estoque e calcula o custo da refeição.

## 8. Questões em Aberto

- [ ] Backend: qual framework/linguagem?
- [ ] Banco de dados: MySQL vs MongoDB (ou alternativa como Postgres/Supabase)?
- [ ] Serviço de OCR: qual usar, considerando custo e precisão?
- [ ] Modelo de sugestão de receitas: regras simples, API externa ou LLM?
- [ ] Autenticação de usuários: solução própria ou serviço (ex: Firebase Auth, Supabase Auth)?
- [ ] Escopo do MVP: atender domicílios e restaurantes simultaneamente ou focar em um público primeiro?
- [ ] Hospedagem gratuita do frontend/backend (ex: Vercel, Render, Railway)?

## 9. Próximos Passos

1. Definir escopo do MVP (funcionalidades mínimas viáveis).
2. Escolher stack de backend e banco de dados.
3. Prototipar o fluxo de OCR com poucas notas de teste.
4. Modelar o banco de dados com base no rascunho acima.
5. Escolher fonte de receitas (API externa) para o modelo de sugestão inicial.
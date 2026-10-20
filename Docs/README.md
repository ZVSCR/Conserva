# Documentação do Conserva

Esta documentação descreve o código presente no commit `89638ff` (19/10/2026). O [README principal](../README.md) apresenta a visão do produto e inclui funcionalidades planejadas; para saber o que está implementado, consulte as páginas abaixo e o código indicado nelas.

## Por onde começar

1. [Histórico de implementação](historico.md): marcos na ordem em que entraram na linha principal do Git.
2. [Modelo de dados](database/README.md): relações, arquivos SQL e índice das nove entidades.
3. [Arquitetura do backend](backend/arquitetura.md): fluxo das requisições e responsabilidades dos módulos.
4. [Estrutura do frontend](frontend/estrutura.md): páginas, componentes, navegação e acesso à API.

Cada página de entidade descreve **o esquema atual** e registra as alterações históricas relevantes. Datas e hashes apontam para commits; use `git show <hash>` para examinar uma mudança. A linha do tempo usa a ordem de integração da branch principal (`git log --first-parent --reverse`), pois commits de branches podem ter sido escritos antes de sua integração.

## 🛠️ Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:
* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (Versão LTS recomendada)
* Um gerenciador de pacotes (Este guia utiliza o **npm**)

---

## 🚀 Passo a Passo para Configuração

### 1. Clonar o Repositório
Abra o seu terminal na pasta onde deseja salvar o projeto e execute:
```bash
git clone https://github.com/SEU_USUARIO/ConservIA.git
cd ConservIA
```

### 2. Configurar o Frontend (React + Vite)
Abra um terminal e navegue até a pasta do frontend para instalar as dependências e iniciar o servidor de desenvolvimento:

1. **Acessar a pasta:**
   ```bash
   cd Frontend
   ```
2. **Instalar as dependências:**
   ```bash
   npm install
   ```
3. **Iniciar o servidor local:**
   ```bash
   npm run dev
   ```
   *O frontend estará disponível no endereço indicado no terminal (geralmente **http://localhost:5173**).*

### 3. Configurar o Backend
Abra um **segundo terminal** (mantenha o do frontend rodando) na raiz do projeto para configurar a API:

1. **Acessar a pasta:**
   ```bash
   cd Backend
   ```
2. **Instalar as dependências do servidor:**
   ```bash
   npm install
   ```
   *(Nota: Caso seu backend utilize outra tecnologia como Python, substitua pelo comando correspondente, ex: `pip install -r requirements.txt`)*
3. **Configurar Variáveis de Ambiente:**
   * Procure por um arquivo chamado `.env.example` ou siga as instruções da equipe.
   * Crie um arquivo `.env` nesta pasta e adicione as chaves necessárias (banco de dados, tokens de IA, etc.).
4. **Iniciar o servidor backend:**
   ```bash
   npm start
   ```
   *(Ou `npm run dev` / `python app.py` dependendo da sua tecnologia de backend).*

---

## ⚠️ Resolução de Problemas Comuns (Windows)

Se ao tentar rodar `npm install` ou `npm run dev` no Windows você receber o erro de **Script Bloqueado / UnauthorizedAccess**:

1. Abra o terminal **PowerShell** no seu computador.
2. Execute o comando abaixo para liberar a execução de scripts para o seu usuário:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. Digite `S` (Sim) e aperte **Enter**.
4. Reinicie o seu VS Code ou terminal e tente rodar o comando novamente.
   *Alternativamente, você pode usar o terminal **Command Prompt (CMD)**, que não possui esse bloqueio.*

---

## 📂 Organização do Repositório

```text
Conserva/
├── Backend/          # Código da API e regras de negócio
├── Frontend/         # Interface gráfica em React + Vite
└── .gitignore        # Arquivos protegidos e ignorados pelo Git
```


# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

# Inicializacao do projeto DrawCode

## 1. Pre-requisitos

- Node.js 20 ou superior
- npm 10 ou superior
- Docker Desktop em execucao

Validacao rapida:

```powershell
node -v
npm -v
docker -v
docker compose version
```

## 2. Instalar dependencias

Use `npm`. Este repositorio foi validado com esse fluxo.

```powershell
npm install
```

## 3. Criar o arquivo de ambiente

Crie um arquivo `.env` na raiz com base no `.env.example`.

Conteudo minimo:

```env
DATABASE_URL="postgresql://drawcode:drawcode_secret@localhost:5432/drawcode_db?schema=public"
AUTH_SECRET="troque-esta-chave-por-uma-string-segura"
```

Os provedores Google, Facebook e Twitter sao opcionais. Se voce nao preencher essas variaveis, o sistema continua funcionando com login por email e senha.

## 4. Subir o banco de dados

```powershell
docker compose up -d
```

Isso inicia:

- PostgreSQL em `localhost:5432`
- Adminer em `http://localhost:8080`

Credenciais do banco do `docker-compose.yml`:

- Usuario: `drawcode`
- Senha: `drawcode_secret`
- Banco: `drawcode_db`

## 5. Gerar o cliente Prisma

```powershell
npm run db:generate
```

## 6. Criar as tabelas

```powershell
npm run db:migrate -- --name init
```

Se ja existir migracao local e voce quiser apenas aplicar o schema, pode usar:

```powershell
npx prisma db push
```

## 7. Popular o banco com usuarios iniciais

```powershell
npm run db:seed
```

Usuarios criados pelo seed:

- Admin: `admin@drawcode.app` / `Admin@123`
- Usuario teste: `teste@drawcode.app` / `Teste@123`

## 8. Rodar o projeto

```powershell
npm run dev
```

Abra:

```text
http://localhost:3000
```

## 9. Comandos uteis

```powershell
npm run test
npm run lint
npm run build
```

## 10. Problema que causava erro na instalacao

O erro nao era a instalacao do Node.js. O bloqueio estava no `npm install` por conflito de dependencias entre `next-auth` e `nodemailer`.

Situacao corrigida neste repositorio:

- a dependencia `nodemailer` foi removida porque nao estava sendo usada
- o `package-lock.json` foi atualizado
- os provedores sociais agora so sao ativados se as variaveis de ambiente existirem

## 11. Se algo ainda falhar

Verifique nesta ordem:

1. Se o Docker esta aberto.
2. Se o arquivo `.env` existe na raiz.
3. Se a `DATABASE_URL` aponta para o mesmo usuario, senha e banco do `docker-compose.yml`.
4. Se a porta `5432` nao esta ocupada por outro PostgreSQL.
5. Se voce rodou `npm install`, `npm run db:generate` e `npm run db:migrate`.

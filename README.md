# DataTree 2.0 — pacote completo

Aplicação full-stack com React + Vite, Node.js + Express e SQLite. Este pacote é independente: contém frontend, backend, assets e instruções; não depende de arquivos de uma versão anterior.

## Funcionalidades incluídas
- Cadastro e login com autenticação JWT.
- Feed, publicações, curtidas e comentários.
- Busca e visualização de perfis públicos, seguir/deixar de seguir.
- Conversas privadas e envio de mensagens.
- Notificações de interações, com atualização periódica.
- Upload e compartilhamento de arquivos com visibilidade.
- Mapa com usuários que optaram por aparecer nele.

## Início rápido
Leia `COMECE-AQUI.txt` para o passo a passo completo. Resumo:

Terminal 1:
```bash
cd server
npm install
npm run dev
```

Terminal 2:
```bash
cd client
npm install
npm run dev
```

Acesse `http://localhost:5173`. A API fica em `http://localhost:3001` e o teste de saúde é `http://localhost:3001/api/health`.

## Correções desta revisão
- Corrigida referência ausente no perfil público que podia derrubar a renderização ao abrir perfis com publicações.
- Mapa agora trata falhas da API sem gerar rejeição não tratada.
- Cadastro trata colisões de email/usuário e login normaliza espaços do email.
- Pré-visualização local de imagens antes do upload.
- Imagens anexadas a publicações aparecem no feed com rota autenticada e respeitando as permissões do arquivo.
- Mantidos os recursos existentes; nenhuma funcionalidade nova foi adicionada.

## Contas de demonstração
- Ana: `ana@datatree.local` — `123456`
- Lucas: `lucas@datatree.local` — `123456`

As contas são criadas automaticamente apenas quando o banco SQLite ainda não possui usuários.

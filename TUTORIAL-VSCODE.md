# DataTree 2.0 — tutorial completo para VS Code (Linux/Zorin OS)

Este tutorial parte do ZIP `DataTree-v2.zip`.

## 1. O que você precisa

- VS Code
- Node.js 18.18 ou superior
- npm (vem com o Node.js)
- Um navegador, como Chrome ou Firefox

**Recomendação:** Node.js 20 ou 22 LTS. Esta versão do DataTree também foi preparada para Node 18.18+.

### Conferir Node e npm

Abra um terminal e rode:

```bash
node -v
npm -v
```

Se aparecer algo parecido com:

```text
v20.x.x
10.x.x
```

está tudo certo.

Se o comando `node` não existir, instale/atualize o Node antes de continuar.

---

# 2. Extrair o DataTree

Extraia o ZIP para um local fácil, por exemplo:

```text
Documentos/
└── DataTree-v2/
    ├── client/
    ├── server/
    ├── README.md
    └── TUTORIAL-VSCODE.md
```

**Muito importante:** a pasta que você abrir no VS Code deve ser `DataTree-v2`, e dentro dela precisam aparecer `client` e `server`.

---

# 3. Abrir corretamente no VS Code

No VS Code:

1. Clique em **File / Arquivo**.
2. Clique em **Open Folder / Abrir Pasta**.
3. Selecione `DataTree-v2`.
4. No Explorer do lado esquerdo você deve enxergar:

```text
client
server
README.md
TUTORIAL-VSCODE.md
```

### Se `cd server` disser que o diretório não existe

Isso quase sempre significa que o terminal está na pasta errada.

No terminal, rode:

```bash
pwd
```

Depois:

```bash
ls
```

Você precisa ver `client` e `server` na saída.

Se não aparecerem, volte ao VS Code e abra a pasta `DataTree-v2` corretamente.

---

# 4. Instalar as dependências do BACKEND

No VS Code:

1. Abra **Terminal > New Terminal**.
2. Rode:

```bash
cd server
```

3. Confirme que entrou na pasta:

```bash
pwd
```

4. Agora instale:

```bash
npm install
```

Aguarde terminar.

Depois rode:

```bash
npm run dev
```

Você deverá ver algo parecido com:

```text
DataTree API 2.0 rodando em http://localhost:3001
```

**Não feche esse terminal.**

---

# 5. Testar o backend

Abra o navegador e acesse:

```text
http://localhost:3001/api/health
```

Se estiver funcionando, deverá aparecer algo parecido com:

```json
{
  "ok": true,
  "service": "datatree-api",
  "version": "2.0.0"
}
```

Isso significa que o servidor está vivo.

---

# 6. Instalar o FRONTEND

Agora abra um **segundo terminal** no VS Code.

Não pare o primeiro terminal.

No segundo terminal:

```bash
cd client
```

Depois:

```bash
npm install
```

Quando terminar:

```bash
npm run dev
```

O Vite deverá informar algo como:

```text
Local: http://localhost:5173/
```

---

# 7. Abrir o DataTree

Abra:

```text
http://localhost:5173
```

Agora você deverá ver a tela de login usando a nova logo `data.tree`.

---

# 8. Entrar na conta de demonstração

Use:

```text
Email: ana@datatree.local
Senha: 123456
```

Existe também:

```text
Email: lucas@datatree.local
Senha: 123456
```

As duas contas já começam com algumas conexões e publicações para você testar.

---

# 9. Como testar o DataTree inteiro

Faça os testes nesta ordem.

## Teste 1 — Cadastro

Saia da conta e clique em **Criar uma conta**.

Crie um usuário novo.

Depois confirme que o DataTree entra automaticamente na conta criada.

---

## Teste 2 — Perfil

Abra **Meu perfil**.

Clique em **Editar perfil**.

Você pode alterar:

- nome
- bio
- profissão
- cidade
- site
- URL da foto de perfil
- perfil público/privado
- aparecer no mapa
- latitude
- longitude

Salve e atualize a página.

As alterações continuam salvas porque agora existe um banco SQLite.

---

## Teste 3 — Feed

Entre em **Feed**.

Digite alguma coisa no campo:

```text
Meu primeiro post no DataTree!
```

Clique em **Publicar**.

O post deve aparecer no feed.

---

## Teste 4 — Curtida

Clique no coração de uma publicação.

A contagem deve mudar.

Clique novamente para retirar a curtida.

---

## Teste 5 — Comentário

Clique no botão de comentários.

Digite um comentário e pressione Enter ou clique em Enviar.

O comentário deve ficar salvo.

---

# 10. Testar seguidores

Vá em **Explorar**.

Pesquise outro usuário.

Clique em:

```text
Seguir
```

O botão deve mudar para:

```text
Seguindo
```

Clique novamente para deixar de seguir.

---

# 11. Testar arquivos

Abra:

```text
Arquivos
```

Clique em:

```text
+ Enviar arquivo
```

Escolha qualquer arquivo pequeno para começar.

Você poderá definir:

```text
Somente eu
Seguidores
Público
```

Também pode adicionar:

- pasta
- tags
- descrição

O arquivo será armazenado localmente em:

```text
server/uploads/
```

E os dados dele ficam no banco:

```text
server/data/datatree.sqlite
```

---

# 12. Testar personalização de arquivos

Depois de enviar um arquivo:

1. Clique no botão de edição `✎`.
2. Troque o nome.
3. Troque a pasta.
4. Altere as tags.
5. Altere a descrição.
6. Altere a privacidade.
7. Salve.

---

# 13. Testar download

Clique no botão `↓` do arquivo.

O backend verifica se você possui permissão antes de entregar o arquivo.

Isso é importante: os arquivos não ficam expostos diretamente por uma pasta pública do servidor.

---

# 14. Testar arquivo dentro de publicação

Volte ao Feed.

Na caixa de publicação, escolha um arquivo no seletor:

```text
＋ Anexar arquivo
```

Escreva uma mensagem e publique.

A publicação deverá aparecer com o arquivo anexado.

---

# 15. Testar mensagens

A melhor forma é usar dois usuários.

### Terminal/browser 1
Entre com:

```text
ana@datatree.local
123456
```

### Browser 2 / janela anônima
Entre com:

```text
lucas@datatree.local
123456
```

Abra **Mensagens**.

Envie uma mensagem.

Depois abra a outra conta e veja a mensagem.

---

# 16. Testar notificações

As ações de seguir, curtir, comentar e enviar mensagem geram notificações quando fazem sentido.

Abra:

```text
♡
```

no topo da aplicação.

---

# 17. Testar o mapa

Entre em:

```text
Meu perfil > Editar perfil
```

Ative:

```text
Mostrar no mapa
```

Informe latitude e longitude.

Exemplo para Natal/RN:

```text
Latitude: -5.7945
Longitude: -35.2110
```

Salve.

Depois abra:

```text
Mapa
```

O perfil poderá aparecer no mapa visual quando estiver público e com localização ativa.

---

# 18. Como desligar o DataTree

Você terá dois terminais.

No terminal do backend:

```text
Ctrl + C
```

No terminal do frontend:

```text
Ctrl + C
```

Os dados continuam salvos.

---

# 19. Como abrir novamente outro dia

Abra a pasta `DataTree-v2` no VS Code.

Terminal 1:

```bash
cd server
npm run dev
```

Terminal 2:

```bash
cd client
npm run dev
```

Depois abra:

```text
http://localhost:5173
```

Você **não precisa executar `npm install` toda vez**. Só execute novamente se as dependências forem alteradas ou se a pasta `node_modules` tiver sido removida.

---

# 20. O que NÃO fazer

Não execute:

```bash
cd client
npm run dev
cd server
npm run dev
```

no mesmo terminal esperando que os dois servidores fiquem ativos.

O primeiro `npm run dev` fica executando continuamente.

Use dois terminais:

```text
TERMINAL 1 → server
TERMINAL 2 → client
```

---

# 21. Estrutura importante do projeto

```text
DataTree-v2/
│
├── client/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── style.css
│   │   └── logo.jpeg
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   └── server.js
│   ├── uploads/
│   ├── data/
│   │   └── datatree.sqlite   ← criado automaticamente
│   ├── package.json
│   └── .env.example
│
├── README.md
├── START-HERE.txt
└── TUTORIAL-VSCODE.md
```

---

# 22. Se aparecer "localhost:5173 não existe"

Primeiro confira o terminal do frontend.

Ele precisa estar mostrando o Vite ativo e uma URL como:

```text
http://localhost:5173/
```

Se não estiver, entre em:

```bash
cd client
npm run dev
```

Se aparecer outro endereço, use exatamente o endereço informado pelo Vite.

---

# 23. Se aparecer "cd: client: No such file or directory"

Rode:

```bash
pwd
ls
```

Você precisa estar na pasta que contém:

```text
client
server
```

No VS Code, a forma mais fácil de resolver é:

**File → Open Folder → DataTree-v2**

Depois abra um novo terminal.

---

# 24. Se a porta estiver ocupada

Backend padrão:

```text
3001
```

Frontend padrão:

```text
5173
```

Se o frontend estiver usando outra porta, o Vite informará no terminal.

Se o backend estiver ocupado, encerre o processo que está usando a porta ou altere `PORT` no arquivo `.env` do servidor.

---

# 25. O que esta versão já faz de verdade

Ao contrário da versão anterior, os principais dados não são arrays temporários em JavaScript.

O DataTree 2.0 possui:

- banco SQLite
- usuários persistentes
- autenticação
- posts persistentes
- likes persistentes
- comentários persistentes
- seguidores persistentes
- mensagens persistentes
- notificações persistentes
- arquivos persistentes
- permissões de arquivos
- metadados dos arquivos
- perfil persistente
- configurações de privacidade

Ou seja: reiniciar o backend não apaga os dados.

---

# 26. Limitação importante desta versão

O armazenamento de arquivos é local ao computador onde o servidor está rodando.

Isso é ótimo para desenvolver e testar o DataTree, mas ainda não é uma arquitetura de produção.

Para colocar o DataTree na internet posteriormente, o próximo passo recomendado é migrar os arquivos para um storage como S3, Cloudflare R2 ou Supabase Storage e colocar o backend e banco em infraestrutura própria.

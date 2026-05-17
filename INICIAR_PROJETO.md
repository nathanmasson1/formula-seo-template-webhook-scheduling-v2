# Como inicializar este projeto

Este projeto e um site Astro. Use estes passos sempre que precisar subir em localhost.

## 1. Entre na pasta do projeto

```powershell
cd C:\Users\NATHAN-PC\Desktop\formulaseo3\tema-formula-seo-v2-main
```

## 2. Confira o arquivo .env

Na raiz do projeto deve existir um arquivo `.env` com:

```env
ADMIN_SECRET=123456
```

Se o arquivo nao existir, crie-o com esse conteudo.

## 3. Instale as dependencias

Use este comando apenas quando `node_modules` nao existir, ou depois de mudancas no `package-lock.json`:

```powershell
npm install
```

## 4. Rode o servidor local

Comando recomendado:

```powershell
npm run dev -- --host 127.0.0.1 --port 4321
```

Depois acesse:

```text
http://127.0.0.1:4321
```

## 5. Se estiver usando IA/Codex no Windows

Quando for iniciar em background, use PowerShell com o caminho completo do npm para evitar erro por causa do espaco em `Program Files`:

```powershell
Start-Process -FilePath 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' -ArgumentList @('-NoProfile','-Command','& ''C:\Program Files\nodejs\npm.cmd'' run dev -- --host 127.0.0.1 --port 4321') -WorkingDirectory 'C:\Users\NATHAN-PC\Desktop\formulaseo3\tema-formula-seo-v2-main' -WindowStyle Hidden
```

Para verificar se subiu:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4321
```

Resposta esperada:

```text
StatusCode: 200
```

## 6. Se a porta 4321 ja estiver em uso

Verifique o processo:

```powershell
Get-NetTCPConnection -LocalPort 4321 -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess
```

Se precisar usar outra porta:

```powershell
npm run dev -- --host 127.0.0.1 --port 4322
```

E acesse:

```text
http://127.0.0.1:4322
```

## Observacoes rapidas

- Script principal: `npm run dev`
- Framework: Astro
- Porta padrao usada neste projeto: `4321`
- URL local padrao: `http://127.0.0.1:4321`
- Senha/segredo local atual: `ADMIN_SECRET=123456`

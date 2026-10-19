# Guia de Deploy no Portainer, GitOps e Cloudflare (Shiori Web)

Este documento fornece as instruções oficiais para realizar o deploy contínuo do **Shiori Web** (front-end SPA) utilizando **Portainer CE**, esteira **GitOps** com GitHub Actions e exposição segura através do **Cloudflare** no subdomínio oficial `shiori.wnzk.dev.br`.

---

## 1. Visão Geral da Arquitetura

O Shiori Web é construído como uma Single Page Application (SPA) com React 19, TypeScript e Vite, servida em produção por uma imagem leve e otimizada de **Nginx Alpine**.

### Destaques do Empacotamento
- **Multi-Stage Build:** Compilação com Node.js 22 e distribuição final estática em Nginx Alpine (< 25MB).
- **Injeção Dinâmica em Tempo de Execução (`env-config.js`):** A URL da API (`VITE_API_BASE_URL`) é injetada no container no momento da inicialização pelo `docker-entrypoint.sh`. Não é necessário recompilar a imagem Docker para apontar para um novo endpoint de API.
- **Roteamento SPA Completo:** O `nginx.conf` inclui a diretiva `try_files $uri $uri/ /index.html;`, garantindo que qualquer rota interna recarregada no navegador (`/catalogo`, `/estante`, `/perfil`) responda perfeitamente sem erros 404.
- **Cache Estratégico:** Assets versionados com hash possuem cache longo (`Cache-Control: public, immutable`), enquanto arquivos de ambiente e páginas HTML possuem validação contínua.

---

## 2. ⚠️ Diretriz de Segurança e Acesso Operacional

> [!CAUTION]
> **POLÍTICA ESTRITA DE ACESSO OPERACIONAL AO SERVIDOR DE PRODUÇÃO:**
>
> 1. **Ambiente de Produção Gerenciado por GitOps:** O ambiente de produção opera sob automação estrita via **Portainer**.
> 2. **Acesso SSH Restrito:** O acesso direto via SSH ao servidor (através da malha de rede privada Tailscale no host `ubuntu@100.127.79.49`) é **estritamente restrito a fins de auditoria de infraestrutura, inspeção de logs e gerenciamento de containers** no diretório de serviços `/srv/services/shiori`.
> 3. **Proibição de Alterações Manuais:** É terminantemente proibido editar código-fonte, alterar assets estáticos ou aplicar correções manuais diretamente no servidor de produção. **Toda e qualquer alteração de código deve ser submetida via commit no repositório GitHub e passar obrigatoriamente pelos testes automatizados e pela esteira do GitHub Actions.**

---

## 3. Passo a Passo: Criação da Stack no Portainer

O Shiori Web roda como uma Stack autônoma no Portainer, consumindo a imagem pública do GitHub Container Registry (`ghcr.io/wiltongabriel/shiori-web:latest`).

### Método Recomendado: GitOps (Repositório Git)
1. Acesse o seu painel do **Portainer**.
2. No menu lateral esquerdo, selecione o ambiente Docker e clique em **Stacks** -> **Add stack**.
3. Defina o nome da Stack como `shiori-web`.
4. Em **Build method**, selecione **Repository**.
5. Preencha os campos do repositório:
   - **Repository URL:** `https://github.com/wiltongabriel/shiori-web.git`
   - **Repository reference:** `refs/heads/main`
   - **Compose path:** `docker-compose.yml`
6. Ative **Automatic updates** (Webhook ou Polling periódicos de 5 minutos) para garantir atualizações automáticas via GitOps a cada novo push no repositório.

### Método Alternativo: Web Editor
Se preferir colar o compose diretamente, selecione **Web editor** e utilize o conteúdo abaixo:

```yaml
services:
  shiori-web:
    image: ghcr.io/wiltongabriel/shiori-web:latest
    container_name: shiori-web
    restart: unless-stopped
    ports:
      - "${PORT:-3000}:80"
    environment:
      - VITE_API_BASE_URL=${VITE_API_BASE_URL}
    networks:
      - proxy_network
      - default
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=proxy_network"
      - "traefik.http.routers.shiori-web.rule=Host(`shiori.wnzk.dev.br`)"
      - "traefik.http.routers.shiori-web.entrypoints=websecure"
      - "traefik.http.routers.shiori-web.tls=true"
      - "traefik.http.routers.shiori-web.tls.certresolver=leresolver"
      - "traefik.http.routers.shiori-web-http.rule=Host(`shiori.wnzk.dev.br`)"
      - "traefik.http.routers.shiori-web-http.entrypoints=web"
      - "traefik.http.services.shiori-web.loadbalancer.server.port=80"

networks:
  proxy_network:
    external: true
```

---

## 3. Configuração das Variáveis de Ambiente (`.env`) no Portainer

Na seção **Environment variables** da Stack no Portainer, adicione as seguintes variáveis:

```env
PORT=3000
VITE_API_BASE_URL=http://100.127.79.49:8088
```

> **Nota de Produção:**
> - `PORT`: Porta exposta no host onde o container atenderá o tráfego HTTP.
> - `VITE_API_BASE_URL`: URL pública ou de rede acessível pelo navegador do usuário final para dialogar com a Shiori API. Se a API estiver exposta com SSL/HTTPS em subdomínio próprio (ex: `https://api.wnzk.dev.br`), informe essa URL.

Após preencher, clique em **Deploy the stack**.

---

## 4. Configuração do Subdomínio no Cloudflare (`shiori.wnzk.dev.br`)

Para disponibilizar o front-end sob o subdomínio oficial `shiori.wnzk.dev.br` com certificado SSL/TLS automático:

### Opção A: Cloudflare Tunnel (Zero Trust) - Mais Seguro
1. Acesse o **Cloudflare Zero Trust Dashboard** -> **Networks** -> **Tunnels**.
2. No seu túnel ativo, crie um novo **Public Hostname**:
   - **Subdomain:** `shiori`
   - **Domain:** `wnzk.dev.br`
   - **Service Type:** `HTTP`
   - **URL:** `localhost:3000` (ou `<IP_DA_MAQUINA>:3000`)
3. Salve o hostname. O Cloudflare gerenciará a borda HTTPS, proteção contra DDoS e o roteamento diretamente para a porta do container.

### Opção B: Cloudflare Proxy DNS (A / CNAME Record)
1. No painel DNS da sua zona `wnzk.dev.br`:
   - Crie uma entrada do tipo `A` apontando `shiori` para o IP público do seu servidor (com proxy ativado / nuvem laranja).
2. No servidor ou Proxy Reverso frontal (Nginx Proxy Manager, Traefik ou Caddy):
   - Encaminhe as requisições com host `shiori.wnzk.dev.br` para `http://localhost:3000`.
3. No Cloudflare SSL/TLS, configure o modo como **Full** ou **Full (Strict)**.

---

## 5. Validação e Testes de Deploy

Após a inicialização do container:
1. Acesse `http://<IP_DO_SERVIDOR>:3000` ou `https://shiori.wnzk.dev.br`.
2. Abra as Ferramentas de Desenvolvedor (F12) -> aba **Console**:
   - Verifique se a aplicação carregou sem erros de CORS ou certificados.
   - Navegue para `/catalogo` e recarregue a página (F5) para atestar que o Nginx SPA fallback está ativo.
3. Acesse `https://shiori.wnzk.dev.br/env-config.js` no navegador:
   - O arquivo deve retornar o JSON com o valor configurado na variável `VITE_API_BASE_URL`.

---

## 6. Atualização e Ciclo de Vida da Imagem

Sempre que um novo commit for enviado para o branch `main` do repositório `shiori-web`:
1. O GitHub Actions (`.github/workflows/docker-publish.yml`) compila os assets, valida lint e testes, e gera a imagem Docker multi-arquitetura (`linux/amd64` e `linux/arm64`).
2. A imagem é publicada automaticamente no GitHub Container Registry (`ghcr.io/wiltongabriel/shiori-web:latest`).
3. No Portainer, se o GitOps estiver com Webhook configurado, a stack recria o container automaticamente. Para atualização manual, basta acessar a Stack, clicar em **Update the stack** e marcar **Re-pull image**.

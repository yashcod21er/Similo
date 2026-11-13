# Deploying Similo on Oracle Cloud (Always Free)

This guide puts the whole product on one free Oracle Cloud server: the website, the API, the
monitoring worker, the AI service and Redis. MongoDB stays on Atlas.

> **Status: not yet tested on a real Oracle server.** The files in `deploy/oracle/` were
> written and checked on a Windows PC without Docker. Expect to fix small things on the first
> run, and update this page when it works.

## What runs where

```
Internet ── 80/443 ──> web (Caddy: HTTPS + the React site)
                         └─ /api/* ──> api (Express)
                                         ├──> redis  (job queue)
                                         └──> MongoDB Atlas
                       worker (scans + page capture in Chromium)
                         ├──> redis, MongoDB Atlas
                         └──> ai (FastAPI: text, logo and OCR models)
```

Only `web` is reachable from the internet. The other containers talk on a private Docker
network. One address serves both the site and `/api`, so sign-in cookies work.

| Container | Memory it needs | Notes |
|---|---|---|
| `ai` | about 1 GB | Models are downloaded when the image is built |
| `worker` | about 1 GB | One Chromium browser per analysis |
| `api`, `web`, `redis` | under 500 MB together | |

A server with 2 CPUs and 12 GB of memory is plenty.

## Before you start

- **A card is needed to sign up.** Oracle checks it but does not charge for Always Free
  resources. Stay on the free account; do not click "Upgrade to Pay As You Go".
- **Free ARM servers are often out of stock.** If you see "Out of capacity", try another
  availability domain, try again later, or pick a different home region at sign-up (the home
  region cannot be changed afterwards).
- **Oracle may reclaim idle free servers** (very low CPU use for 7 days). The scheduled scans
  normally keep it busy enough, but check the server before a demo.

## Step 1: create the server

1. Sign up at <https://www.oracle.com/cloud/free/> and choose a home region near you.
2. In the console: **Compute → Instances → Create instance**.
3. **Image:** Canonical Ubuntu 24.04.
4. **Shape:** Ampere → `VM.Standard.A1.Flex`, 2 OCPUs, 12 GB memory (the free allowance is
   4 OCPUs and 24 GB in total).
5. **Networking:** keep the defaults and make sure "Assign a public IPv4 address" is on.
6. **SSH keys:** choose "Generate a key pair for me" and **download the private key**.
7. **Boot volume:** 50 GB.
8. Create it and note the **public IP address**.

## Step 2: open ports 80 and 443 in Oracle's firewall

1. Open the instance → its **Subnet** → the **Default Security List**.
2. **Add Ingress Rules**, source `0.0.0.0/0`, protocol TCP, destination port `80`.
3. Add the same rule for port `443`.

(The server has a second firewall of its own; `setup.sh` opens it in step 5.)

## Step 3: get a free address

HTTPS needs a name, not a bare IP address.

1. Sign in at <https://www.duckdns.org> and create a subdomain, for example `similo-yash`.
2. Set its IP to the server's public IP.
3. Your address is now `similo-yash.duckdns.org`.

## Step 4: allow the server in MongoDB Atlas

Atlas → **Network Access → Add IP Address** → the server's public IP.

## Step 5: prepare the server

From your PC (PowerShell), using the key you downloaded:

```powershell
ssh -i C:\path\to\your-key.key ubuntu@YOUR_SERVER_IP
```

On the server:

```bash
git clone https://github.com/yashcod21er/Similo.git
cd Similo
bash deploy/oracle/setup.sh
exit
```

Connect again with the same `ssh` command (this lets your user run Docker).

## Step 6: add the settings

```bash
cd Similo/deploy/oracle
cp .env.example .env
openssl rand -hex 32     # run twice: one value for JWT_SECRET, one for AI_SERVICE_TOKEN
nano .env
```

Fill in `SITE_DOMAIN` (for example `similo-yash.duckdns.org`), `MONGODB_URI`, `JWT_SECRET`
and `AI_SERVICE_TOKEN`. Save with Ctrl+O, Enter, then Ctrl+X.

## Step 7: start everything

```bash
docker compose up -d --build
```

The first build takes 10 to 20 minutes (it downloads the AI models and the browser image).
Then check:

```bash
docker compose ps                 # every service should be "running" or "healthy"
docker compose logs -f worker     # Ctrl+C to stop watching
```

Open `https://YOUR_DOMAIN` in a browser. Sign in, open a brand and start a scan; findings
should get an AI score within a few minutes.

## Updating after a new commit

```bash
cd Similo && git pull
cd deploy/oracle && docker compose up -d --build
```

## If something goes wrong

| Problem | What to check |
|---|---|
| The site does not open | Step 2 rules exist; the DuckDNS name shows the right IP; `docker compose logs web` |
| Certificate error | The name must point at the server before the first start. Fix it, then `docker compose restart web` |
| API will not start | `docker compose logs api` names the missing or invalid setting |
| "Database not reachable" | Step 4: the server's IP is in the Atlas access list |
| Findings say "the capture browser failed" | Chromium's sandbox is blocked by the host. Run `sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0`, then `docker compose restart worker`. To keep it after a reboot, put the setting in `/etc/sysctl.d/60-similo.conf` |
| AI image build fails at the model step | A model could not be downloaded or loaded; run the build again and read the last lines |

## Security notes

- `deploy/oracle/.env` on the server holds the secrets. It is git-ignored; never commit it.
- Redis, the API and the AI service have no public ports.
- The worker opens untrusted pages. It runs as a non-root user, with Chromium's sandbox on
  (`seccomp-chromium.json` is Playwright's published profile) and behind the SSRF guard proxy.
- The DuckDNS name and Oracle's free tier are fine for a demo, not for production.

# ⚔️ Fantasy Bot Premium

Bot Discord complet avec thème MMORPG Fantasy — écrit en Discord.js v14, Prisma + PostgreSQL, Node.js 18+.

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Pré-requis](#pré-requis)
- [Installation locale](#installation-locale)
- [Variables d'environnement](#variables-denvironnement)
- [Déploiement Railway](#déploiement-railway)
- [Déploiement Render](#déploiement-render)
- [Déploiement Fly.io](#déploiement-flyio)
- [Commandes](#commandes)
- [Architecture](#architecture)
- [Checklist de démarrage](#checklist-de-démarrage)

---

## Fonctionnalités

| Catégorie | Description |
|-----------|-------------|
| 🎉 **Giveaways** | Création, gestion, reroll, pause/reprise — entrées pondérées |
| 🔨 **Modération** | Ban, kick, mute, timeout, warn, purge, lock, slowmode, logs |
| 🎵 **Musique** | Lecture YouTube/Spotify, file d'attente, loop, volume, shuffle |
| 📨 **Invitations** | Suivi des invitations, leaderboard, anti-fakes |
| 👋 **Welcome** | Message de bienvenue configurable, rôle automatique |
| 📜 **Règlement** | Embed de règlement avec bouton d'acceptation et attribution de rôle |
| 💰 **Économie** | Monnaie virtuelle, récompenses journalières, boutique, inventaire |
| 🏆 **XP/Niveaux** | Système d'expérience, rôles de niveau automatiques |
| 🎪 **Communauté** | Sondages, suggestions, tickets, profils |
| 🎲 **Fun** | Pile ou face, dé, boule 8, mèmes |
| 🛠️ **Admin** | Config serveur, annonces, embed builder, DM en masse, backup |
| 📊 **Info** | Infos utilisateur, serveur, rôle, avatar |

---

## Pré-requis

- **Node.js** 18 ou supérieur
- **PostgreSQL** 14+ (local, Railway, Render, Supabase…)
- **FFmpeg** installé et accessible dans le PATH (pour la musique)
- Un **bot Discord** créé sur [discord.com/developers](https://discord.com/developers/applications)

---

## Installation locale

```bash
# 1. Cloner le dépôt
git clone https://github.com/votre-user/discord-bot-fantasy.git
cd discord-bot-fantasy

# 2. Installer les dépendances
npm install

# 3. Copier et remplir les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 4. Générer le client Prisma et appliquer le schéma
npx prisma generate
npx prisma db push

# 5. Déployer les slash commands
node src/commands/deploy.js

# 6. Démarrer le bot
npm start
```

En développement avec rechargement automatique :

```bash
npm run dev
```

---

## Variables d'environnement

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `DISCORD_TOKEN` | Token du bot Discord | ✅ |
| `CLIENT_ID` | ID de l'application Discord | ✅ |
| `GUILD_ID` | ID du serveur (pour déploiement local rapide) | ✅ |
| `DATABASE_URL` | URL PostgreSQL (`postgresql://...`) | ✅ |
| `NODE_ENV` | `development` ou `production` | ✅ |
| `LOG_LEVEL` | Niveau de log Winston (`info`, `debug`, `warn`) | ❌ |

Exemple `.env` :

```env
DISCORD_TOKEN=your_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here
DATABASE_URL=postgresql://user:password@localhost:5432/fantasybot
NODE_ENV=development
LOG_LEVEL=info
```

---

## Déploiement Railway

### Méthode 1 — Interface Railway

1. Créer un projet sur [railway.app](https://railway.app)
2. **Add Service → GitHub Repo** et sélectionner votre dépôt
3. **Add Service → PostgreSQL** — Railway fournit `DATABASE_URL` automatiquement
4. Dans les variables du service bot, ajouter :
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - `GUILD_ID`
   - `NODE_ENV=production`
5. Railway détecte `railway.json` et utilise la commande de démarrage configurée
6. Le premier déploiement exécute `npx prisma generate && npx prisma db push && node src/index.js`

### Méthode 2 — Railway CLI

```bash
npm install -g @railway/cli
railway login
railway init
railway add --plugin postgresql
railway variables set DISCORD_TOKEN=... CLIENT_ID=... GUILD_ID=...
railway up
```

> **Note :** Pour déployer les slash commands en production, lancer une seule fois :
> `railway run node src/commands/deploy.js`

---

## Déploiement Render

1. Créer un compte sur [render.com](https://render.com)
2. **New → Web Service** → connecter votre dépôt GitHub
3. Paramètres :
   - **Build Command :** `npm install && npx prisma generate && npx prisma db push`
   - **Start Command :** `node src/index.js`
   - **Instance type :** Free ou Starter
4. **New → PostgreSQL** dans le même projet, copier l'URL interne
5. Variables d'environnement : ajouter `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`, `DATABASE_URL`, `NODE_ENV=production`
6. Déployer

> **Attention Render Free :** les instances s'endorment après 15 min d'inactivité. Utilisez une instance payante ou Render Cron pour garder le bot actif.

---

## Déploiement Fly.io

```bash
# Installer Fly CLI
curl -L https://fly.io/install.sh | sh
fly auth login

# Initialiser l'app
fly launch --no-deploy

# Créer une base PostgreSQL Fly
fly postgres create --name fantasybot-db
fly postgres attach fantasybot-db

# Configurer les secrets
fly secrets set DISCORD_TOKEN=... CLIENT_ID=... GUILD_ID=... NODE_ENV=production

# Déployer
fly deploy
```

`fly.toml` (généré automatiquement, adapter si besoin) :

```toml
app = "fantasybot"
primary_region = "cdg"

[build]

[env]
  NODE_ENV = "production"

[[services]]
  internal_port = 3000
  protocol = "tcp"
```

> Le bot n'expose pas de port HTTP par défaut. Retirer la section `[[services]]` du `fly.toml` si vous n'avez pas de healthcheck HTTP.

---

## Commandes

### 🎉 Giveaway

| Commande | Description |
|----------|-------------|
| `/giveaway create` | Créer un nouveau giveaway |
| `/giveaway end` | Terminer un giveaway immédiatement |
| `/giveaway reroll` | Retirer un nouveau gagnant |
| `/giveaway cancel` | Annuler un giveaway |
| `/giveaway list` | Lister les giveaways actifs |
| `/giveaway info` | Infos sur un giveaway |
| `/giveaway pause` | Mettre en pause |
| `/giveaway resume` | Reprendre |

### 🔨 Modération

| Commande | Description |
|----------|-------------|
| `/ban` | Bannir un membre |
| `/unban` | Débannir un utilisateur |
| `/softban` | Softban (ban + unban pour purger les messages) |
| `/kick` | Expulser un membre |
| `/mute` | Couper le micro d'un membre |
| `/unmute` | Rétablir le micro |
| `/timeout` | Mettre en timeout |
| `/warn` | Avertir un membre |
| `/warnings` | Voir les avertissements |
| `/clearwarns` | Supprimer les avertissements |
| `/purge` | Supprimer des messages en masse |
| `/lock` | Verrouiller un salon |
| `/unlock` | Déverrouiller un salon |
| `/slowmode` | Définir le slowmode |
| `/nick` | Changer le surnom |
| `/modlogs` | Voir les logs de modération |
| `/report` | Signaler un membre |

### 🎵 Musique

| Commande | Description |
|----------|-------------|
| `/play` | Jouer une musique (URL ou recherche) |
| `/pause` | Mettre en pause |
| `/resume` | Reprendre la lecture |
| `/skip` | Passer à la suivante |
| `/stop` | Arrêter et vider la file |
| `/queue` | Afficher la file d'attente |
| `/nowplaying` | Musique en cours |
| `/volume` | Régler le volume (0–200) |
| `/loop` | Mode boucle (off/track/queue) |
| `/shuffle` | Mélanger la file |
| `/remove` | Retirer une piste de la file |
| `/clearqueue` | Vider la file d'attente |

### 📨 Invitations

| Commande | Description |
|----------|-------------|
| `/invites user` | Stats d'invitations d'un membre |
| `/invites leaderboard` | Classement des inviteurs |
| `/invites add` | Ajouter des invitations manuelles |
| `/invites remove` | Retirer des invitations |
| `/invites reset` | Remettre à zéro |
| `/invites config` | Configurer le salon de logs |

### 👋 Welcome

| Commande | Description |
|----------|-------------|
| `/welcome setup` | Configurer le système |
| `/welcome channel` | Changer le salon |
| `/welcome message` | Modifier le message |
| `/welcome test` | Tester le message |
| `/welcome disable` | Désactiver |

### 📜 Règlement

| Commande | Description |
|----------|-------------|
| `/reglement setup` | Créer/envoyer le règlement |
| `/reglement edit` | Modifier le texte |
| `/reglement disable` | Désactiver |
| `/reglement status` | Voir la configuration |

### 💰 Économie

| Commande | Description |
|----------|-------------|
| `/daily` | Réclamer la récompense journalière |
| `/balance` | Voir son solde |
| `/shop` | Parcourir la boutique |
| `/buy` | Acheter un article |
| `/inventory` | Voir son inventaire |
| `/leaderboard` | Classement des plus riches |

### 🏆 Communauté & XP

| Commande | Description |
|----------|-------------|
| `/rank` | Voir son niveau et XP |
| `/level` | Configurer les rôles de niveau |
| `/profile` | Voir son profil complet |
| `/sondage` | Créer un sondage |
| `/suggestion` | Soumettre une suggestion |
| `/ticket` | Gérer les tickets de support |

### 🎲 Fun

| Commande | Description |
|----------|-------------|
| `/coinflip` | Pile ou face |
| `/roll` | Lancer un ou plusieurs dés |
| `/8ball` | Consulter la boule 8 |
| `/meme` | Mème aléatoire |

### 📊 Info

| Commande | Description |
|----------|-------------|
| `/userinfo` | Infos sur un utilisateur |
| `/serverinfo` | Infos sur le serveur |
| `/roleinfo` | Infos sur un rôle |
| `/avatar` | Voir l'avatar en grand |

### 🛠️ Admin

| Commande | Description |
|----------|-------------|
| `/config` | Configurer le bot sur ce serveur |
| `/announce` | Publier une annonce |
| `/say` | Faire parler le bot |
| `/embed` | Créer un embed personnalisé |
| `/dmall` | Envoyer un DM à tous les membres |
| `/role` | Gérer les rôles en masse |
| `/logs` | Configurer le salon de logs |
| `/backup` | Sauvegarder la configuration |

### 🌐 Menu

| Commande | Description |
|----------|-------------|
| `/menu` | Menu principal interactif du bot |

---

## Architecture

```
discord-bot/
├── prisma/
│   └── schema.prisma          # Schéma Prisma (12 modèles)
├── src/
│   ├── index.js               # Point d'entrée, intents, chargement
│   ├── config/
│   │   ├── config.js          # Variables d'environnement validées
│   │   └── constants.js       # Couleurs, emojis, cooldowns
│   ├── database/
│   │   └── prisma.js          # Singleton PrismaClient
│   ├── commands/              # Slash commands par catégorie
│   │   ├── admin/
│   │   ├── community/
│   │   ├── economy/
│   │   ├── fun/
│   │   ├── giveaway/
│   │   ├── info/
│   │   ├── invites/
│   │   ├── moderation/
│   │   ├── music/
│   │   ├── reglement/
│   │   ├── welcome/
│   │   ├── deploy.js          # Script de déploiement des commands
│   │   └── menu.js
│   ├── events/                # Listeners Discord
│   ├── embeds/                # Builders d'embeds réutilisables
│   ├── components/            # Boutons, modals, menus
│   ├── services/              # Logique métier (BDD)
│   ├── giveaways/             # GiveawayManager + weightedRandom
│   ├── invites/               # InviteTracker
│   ├── moderation/            # AntiSpam + ModerationLogger
│   ├── music/                 # MusicPlayer + Queue + Track
│   ├── reactionRoles/         # ReactionRoleManager
│   └── utils/                 # Logger, cooldown, permissions, pagination
├── logs/                      # Fichiers de log Winston
├── .env.example
├── .gitignore
├── package.json
└── railway.json
```

### Modèles Prisma

| Modèle | Description |
|--------|-------------|
| `GuildConfig` | Configuration par serveur |
| `Giveaway` | Giveaways actifs/terminés |
| `GiveawayEntry` | Participations aux giveaways |
| `InviteStats` | Compteurs d'invitations par membre |
| `InviteRecord` | Historique des invitations |
| `ModLog` | Journal de modération |
| `Warning` | Avertissements |
| `UserProfile` | XP, niveau, économie |
| `Ticket` | Tickets de support |
| `Poll` | Sondages |
| `Suggestion` | Suggestions |
| `ShopItem` | Articles de la boutique |

---

## Checklist de démarrage

- [ ] Créer l'application sur discord.com/developers
- [ ] Activer les **Privileged Gateway Intents** : Server Members, Message Content
- [ ] Inviter le bot avec les permissions : `Administrator` (ou permissions granulaires)
- [ ] Remplir le fichier `.env` avec toutes les variables requises
- [ ] Lancer `npx prisma generate && npx prisma db push`
- [ ] Lancer `node src/commands/deploy.js` pour enregistrer les slash commands
- [ ] Démarrer le bot avec `npm start`
- [ ] Sur votre serveur : exécuter `/config` pour configurer les salons et rôles
- [ ] Configurer le welcome avec `/welcome setup`
- [ ] Envoyer le règlement avec `/reglement setup`
- [ ] Ajouter des articles à la boutique via la BDD ou un command admin
- [ ] Vérifier que FFmpeg est installé pour la musique (`ffmpeg -version`)

---

## Palette de couleurs

| Nom | Hex | Usage |
|-----|-----|-------|
| PRIMARY | `#FFD618` | Embeds principaux |
| SECONDARY | `#E79D0F` | Embeds secondaires |
| LIGHT | `#FEE09A` | Accents légers |
| ACCENT | `#F8DD54` | Highlights |
| DEEP | `#BF5A08` | Titres sombres |
| DANGER | `#661F0D` | Erreurs, bans |
| DARK | `#3F0F0F` | Fonds sombres |
| SUCCESS | `#57F287` | Succès |

---

## Licence

MIT — libre d'utilisation et de modification.

---

*⚔️ Fantasy Bot Premium — Forgé pour les royaumes Discord*

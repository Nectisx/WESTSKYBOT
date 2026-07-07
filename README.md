# ⚔️ WestSky Bot

Bot Discord du serveur Minecraft **WestSky** (`PLAY.WESTSKY.FR`) — Discord.js v14, Prisma + PostgreSQL, Node.js 18+.

---

## Fonctionnalités

| Catégorie | Description |
|-----------|-------------|
| 🎉 **Giveaways** | Création, fin, reroll (commande + bouton staff), pause/reprise, tickets pondérés par rôle, liste des participants paginée |
| 🔨 **Modération** | Ban, tempban, softban, kick, tempkick, mute/unmute, warn (timeout auto à 3 warns), purge, lock/unlock, slowmode, nick, modlogs, report |
| 🤖 **AutoMod** | Anti-spam, anti-pub Discord, anti-insultes — mute automatique 5 min + logs |
| 📨 **Invitations** | Suivi des invitations, leaderboard, bonus manuels, anti-fakes |
| 👋 **Welcome** | Message de bienvenue configurable, rôle automatique, ghost ping |
| 📜 **Règlement** | Embed de règlement avec bouton d'acceptation et attribution de rôle |
| 🏆 **XP/Niveaux** | XP par message, niveaux, leaderboard auto-actualisé, `/profile` |
| 🎫 **Tickets** | Panel par catégories, formulaire (pseudo MC, problème, preuve), transcript, DM récapitulatif |
| 🎪 **Communauté** | Sondages, suggestions, `/vote`, `/serveur` |
| 🛠️ **Admin** | `/config`, `/announce`, `/dmall`, `/role`, `/staff`, permissions déléguées par rôle |
| 📊 **Info** | `/userinfo`, `/serverinfo`, `/avatar`, `/ping`, `/uptime`, `/stats`, `/menu`, `/help` |

---

## Pré-requis

- **Node.js** 18 ou supérieur
- **PostgreSQL** 14+ (Railway, Render, Supabase, local…)
- Un **bot Discord** créé sur [discord.com/developers](https://discord.com/developers/applications)

---

## Installation locale

```bash
git clone <votre-repo>
cd discord-bot
npm install
cp .env.example .env   # puis remplir les valeurs

npm start              # prisma generate + db push + démarrage
```

Les slash commands sont **déployées automatiquement au démarrage** (event `ready`) :
- `GUILD_ID` défini → déploiement instantané sur ce serveur
- sinon → déploiement global (propagation jusqu'à 1 h)

En développement : `npm run dev` (nodemon).

---

## Variables d'environnement

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `DISCORD_TOKEN` | Token du bot Discord | ✅ |
| `CLIENT_ID` | ID de l'application Discord | ✅ |
| `GUILD_ID` | ID du serveur (déploiement instantané des commandes) | Recommandé |
| `DATABASE_URL` | URL PostgreSQL (`postgresql://...`) | ✅ |
| `NODE_ENV` | `development` ou `production` | ✅ |
| `LOG_LEVEL` | Niveau de log Winston (`info`, `debug`, `warn`) | ❌ |

---

## Déploiement Railway

1. Créer un projet sur [railway.app](https://railway.app)
2. **Add Service → GitHub Repo** et sélectionner votre dépôt
3. **Add Service → PostgreSQL** — Railway injecte `DATABASE_URL` automatiquement (à référencer dans le service bot)
4. Variables du service bot : `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`, `NODE_ENV=production`
5. Railway utilise `railway.json` (`npm start` : `prisma generate && prisma db push && node src/index.js`)

> ⚠️ **PostgreSQL est obligatoire** : le système de fichiers Railway est éphémère, une base SQLite serait effacée à chaque redéploiement.

---

## Architecture

```
discord-bot/
├── prisma/schema.prisma       # 15 modèles (PostgreSQL)
├── start.js                   # Bootstrap : prisma generate + db push + bot
├── src/
│   ├── index.js               # Client, intents, chargement
│   ├── config/                # config env, constants (couleurs/emojis), ticketCategories, roleCommands
│   ├── commands/              # Slash commands par catégorie (+ menu.js à la racine)
│   │   ├── admin/  community/  giveaway/
│   │   ├── info/  invites/  moderation/  reglement/  welcome/
│   ├── events/                # ready, interactionCreate, messageCreate, guildMemberAdd/Remove, invites…
│   ├── embeds/                # baseEmbed (footer unique), error, giveaway, invite, menu, moderation, welcome
│   ├── components/            # Boutons, modals, select menus
│   ├── services/              # config, invite, level, moderation (sendModLog), rolePermission, tempBan, welcome
│   ├── giveaways/             # GiveawayManager (tirage pondéré intégré)
│   ├── invites/               # InviteTracker
│   ├── moderation/            # antiSpam + automod
│   ├── database/              # Singleton PrismaClient
│   └── utils/                 # logger, cooldown, permissions, timeParser, commandLoader
├── .env.example
└── railway.json
```

---

## Checklist de démarrage

- [ ] Activer les **Privileged Gateway Intents** : Server Members, Message Content
- [ ] Inviter le bot avec les permissions nécessaires
- [ ] Remplir `.env`
- [ ] `npm start` (les commandes se déploient automatiquement)
- [ ] `/config` pour définir salons et rôles
- [ ] `/welcome setup`, `/reglement setup`, `/ticket setup`

---

## Palette de couleurs

| Nom | Hex | Usage |
|-----|-----|-------|
| PRIMARY | `#FFD618` | Embeds principaux |
| SECONDARY | `#E79D0F` | Embeds secondaires |
| SUCCESS | `#57F287` | Succès |
| DEEP | `#BF5A08` | Avertissements |
| DANGER | `#661F0D` | Erreurs, sanctions |

---

*⚔️ WestSky — PLAY.WESTSKY.FR*

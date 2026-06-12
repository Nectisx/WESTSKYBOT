# ⚔️ Guide de Modération — WestSky

> Document à usage interne. Réservé aux Helpers et Modérateurs du serveur Discord WestSky.
> Dernière mise à jour : Juin 2026

---

## 📋 Sommaire

1. [Niveaux de permission](#niveaux-de-permission)
2. [Commandes de modération](#commandes-de-modération)
3. [Système de tickets](#système-de-tickets)
4. [Giveaways](#giveaways)
5. [AutoMod — ce que le bot fait seul](#automod)
6. [Consulter les infractions](#consulter-les-infractions)
7. [Bonnes pratiques](#bonnes-pratiques)

---

## Niveaux de permission

| Rôle | Accès |
|------|-------|
| **Helper** | Warn, Mute, Ticket close, Report |
| **Modérateur** | Tout le dessus + Kick, Ban, Purge, Lock |
| **Admin** | Accès complet + configuration du bot |

> ⚠️ Les admins et modérateurs sont **immunisés** contre l'AutoMod du bot.

---

## Commandes de modération

### ⚠️ Avertissements

| Commande | Description | Exemple |
|----------|-------------|---------|
| `/warn add @user <raison>` | Avertit un membre. DM automatique envoyé + log. | `/warn add @Pseudo Comportement toxique` |
| `/warn remove <id>` | Supprime un avertissement précis par son ID. | `/warn remove clxyz123` |
| `/warnings @user` | Affiche tous les avertissements d'un membre avec les IDs. | `/warnings @Pseudo` |
| `/clearwarns @user` | Supprime **tous** les avertissements d'un coup. Réservé aux modos. | `/clearwarns @Pseudo` |

> 💡 L'ID d'un avertissement est visible dans `/warnings` sous chaque entrée.

---

### 🔇 Mute / Timeout

| Commande | Description | Exemple |
|----------|-------------|---------|
| `/mute @user <durée> [raison]` | Met en sourdine via le système natif Discord. | `/mute @Pseudo 30m Spam vocal` |
| `/unmute @user [raison]` | Retire le mute immédiatement. | `/unmute @Pseudo Fin de sanction` |

**Durées valides :** `10m` · `1h` · `6h` · `1j` · `7j` · max `28j`

---

### 👢 Expulsion

| Commande | Description | Exemple |
|----------|-------------|---------|
| `/kick @user [raison]` | Expulse un membre. Il peut revenir avec une invitation. | `/kick @Pseudo Comportement irrespectueux` |
| `/tempkick @user <durée> [raison]` | Expulsion temporaire : le membre est banni puis automatiquement débanni à l'expiration. | `/tempkick @Pseudo 2h Spam` |

---

### 🔨 Bannissement

| Commande | Description | Exemple |
|----------|-------------|---------|
| `/ban @user [raison]` | Bannissement **permanent**. Le membre ne peut plus rejoindre. | `/ban @Pseudo Triche avérée` |
| `/tempban @user <durée> [raison]` | Ban temporaire avec débannissement automatique. | `/tempban @Pseudo 7j Insultes répétées` |
| `/softban @user [raison]` | Ban + déban immédiat : supprime les messages récents sans exclure définitivement. | `/softban @Pseudo Purge messages` |
| `/unban @user` | Lève un bannissement manuel. | `/unban @Pseudo` |

---

### 🗑️ Purge / Salon

| Commande | Description | Exemple |
|----------|-------------|---------|
| `/purge <nombre>` | Supprime jusqu'à 100 messages dans le salon. | `/purge 20` |
| `/lock [raison]` | Verrouille le salon (personne ne peut écrire). | `/lock Annonce en cours` |
| `/unlock [raison]` | Déverrouille le salon. | `/unlock` |
| `/slowmode <secondes>` | Active le mode lent dans le salon (0 pour désactiver). | `/slowmode 10` |
| `/nick @user <surnom>` | Change le surnom d'un membre sur le serveur. | `/nick @Pseudo NouveauNom` |

---

## Système de tickets

### Pour les membres
Les membres utilisent le panneau de tickets (créé via `/ticket setup`) pour ouvrir un ticket.
Ils sélectionnent une catégorie dans le menu, remplissent le formulaire (pseudo MC, problème, preuve).

### Pour les helpers / modérateurs
- **Fermer un ticket** : cliquer le bouton 🔒 **Fermer le ticket** dans le canal du ticket, ou taper `/ticket close`
- Une confirmation est demandée avant fermeture
- À la fermeture : un **DM récapitulatif** est envoyé automatiquement au membre, et une trace est enregistrée dans les logs

> 💡 Prends le temps de répondre avant de fermer. Si le problème n'est pas résolu, ne ferme pas.

---

## Giveaways

| Commande | Description |
|----------|-------------|
| `/giveaway create` | Créer un giveaway (durée, lot, nb gagnants, rôle requis, bonus) |
| `/giveaway end <id>` | Terminer un giveaway immédiatement et tirer au sort |
| `/giveaway reroll <id>` | Retirer un ou plusieurs gagnants (si un gagnant ne répond pas) |
| `/giveaway cancel <id>` | Annuler un giveaway en cours |
| `/giveaway list` | Voir tous les giveaways actifs |
| `/giveaway pause <id>` | Mettre en pause un giveaway |
| `/giveaway resume <id>` | Reprendre un giveaway en pause |

> L'ID d'un giveaway est visible dans `/giveaway list`.

---

## AutoMod

Le bot intervient **automatiquement** sur trois types de violations. Aucune action manuelle n'est requise.

| Violation | Réponse automatique |
|-----------|---------------------|
| **Lien Discord** (`discord.gg/xxx`) | Message supprimé + mute 5 min + log |
| **Insulte** (liste de mots interdits FR) | Message supprimé + mute 5 min + log |
| **Spam** (5+ messages en 5s, ou messages identiques) | Message supprimé + mute 5 min + log |

**Exception pub :** `discord.gg/westsky` est autorisé.

**Immunité :** Les admins, l'owner du serveur, et les rôles Modérateur/Admin configurés ne sont **jamais** sanctionnés par l'AutoMod.

> Si l'AutoMod mute quelqu'un à tort, utilise `/unmute @user` pour lever la sanction manuellement.

---

## Consulter les infractions

### Commandes de consultation

| Commande | Ce qu'elle affiche |
|----------|--------------------|
| `/infractions @user` | Vue complète : résumé + warns + historique mod + ban temp actif |
| `/warnings @user` | Uniquement les avertissements avec leurs IDs |
| `/modlogs @user` | Uniquement l'historique des actions de modération |

> Toujours faire un `/infractions` avant de sanctionner — pour éviter de doubler une sanction déjà en cours.

---

## Bonnes pratiques

### ✅ À faire

- **Toujours indiquer une raison** claire et courte lors d'une sanction
- **Vérifier `/infractions @user`** avant d'agir — le membre est peut-être déjà banni temp
- **Privilégier l'escalade** : warn → mute → kick → tempban → ban
- **Fermer les tickets** une fois le problème résolu, pas avant
- **Notifier en DM** si tu kickes ou bans (le bot le fait automatiquement pour kick/ban/tempkick/tempban)

### ❌ À ne pas faire

- Ne pas sanctionner sans raison documentée
- Ne pas utiliser `/ban` pour un premier écart — réserve ça aux cas graves ou récidivistes
- Ne pas fermer un ticket sans avoir répondu
- Ne pas `clearwarns` sans l'accord d'un admin

### 📐 Échelle de sanctions recommandée

```
1er écart mineur    → /warn add
2e écart            → /warn add
3e écart            → /mute 1h
Écart grave         → /mute 24h ou /tempkick 24h
Récidive grave      → /tempban 7j
Triche / hack       → /ban permanent
Publicité           → /ban permanent (bot le gère automatiquement)
```

---

## Contact

Si tu as un doute sur une situation, contacte un **Administrateur** avant d'agir.
Mieux vaut ne pas agir que mal agir.

> ⚔️ WestSky — `PLAY.WESTSKY.FR`

// src/commands/deploy.js
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error('❌ DISCORD_TOKEN et CLIENT_ID sont requis dans .env');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname);

function loadCommandsFromDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      loadCommandsFromDir(fullPath);
    } else if (entry.name.endsWith('.js') && entry.name !== 'deploy.js') {
      try {
        const command = require(fullPath);
        if (command.data) {
          commands.push(command.data.toJSON());
          console.log(`✅ Chargée : ${command.data.name}`);
        }
      } catch (err) {
        console.error(`❌ Erreur ${entry.name}: ${err.message}`);
      }
    }
  }
}

loadCommandsFromDir(commandsPath);

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`\n🚀 Déploiement de ${commands.length} commande(s)...`);

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(`✅ Commandes déployées sur le serveur ${guildId} (instantané)`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log('✅ Commandes déployées globalement (délai ~1h)');
    }
  } catch (err) {
    console.error('❌ Erreur déploiement:', err);
    process.exit(1);
  }
})();

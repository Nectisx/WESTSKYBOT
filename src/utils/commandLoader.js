// src/utils/commandLoader.js
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const categories = fs.readdirSync(commandsPath).filter(f =>
    fs.statSync(path.join(commandsPath, f)).isDirectory()
  );

  let loaded = 0;
  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));
    for (const file of files) {
      try {
        const command = require(path.join(categoryPath, file));
        if (command.data && command.execute) {
          client.commands.set(command.data.name, command);
          loaded++;
        }
      } catch (err) {
        logger.error(`Erreur chargement commande ${file}: ${err.message}`);
      }
    }
  }

  // menu.js à la racine des commandes
  const menuFile = path.join(commandsPath, 'menu.js');
  if (fs.existsSync(menuFile)) {
    try {
      const command = require(menuFile);
      if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        loaded++;
      }
    } catch (err) {
      logger.error(`Erreur chargement menu.js: ${err.message}`);
    }
  }

  logger.info(`${loaded} commandes chargées`);
  return loaded;
}

function loadEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');
  const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
  let loaded = 0;
  for (const file of files) {
    try {
      const event = require(path.join(eventsPath, file));
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      loaded++;
    } catch (err) {
      logger.error(`Erreur chargement event ${file}: ${err.message}`);
    }
  }
  logger.info(`${loaded} events chargés`);
  return loaded;
}

module.exports = { loadCommands, loadEvents };

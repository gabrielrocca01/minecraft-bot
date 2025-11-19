// src/bot/modules/player-commands.js

const { getTypeHandler } = require('../types');

module.exports = function playerCommandsModule(bot, context) {
  const { config, defaultMove, GoalBlock, spawnWorkerBot } = context;
  const prefix = 'bot ';

  console.log('[MOD:player-commands] enabled');

  bot.on('chat', async (username, message) => {
    if (username === bot.username) return;

    if (message.startsWith('!bf')) return;

    const msg = message.toLowerCase();
    if (!msg.startsWith(prefix)) return;

    const rawCommand = message.slice(prefix.length).trim();
    const parts = rawCommand.split(/\s+/);
    const cmd = (parts[0] || '').toLowerCase();
    const args = parts.slice(1);

    // handler del bot principale (tipo "master")
    const handler = getTypeHandler('master');
    if (!handler) {
      bot.chat('Errore interno: handler "master" mancante.');
      return;
    }

    // se non è un comando valido, lascia perdere (così "bot che cosa dici" va all’autoreply)
    const validCommands = handler.commands || ['help', 'test', 'spawn'];
    const isValidCommand = validCommands.includes(cmd);
    if (!isValidCommand) return;

    // help
    if (cmd === '' || cmd === 'help') {
      const lines = handler.getHelp ? handler.getHelp() : [];
      if (!lines.length) {
        bot.chat('Nessun comando registrato.');
      } else {
        bot.chat('Comandi disponibili:');
        lines.forEach(line => bot.chat(`- ${line}`));
      }
      return;
    }

    try {
      const handlerContext = {
        bot,
        config,
        defaultMove,
        GoalBlock,
        spawnWorkerBot,
        username,
        cmd,
        args
      };

      await handler.handleCommand(handlerContext);
    } catch (err) {
      console.error('[player-commands] Error:', err);
      bot.chat(`Errore durante l’esecuzione del comando: ${err.message}`);
    }
  });
};

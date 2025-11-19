const mineflayer = require('mineflayer');
const { Movements } = require('mineflayer-pathfinder');
const { pathfinder } = require('mineflayer-pathfinder');
const { GoalBlock } = require('mineflayer-pathfinder').goals;
const { spawnWorkerBot } = require('./spawnWorkerBot');
const toolPlugin = require('mineflayer-tool').plugin;

// moduli
const autoAuthModule = require('./modules/autoAuth');
const chatMessagesModule = require('./modules/chatMessages');
const antiAfkModule = require('./modules/antiAfk');
const positionNavigatorModule = require('./modules/positionNavigator');
const autoReplyModule = require('./modules/autoReply');
const playerCommandsModule = require('./modules/playerCommands');
const autoSleepModule = require('./modules/autoSleep');


function createBot(config) {
  const bot = mineflayer.createBot({
    username: config['bot-account'].username,
    password: config['bot-account'].password,
    auth: config['bot-account'].type,
    host: config.server.ip,
    port: config.server.port,
    version: config.server.version
  });

  // plugin base
  bot.loadPlugin(pathfinder);
  bot.loadPlugin(toolPlugin);

  const mcData = require('minecraft-data')(bot.version);
  const defaultMove = new Movements(bot, mcData);

  const context = {
    mcData,
    defaultMove,
    GoalBlock,
    config,
    spawnWorkerBot: (task) => spawnWorkerBot(config, task, bot)
  };

  // log base
  bot.on('kicked', (reason, loggedIn) => {
    console.log('[BOT] Kicked. loggedIn:', loggedIn, 'reason:', reason);
  });

  bot.on('end', (reason) => {
    console.log('[BOT] End event:', reason);
    if (config.utils['auto-reconnect']) {
      setTimeout(() => {
        console.log('[BOT] Reconnecting...');
        createBot(config);
      }, config.utils['auto-reconnect-delay'] || 5000);
    }
  });

  bot.on('error', (err) => {
    console.log('[BOT ERROR]', err.stack || err.message);
  });

  // attacco dei moduli
  autoAuthModule(bot, context);
  chatMessagesModule(bot, context);
  antiAfkModule(bot, context);
  positionNavigatorModule(bot, context);
  autoReplyModule(bot, context);
  playerCommandsModule(bot, context);
  autoSleepModule(bot, context);
  return bot;
}

module.exports = { createBot };

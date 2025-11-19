const { startWebServer } = require('./src/web/server');
const { loadConfig } = require('./src/config/loadConfig.js');
const { createBot } = require('./src/bot/createBot');

async function main() {
  const config = loadConfig();

  startWebServer(config);    // Express 8000

  // primo bot
  createBot(config);
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});

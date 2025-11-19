const fs = require('fs');
const path = require('path');

function loadConfig() {
  const filePath = path.join(__dirname, '..', '..', 'settings.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  const config = JSON.parse(raw);

  // qui puoi fare validazioni base
  if (!config.server || !config.server.ip) {
    throw new Error('Missing server.ip in settings.json');
  }

  return config;
}

module.exports = { loadConfig };

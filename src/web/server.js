const express = require('express');

function startWebServer(config) {
  const app = express();

  app.get('/', (req, res) => {
    res.send('Bot is running');
  });

  const port = 8000;
  app.listen(port, () => {
    console.log(`[WEB] Server started on port ${port}`);
  });
}

module.exports = { startWebServer };

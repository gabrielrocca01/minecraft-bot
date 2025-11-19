const { getAllTypesHelp } = require("../types");

module.exports = function helpModule(bot) {
  bot.on("chat", (username, message) => {
    if (username === bot.username) return;

    const lower = message.toLowerCase().trim();

    if (lower === "bot help" || lower === "!help" || lower === "/help") {
      const helpText = buildHelpMessage();
      helpText.forEach(line => bot.chat(line));
    }
  });
};

// -----------------------------
// Costruisce automaticamente l'help completo
// -----------------------------

function buildHelpMessage() {
  const workerTypes = getAllTypesHelp();

  const lines = [
    "§e[BotFather] Comandi disponibili:§r",
    "",
    "§a— Comandi generali:§r",
    "- bot help",
    "- bot crea <tipo> <nome>",
    "- bot elimina <nome>",
    "- bot list",
    "",
    "§b— Tipi disponibili:§r",
    ...Object.keys(workerTypes).map(t => `- ${t}`),
    "",
    "§d— Comandi per i bot worker:§r",
    "- <nomeBot> help",
    "- <nomeBot> seguimi",
    "- <nomeBot> fermati",
    "- <nomeBot> stop",
    "- <nomeBot> muori",
    "",
    "§6— Comandi specifici per ogni tipo:§r",
  ];

  for (const [typeName, typeHelp] of Object.entries(workerTypes)) {
    lines.push(``);
    lines.push(`§e[${typeName}]§r`);
    lines.push(...typeHelp.map(cmd => `- ${cmd}`));
  }

  return lines;
}

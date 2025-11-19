module.exports = function positionNavigatorModule(bot, { config, defaultMove, GoalBlock }) {
    if (!config.position || !config.position.enabled) return;
  
    bot.once('spawn', () => {
      const pos = config.position;
      console.log(`[MOD:position] Moving to (${pos.x}, ${pos.y}, ${pos.z})`);
  
      bot.pathfinder.setMovements(defaultMove);
      bot.pathfinder.setGoal(new GoalBlock(pos.x, pos.y, pos.z));
    });
  
    bot.on('goal_reached', () => {
      console.log(`[MOD:position] Goal reached at ${bot.entity.position}`);
    });
  
    bot.on('death', () => {
      console.log(`[MOD:position] Bot died at ${bot.entity.position}`);
    });
  };
  
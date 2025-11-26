// src/bot/modules/autoSleep.js

const { Vec3 } = require('vec3');

module.exports = function autoSleepModule(bot, { mcData, defaultMove, GoalBlock, config }) {
  const settings = config?.utils?.['auto-sleep'] || {
    enabled: true,
    autoGiveBed: true,
    fallbackTimeDay: false
  };

  if (!settings.enabled) {
    console.log('[MOD:auto-sleep] disabled via config');
    return;
  }

  console.log('[MOD:auto-sleep] enabled');

  function isNight() {
    const t = bot.time.timeOfDay;
    return t >= 13000 && t <= 23000;
  }

  function calmBot() {
    // disattivo i controlli di movimento, NON "attack"
    const controlsToReset = [
      'jump',
      'sneak',
      'sprint',
      'forward',
      'back',
      'left',
      'right',
    ];
  
    controlsToReset.forEach(ctrl => {
      bot.setControlState(ctrl, false);
    });
  
    bot.stopDigging();
  }
  

  function findAnyBedPart(maxDistance = 32) {
    return bot.findBlock({
      matching: block => {
        const data = mcData.blocks[block.type];
        if (!data) return false;
        const name = data.name;
        return name && name.includes('bed');
      },
      maxDistance
    });
  }

  function findBedHeadNear(part) {
    // In 1.12: bed usa metadata => head/foot + orientation
    // Semplifichiamo: cerco un altro blocco "bed" attaccato
    const offsets = [
      new Vec3(1, 0, 0),
      new Vec3(-1, 0, 0),
      new Vec3(0, 0, 1),
      new Vec3(0, 0, -1)
    ];

    for (const off of offsets) {
      const b = bot.blockAt(part.position.plus(off));
      if (!b) continue;
      const data = mcData.blocks[b.type];
      if (!data) continue;
      const name = data.name;
      if (name && name.includes('bed')) {
        return b;
      }
    }

    // se non trovo “la coppia”, uso la parte trovata
    return part;
  }

  async function ensureBedNearby() {
    // 1) c'è già un letto nei paraggi?
    let part = findAnyBedPart(16);
    if (part) {
      const head = findBedHeadNear(part);
      console.log('[auto-sleep] Letto trovato a', head.position);
      return head;
    }

    if (!settings.autoGiveBed) {
      console.log('[auto-sleep] Nessun letto e autoGiveBed=false');
      return null;
    }

    // 2) se il bot è OP, si give un letto
    console.log('[auto-sleep] Nessun letto, provo a /give un letto');
    bot.chat(`/give ${bot.username} bed 1`);

    // aspetto che l’item arrivi
    await bot.waitForTicks(20);

    // 3) cerco un letto nell’inventario
    let bedItem = bot.inventory.items().find(i => i.name.includes('bed'));
    if (!bedItem) {
      console.log('[auto-sleep] Nessun letto in inventario dopo /give');
      return null;
    }

    // 4) trovo un blocco solido sotto di me su cui piazzare il letto
    const feetPos = bot.entity.position.floored();
    const below = bot.blockAt(feetPos.offset(0, -1, 0));
    if (!below || !below.boundingBox || below.boundingBox === 'empty') {
      console.log('[auto-sleep] Nessun blocco solido sotto i piedi per piazzare il letto');
      return null;
    }

    try {
      await bot.equip(bedItem, 'hand');

      // piazzo il letto sopra il blocco sotto i piedi
      await bot.placeBlock(below, new Vec3(0, 1, 0));
      console.log('[auto-sleep] Letto piazzato a', below.position.offset(0, 1, 0));
    } catch (err) {
      console.error('[auto-sleep] Errore nel piazzare il letto:', err.message);
      return null;
    }

    await bot.waitForTicks(10);

    // 5) ora cerco di nuovo il letto appena piazzato
    part = findAnyBedPart(4);
    if (!part) {
      console.log('[auto-sleep] Non trovo il letto appena piazzato');
      return null;
    }

    const head = findBedHeadNear(part);
    console.log('[auto-sleep] Letto (piazzato) a', head.position);
    return head;
  }

  async function goSleep() {
    if (bot.isSleeping) return;

    calmBot();

    const bed = await ensureBedNearby();

    if (!bed) {
      console.log('[auto-sleep] Nessun letto utilizzabile.');

      if (settings.fallbackTimeDay) {
        console.log('[auto-sleep] Uso fallback /time set day');
        bot.chat('/time set day');
      }

      return;
    }

    // raggiungo il letto
    bot.pathfinder.setMovements(defaultMove);
    bot.pathfinder.setGoal(
      new GoalBlock(
        bed.position.x,
        bed.position.y,
        bed.position.z
      )
    );

    await new Promise(resolve => bot.once('goal_reached', resolve)).catch(() => {});
    calmBot();

    try {
      await bot.sleep(bed);
      console.log('[auto-sleep] Sto dormendo...');
    } catch (err) {
      console.error('[auto-sleep] Errore nel dormire:', err.message);
    }
  }

  async function wakeUp() {
    if (!bot.isSleeping) return;

    try {
      await bot.wake();
      console.log('[auto-sleep] Mi sono svegliato.');
    } catch (err) {
      console.error('[auto-sleep] Errore nello svegliarsi:', err.message);
    }
  }

  bot.on('time', () => {
    if (!settings.enabled) return;

    if (isNight()) {
      goSleep();
    } else {
      wakeUp();
    }
  });
};

'use strict';

Room.prototype.creepMem = function(role, targetId, targetRoom, level, base) {
  return {
    role: role,
    routing: {
      targetRoom: targetRoom || this.name,
      targetId: targetId,
    },
    level: level,
    base: base,
  };
};

/**
 * get priority from config for a creep.
 *
 * @param  {Object} object the creep queue object
 * @return {Number}        the priority for creep
 */
Room.prototype.getPriority = function(object) {
  const priority = config.priorityQueue;
  const target = object.routing && object.routing.targetRoom;
  if (target === this.name) {
    return priority.sameRoom[object.role] || 4;
  } else if (target) {
    return priority.otherRoom[object.role] || 20 + Game.map.getRoomLinearDistance(this.name, target);
  } else {
    return 19;
  }
};

Room.prototype.spawnCheckForCreate = function() {
  if (this.memory.queue.length === 0) {
    return false;
  }
  this.memory.queue = _.sortBy(this.memory.queue, (c) => this.getPriority(c));

  const creep = this.memory.queue[0];
  if (this.spawnCreateCreep(creep)) {
    this.memory.queue.shift();
    return true;
  }
  if (creep.ttl === 0) {
    this.log('TTL reached, skipping: ' + JSON.stringify(creep));
    this.memory.queue.shift();
    return false;
  }
  creep.ttl = creep.ttl || config.creep.queueTtl;
  if (this.getSpawnableSpawns().length === 0) {
    creep.ttl--;
  }
  return false;
};

Room.prototype.inQueue = function(creepMemory) {
  this.memory.queue = this.memory.queue || [];
  for (const item of this.memory.queue) {
    if (creepMemory.role !== item.role) {
      continue;
    }
    if (!item.routing) {
      this.log('No item routing: ' + JSON.stringify(item));
      if (item.role !== 'scout') {
        this.log('inQueue: no routing: ' + JSON.stringify(item) + ' ' + JSON.stringify(creepMemory));
      }
      continue;
    }
    if (creepMemory.routing.targetId === item.routing.targetId && creepMemory.routing.targetRoom === item.routing.targetRoom) {
      return true;
    }
  }
  return false;
};

Room.prototype.inRoom = function(creepMemory, amount = 1) {
  if (amount === 0) {
    return false;
  }
  const creepsSpawning = [];
  for (const spawn of this.find(FIND_MY_SPAWNS)) {
    if (spawn.spawning) {
      creepsSpawning.push(Game.creeps[spawn.spawning.name]);
    }
  }
  const creeps = this.find(FIND_MY_CREEPS).concat(creepsSpawning);
  this.memory.roles = this.memory.roles || {};

  let j = 0;
  for (const creep of creeps) {
    const iMem = Memory.creeps[creep.name];

    if (!iMem) {
      this.log(`${creep} ${creep.name} ${Array.isArray(creep)} ${creep instanceof Array} ${typeof creep} ${Object.keys(creep)}`);
      this.log(`inRoom no iMem ${JSON.stringify(creep)}`);
      this.log(`inRoom no iMem ${creep.name}`);
      continue;
    }
    if (creepMemory.role === iMem.role && (!iMem.routing ||
        (creepMemory.routing.targetRoom === iMem.routing.targetRoom &&
          creepMemory.routing.targetId === iMem.routing.targetId))) {
      j++;
    }
    if (j >= amount) {
      this.memory.roles[creepMemory.role] = true;
      /**
      if (config.debug.queue) {
        this.log('Already enough ' + creepMemory.role);
      }
      **/
      return true;
    }
  }
  return false;
};

/**
 * First function call for ask a creep spawn. Add it in queue after check if spawn is allow.
 *
 * @param  {string} role                the role of the creeps to spawn.
 * @param  {number} [amount]            the amount of creeps asked for (1).
 * @param  {string} [targetId]          the id of targeted object by creeps (null).
 * @param  {string} [targetRoom]        the targeted room name (base)
 * @param  {number} [level]             the level of creeps. required by some functions.
 * @param  {string} [base]              the room which will spawn creep
 * @param  {object} [additionalMemory]  add this object to creep memory
 * @return {boolean}                    if the spawn is not allow, it will return false.
 */
Room.prototype.checkRoleToSpawn = function(role, amount, targetId, targetRoom, level, base, additionalMemory = {}) {
  const creepMemory = this.creepMem(role, targetId, targetRoom, level, base);
  Object.assign(creepMemory, additionalMemory);
  if (this.inQueue(creepMemory) || this.inRoom(creepMemory, amount)) {
    return false;
  }

  if (config.debug.queue) {
    this.log('Add ' + creepMemory.role + ' to queue. ' + JSON.stringify(creepMemory));
  }
  return this.memory.queue.push(creepMemory);
};

/**
 * Room.prototype.getPartsStringDatas used for parse parts as string and return
 * parts as array, cost, if spawn is allow and length.
 *
 * @param {String} parts String of body parts. e.g. 'MMWC'
 * @param {Number} energyAvailable energy allow for spawn.
 * @return {Object}       The parts datas :
 *                            .fail = true if not enouth energy
 *                            .cost = cost of parts
 *                            .parts = parts as array
 *                            .len = the amount of parts.
 */

Room.prototype.getPartsStringDatas = function(parts, energyAvailable) {
  if (!_.isString(parts)) {
    return {
      null: true,
    };
  }
  if (parts === '') {
    return {
      cost: 0,
      parts: [],
      len: 0,
    };
  }
  const ret = {};
  Memory.layoutsCost = Memory.layoutsCost || {};
  ret.cost = Memory.layoutsCost[parts] || 0;
  ret.parts = global.utils.stringToParts(parts);
  ret.len = ret.parts.length;
  if (config.debug.spawn) {
    this.log(`getPartsStringDatas ret: ${JSON.stringify(ret)} parts: ${JSON.stringify(parts)}`);
  }
  if (ret.cost) {
    ret.fail = ret.cost > energyAvailable;
    return ret;
  }
  _.each(ret.parts,
    (p) => {
      ret.cost += BODYPART_COST[p];
      ret.fail = ret.cost > energyAvailable;
    }
  );
  Memory.layoutsCost[parts] = ret.cost;
  return ret;
};

/**
 * Room.prototype.getSettings use for return creep spawn settings
 * adapted to room configuration
 *
 * @param {Collection} creep queue's creep spawn basic datas
 * @return {object}
 */
Room.prototype.getSettings = function(creep) {
  const role = creep.role;
  const updateSettings = roles[role].updateSettings && roles[role].updateSettings(this, creep);
  const settings = _.merge(roles[role].settings, updateSettings);
  if (!settings) {
    this.log('try to spawn ', role, ' but settings are not done. Abort spawn');
    return;
  }
  const param = settings.param;
  return _.mapValues(settings, (setting, settingName) => {
    // Not sure when this happens
    if (!setting || setting === null) {
      return setting;
    }
    if (!param) {
      return setting;
    }
    for (const parameter of param) {
      if (_.isString(setting) || _.isNumber(setting) || _.isArray(setting) || _.isBoolean(setting)) {
        break;
      }
      const valueForI = _.get(this, parameter, 1);
      let foundKey = 0;
      if (!setting) {
        break;
      }
      for (const key of Object.keys(setting)) {
        if (valueForI < key && foundKey !== 0) {
          break;
        }
        foundKey = key;
      }
      setting = setting[foundKey];
    }
    return setting;
  });
};

/**
 * Transform a string using an array char ammount. e.g. ('WMC', [1,2,3]) ==> 'WMMCCC'
 *
 * @param  {String} input  the input parts as string.
 * @param  {Array} amount the amount of each char needed.
 * @return {String}        the new parts string
 */
Room.prototype.applyAmount = function(input, amount) {
  if (!input) {
    return '';
  }
  if (amount === undefined) {
    return input;
  }
  let output = '';
  _.forEach(amount, (element, index) => {
    output += _.repeat(input.charAt(index), element);
  });
  if (config.debug.spawn) {
    this.log(`applyAmount input: ${JSON.stringify(input)} amount: ${JSON.stringify(amount)} output: ${JSON.stringify(output)}`);
  }
  return output;
};

/**
 * Sort body parts with the same order used in layout. Parts not in layout are last ones.
 *
 * @param  {array} parts  the parts array to sort.
 * @param  {array} layout the base layout.
 * @return {array}        sorted array.
 */
Room.prototype.sortParts = function(parts, layout) {
  return _.sortBy(parts, (p) => {
    if (p === TOUGH) {
      return 0;
    }
    const order = _.indexOf(layout.parts, p) + 1;
    if (order) {
      return order;
    } else {
      return layout.len;
    }
  });
};

/**
 * Room.prototype.getPartsConfig use for generate adapted body
 *
 * @param {Collection} creep queue's creep spawn basic datas
 */

Room.prototype.getPartConfig = function(creep) {
  let energyAvailable = this.energyAvailable;
  const settings = this.getSettings(creep);
  const {
    prefixString,
    amount,
    maxLayoutAmount,
    sufixString,
    fillTough,
  } = settings;
  let layoutString = settings.layoutString;
  let maxBodyLength = MAX_CREEP_SIZE;
  if (prefixString) {
    maxBodyLength -= prefixString.length;
  }
  if (sufixString) {
    maxBodyLength -= sufixString.length;
  }

  const prefix = this.getPartsStringDatas(prefixString, energyAvailable);
  if (prefix.fail) {
    return false;
  }
  let parts = prefix.parts || [];
  energyAvailable -= prefix.cost || 0;

  layoutString = this.applyAmount(layoutString, amount);
  const layout = this.getPartsStringDatas(layoutString, energyAvailable);
  if (layout.fail || layout.null) {
    return false;
  }
  let maxRepeat = Math.floor(Math.min(energyAvailable / layout.cost, maxBodyLength / layout.len));
  if (layout.len === 0) {
    maxRepeat = 0;
  }
  if (maxLayoutAmount !== undefined) {
    maxRepeat = Math.min(maxLayoutAmount, maxRepeat);
  }
  if (maxRepeat > 0) {
    parts = parts.concat(_.flatten(Array(maxRepeat).fill(layout.parts)));
  }
  energyAvailable -= layout.cost * maxRepeat;

  const sufix = this.getPartsStringDatas(sufixString, energyAvailable);
  if (!sufix.fail && !sufix.null) {
    parts = parts.concat(sufix.parts || []);
    energyAvailable -= sufix.cost || 0;
  }

  if (fillTough && parts.length < MAX_CREEP_SIZE) {
    const tough = this.getPartsStringDatas('T', energyAvailable);
    if (!tough.fail && !tough.null) {
      const maxTough = Math.floor(Math.min(energyAvailable / tough.cost, MAX_CREEP_SIZE - parts.length, parts.filter((p) => p === MOVE).length));
      parts = _.flatten(Array(maxTough).fill(tough.parts)).concat(parts);
    }
  }

  if (config.debug.spawn) {
    this.log('Spawning ' + creep.role + ' - - - Body: ' + JSON.stringify(prefix.parts) + ' - ' + maxRepeat + ' * ' + JSON.stringify(layout.parts) + ' - ' + JSON.stringify(sufix.parts) + ' - parts: ' + JSON.stringify(parts));
  }
  return config.creep.sortParts ? this.sortParts(parts, layout) : parts;
};

Room.prototype.getSpawnableSpawns = function() {
  const spawnsNotSpawning = this.find(FIND_MY_SPAWNS, {
    filter: (spawn) => !spawn.spawning,
  });
  return spawnsNotSpawning;
};

Room.prototype.getCreepConfig = function(creep) {
  const role = creep.role;
  const unit = roles[role];
  if (!unit) {
    this.log('Can not find role: ' + role + ' creep_' + role);
    return false;
  }
  const id = _.random(1, 9999);
  const name = role + '-' + id;
  const partConfig = this.getPartConfig(creep);
  if (!partConfig) {
    return;
  }
  const memory = Object.assign({}, creep, {
    number: id,
    step: 0,
    base: creep.base || this.name,
    born: Game.time,
    killPrevious: unit.killPrevious,
    flee: unit.flee,
    buildRoad: unit.buildRoad,
  });
  return {
    name: name,
    memory: memory,
    partConfig: partConfig,
  };
};

/**
 * Room.prototype.spawnCreateCreep use for launch spawn of first creep in queue.
 *
 * @param {Collection} creep Object with queue's creep datas.
 * @return {boolean}
 */
Room.prototype.spawnCreateCreep = function(creep) {
  const spawns = this.getSpawnableSpawns();
  if (spawns.length === 0) {
    return;
  }

  const creepConfig = this.getCreepConfig(creep);
  if (!creepConfig) {
    return false;
  }

  for (const spawn of spawns) {
    const returnCode = spawn.createCreep(creepConfig.partConfig, creepConfig.name, creepConfig.memory);
    if (returnCode !== creepConfig.name) {
      this.log(`spawnCreateCreep: ${returnCode} ${creepConfig.name}`);
      continue;
    }
    brain.stats.modifyRoleAmount(creep.role, 1);
    return true;
  }
  return false;
};

Room.prototype.checkAndSpawnSourcer = function() {
  const sources = this.find(FIND_SOURCES);

  let source;
  const isSourcer = (object) => object.memory.routing.targetId === source.id && object.memory.routing.targetRoom === source.pos.roomName;
  for (source of sources) {
    const sourcers = this.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', ['sourcer'], {
      filter: isSourcer,
    });
    if (sourcers.length === 0) {
      //      this.log(source.id);
      this.checkRoleToSpawn('sourcer', 1, source.id, this.name);
    }
  }
};

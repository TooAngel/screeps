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
  let priority = config.priorityQueue;
  let target = object.routing && object.routing.targetRoom;
  if (target === this.name) {
    return priority.sameRoom[object.role] || 4;
  } else if (target) {
    return priority.otherRoom[object.role] || 20 + Game.map.getRoomLinearDistance(this.name, target);
  } else {
    return 12;
  }
};

Room.prototype.spawnCheckForCreate = function() {
  let spawnsNotSpawning = _.filter(this.find(FIND_MY_SPAWNS), function(object) {
    return !object.spawning;
  });
  if (this.memory.queue.length === 0) {
    return false;
  }
  this.memory.queue = _.sortBy(this.memory.queue, c => this.getPriority(c));

  let creep = this.memory.queue[0];
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
  if (spawnsNotSpawning.length === 0) {
    creep.ttl--;
  }
  return false;
};

Room.prototype.inQueue = function(creepMemory) {
  this.memory.queue = this.memory.queue || [];
  for (var item of this.memory.queue) {
    if (!item.routing) {
      if (item.role !== 'scout') {
        this.log('inQueue: no routing: ' + JSON.stringify(item) + ' ' + JSON.stringify(creepMemory));
      }
      continue;
    }
    let creepTarget = {
      targetId: item.routing.targetId,
      targetRoom: item.routing.targetRoom
    };
    let found = _.eq(creepMemory.routing, creepTarget) && creepMemory.role === item.role;
    if (found) { return true; }
  }
  return false;
};

Room.prototype.inRoom = function(creepMemory, amount = 1) {
  var creepsSpawning = _(this.find(FIND_MY_SPAWNS)).map(s => s.spawning && Game.creeps[s.spawning.name]).compact();
  var creeps = this.find(FIND_MY_CREEPS).concat(creepsSpawning);
  var iMax = creeps.length;
  if (!iMax) { return false; }
  let j = 0;
  this.memory.roles = this.memory.roles || {};
  for (let i = 0; i < iMax; i++) {
    let iMem = creeps[i].memory;
    if (!iMem) { continue; }
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
    this.memory.roles[creepMemory.role] = false;
  }
  return false;
};

/**
 * First function call for ask a creep spawn. Add it in queue after check if spawn is allow.
 *
 * @param  {string} role       the role of the creeps to spawn.
 * @param  {number} amount     the amount of creeps asked for (1).
 * @param  {string} targetId   the id of targeted object by creeps (null).
 * @param  {string} targetRoom the targeted room name (base)
 * @param  {number} level      the level of creeps. required by some functions.
 * @param  {string} base       the room which will spawn creep
 * @return {boolean}           if the spawn is not allow, it will return false.
 */
Room.prototype.checkRoleToSpawn = function(role, amount, targetId, targetRoom, level, base) {
  var creepMemory = this.creepMem(role, targetId, targetRoom, level, base);
  if (this.memory.roles && this.memory.roles[creepMemory.role] && Game.time % 10) {
    return false;
  }
  if (this.inQueue(creepMemory) || this.inRoom(creepMemory, amount)) { return false; }
  if (role === 'harvester') {
    this.log(`checkRoleToSpawn: ${amount} ${this.inQueue(creepMemory)} ${this.inRoom(creepMemory, amount)}`);
  }

  if (config.debug.queue) {
    this.log('Add ' + creepMemory.role + ' to queue.');
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
  if (!_.isString(parts) || parts === '') {
    return {
      null: true
    };
  }
  let ret = {};
  Memory.layoutsCost = Memory.layoutsCost || {};
  ret.cost = Memory.layoutsCost[parts] || 0;
  ret.parts = global.utils.stringToParts(parts);
  ret.len = ret.parts.length;
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
 */
Room.prototype.getSettings = function(creep) {
  let role = creep.role;
  let updateSettings = roles[role].updateSettings && roles[role].updateSettings(this, creep);
  let settings = _.merge(roles[role].settings, updateSettings);
  if (!settings) {
    this.log('try to spawn ', role, ' but settings are not done. Abort spawn');
    return;
  }
  let param = settings.param;
  return _.mapValues(settings, (setting, settingName) => {
    if (!param) {
      return setting;
    }
    for (let parameter of param) {
      if (_.isString(setting) || _.isNumber(setting) || _.isArray(setting)) {
        break;
      }
      let valueForI = _.get(this, parameter, 1);
      let foundKey = 0;
      for (let key of Object.keys(setting)) {
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
  if (!amount) {
    return input;
  }
  let cost = 0;
  let parts = [];
  let output = '';
  _.forEach(amount, function(element, index) {
    output += _.repeat(input.charAt(index), element);
  });
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
  return _.sortBy(parts, function(p) {
    let order = _.indexOf(layout.parts, p) + 1;
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
  let {
    prefixString,
    layoutString,
    amount,
    maxLayoutAmount,
    sufixString,
  } = this.getSettings(creep);

  let maxBodyLength = MAX_CREEP_SIZE;
  if (prefixString) { maxBodyLength -= prefixString.length; }
  if (sufixString) { maxBodyLength -= sufixString.length; }

  let prefix = this.getPartsStringDatas(prefixString, energyAvailable);
  if (prefix.fail) { return false; }
  energyAvailable -= prefix.cost || 0;
  layoutString = this.applyAmount(layoutString, amount);
  let layout = this.getPartsStringDatas(layoutString, energyAvailable);
  if (layout.fail || layout.null) { return false; }
  let parts = prefix.parts || [];
  let maxRepeat = Math.floor(Math.min(energyAvailable / layout.cost, maxBodyLength / layout.len));
  if (maxLayoutAmount) {
    maxRepeat = Math.min(maxLayoutAmount, maxRepeat);
  }
  parts = parts.concat(_.flatten(Array(maxRepeat).fill(layout.parts)));
  energyAvailable -= layout.cost * maxRepeat;

  let sufix = this.getPartsStringDatas(sufixString, energyAvailable);
  if (!sufix.fail && !sufix.null) {
    parts = parts.concat(sufix.parts);
  }
  if (config.debug.spawn) {
    this.log('Spawning ' + creep.role + ' - - - Body: ' + JSON.stringify(prefix.parts) + ' - ' + maxRepeat + ' * ' + JSON.stringify(layout.parts) + ' - ' + JSON.stringify(sufix.parts));
  }
  return config.creep.sortParts ? this.sortParts(parts, layout) : parts;
};

Room.prototype.getSpawnableSpawns = function() {
  let spawns = this.find(FIND_MY_SPAWNS);
  _.each(spawns, s => {
    if (s && s.spawning) {
      spawns.shift();
    }
  });
  return spawns;
};

Room.prototype.getCreepConfig = function(creep) {
  let role = creep.role;
  let unit = roles[role];
  if (!unit) {
    this.log('Can not find role: ' + role + ' creep_' + role);
    return false;
  }
  var id = Math.floor((Math.random() * 1000) + 1);
  var name = role + '-' + id;
  var partConfig = this.getPartConfig(creep);
  if (!partConfig) { return; }
  let memory = {
    role: role,
    number: id,
    step: 0,
    base: creep.base || this.name,
    born: Game.time,
    heal: creep.heal,
    level: creep.level,
    squad: creep.squad,
    killPrevious: unit.killPrevious,
    flee: unit.flee,
    buildRoad: unit.buildRoad,
    routing: creep.routing
  };
  return {
    name: name,
    memory: memory,
    partConfig: partConfig
  };
};

/**
 * Room.prototype.spawnCreateCreep use for launch spawn of first creep in queue.
 *
 * @param {Collection} creep Object with queue's creep datas.
 */
Room.prototype.spawnCreateCreep = function(creep) {
  let spawns = this.getSpawnableSpawns();

  if (spawns.length === 0) { return; }

  let creepConfig = this.getCreepConfig(creep);
  if (!creepConfig) {
    return false;
  }

  for (let spawn of spawns) {
    if (spawn.createCreep(creepConfig.partConfig, creepConfig.name, creepConfig.memory) != creepConfig.name) {
      continue;
    }
    brain.stats.modifyRoleAmount(creep.role, 1);
    return true;
  }
  return false;

};

Room.prototype.checkAndSpawnSourcer = function() {
  var sources = this.find(FIND_SOURCES);

  let source;

  let isSourcer = function(object) {
    if (object.memory.role !== 'sourcer') {
      return false;
    }
    if (object.memory.routing && object.memory.routing.targetId !== source.id) {
      return false;
    }
    if (object.memory.routing && object.memory.routing.targetRoom !== source.pos.roomName) {
      return false;
    }
    return true;
  };

  for (source of sources) {
    let sourcers = this.find(FIND_MY_CREEPS, {
      filter: isSourcer
    });
    if (sourcers.length === 0) {
      //      this.log(source.id);
      this.checkRoleToSpawn('sourcer', 1, source.id, this.name);
    }
  }
};

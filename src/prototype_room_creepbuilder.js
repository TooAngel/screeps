'use strict';
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
    if (!item.routing) {continue;}
    let creepTarget = {targetId: item.routing.targetId,
      targetRoom: item.routing.targetRoom};
    let found = _.eq(creepMemory.routing, creepTarget) && creepMemory.role === item.role;
    if (found) {return true;}
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
  targetRoom = targetRoom || this.name;
  amount = amount || 1;

  let creepMemory = {
    role: role,
    level: level,
    base: base || undefined,
    routing: {
      targetRoom: targetRoom,
      targetId: targetId
    }
  };
  if (this.inQueue(creepMemory)) {return false;}
  let creeps = this.find(FIND_MY_CREEPS);
  let spawns = this.find(FIND_MY_SPAWNS);
  for (let spawn of spawns) {
    if (!spawn.spawning) {continue;}
    creeps.push(Game.creeps[spawn.spawning.name]);
  }
  creeps = _.filter(creeps, creep => {
    if (!creep.memory.routing) {return false;}
    let creepTarget = {targetId: creep.memory.routing.targetId,
      targetRoom: creep.memory.routing.targetRoom};
    return _.eq(creepMemory.routing, creepTarget) && role === creep.memory.role;
  });
  if (creeps.length < amount) {
    this.memory.queue.push(creepMemory);
  }
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
  if (!_.isString(parts) || parts === '') { return {null: true}; }
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
  if (prefix.fail) {return ;}
  energyAvailable -= prefix.cost || 0;
  layoutString = this.applyAmount(layoutString, amount);
  let layout = this.getPartsStringDatas(layoutString, energyAvailable);
  if (layout.fail) {return ;}
  let parts = prefix.parts || [];
  let maxRepeat = Math.floor(Math.min(energyAvailable / layout.cost, maxBodyLength / layout.len));
  if (maxLayoutAmount) {
    maxRepeat = Math.min(maxLayoutAmount || Infinity, maxRepeat);
  }
  parts = parts.concat(_.flatten(Array(maxRepeat).fill(layout.parts)));
  energyAvailable -= layout.cost * maxRepeat;

  let sufix = this.getPartsStringDatas(sufixString, energyAvailable);
  if (!sufix.fail && !sufix.null) {
    parts = parts.concat(sufix.parts);
  }
  return config.creep.sortParts ? this.sortParts(parts, layout) : parts;
};

/**
 * Room.prototype.spawnCreateCreep use for launch spawn of first creep in queue.
 *
 * @param {Collection} creep Object with queue's creep datas.
 */
Room.prototype.spawnCreateCreep = function(creep) {
  var spawns = this.find(FIND_MY_SPAWNS);
  _.each(spawns, s => {
    if (s && s.spawning) {
      spawns.shift();
    }
  });
  if (spawns.length === 0) { return; }
  let role = creep.role;
  var energy = this.energyAvailable;

  let unit = roles[role];
  if (!unit) {
    this.log('Can not find role: ' + role + ' creep_' + role);
    return true;
  }

  var id = Math.floor((Math.random() * 1000) + 1);
  var name = role + '-' + id;
  //console.log(this.name,'--->',role);
  var partConfig = this.getPartConfig(creep);
  if (!partConfig) {return;}
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
  for (let spawn of spawns) {
    if (spawn.createCreep(partConfig, name, memory) != name) {
      continue;
    }
    if (config.stats.enabled) {
      Memory.stats = Memory.stats || {};
      Memory.stats[userName].roles = Memory.stats[userName].roles || {};
      let roleStat = Memory.stats[userName].roles[role];
      let previousAmount = roleStat ? roleStat : 0;
      Memory.stats[userName].roles[role] = previousAmount + 1;
    }
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

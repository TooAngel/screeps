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
    this.log(`TTL reached, skipping: ${creep.role}`);
    this.memory.queue.shift();
    return false;
  }
  creep.ttl = creep.ttl || config.creep.queueTtl;
  if (this.findSpawnableSpawns().length === 0) {
    creep.ttl--;
  }
  return false;
};

/**
  * isCreepValid - Checks for the basic structurer
  *
  * @param {object} creep - The memory of a creep
  * @return {boolean} - If the creep is valid
  **/
function isCreepValid(creep) {
  if (!creep) {
    return false;
  }
  if (!creep.routing) {
    return false;
  }
  if (!creep.role) {
    return false;
  }
  return true;
}

/**
 * compareSingleRoutingValue - Compares a single routing value
 *
 * @param {object} first - The first creep
 * @param {object} second - The second creep
 * @param {string} routingValue - The routing value
 * @return {boolean} - The value are equal or not set
 **/
function compareSingleRoutingValue(first, second, routingValue) {
  if (first.routing[routingValue] && second.routing[routingValue] && first.routing[routingValue] !== second.routing[routingValue]) {
    return false;
  }
  return true;
}

/**
 * isEqualRouting - Compares the routing values
 *
 * @param {object} first - The first creep
 * @param {object} second - The second creep
 * @return {boolean} - If routing is equal
 **/
function isEqualRouting(first, second) {
  if (!compareSingleRoutingValue(first, second, 'targetRoom')) {
    return false;
  }
  if (!compareSingleRoutingValue(first, second, 'targetId')) {
    return false;
  }
  return true;
}

/**
 * isSameCreep - Checks if two creeps are matching in role, targetId and
 * targetRoom
 *
 * @param  {object} first the first creep
 * @param  {object} second the second creep
 * @return {boolean} both creeps have the same role, targetId and targetRoom
 */
Room.prototype.isSameCreep = function(first, second) {
  if (!isCreepValid(first)) {
    return false;
  }
  if (!isCreepValid(second)) {
    return false;
  }
  if (first.role !== second.role) {
    return false;
  }
  if (!isEqualRouting(first, second)) {
    return false;
  }
  return true;
};

Room.prototype.inQueue = function(creepMemory) {
  this.memory.queue = this.memory.queue || [];
  for (const item of this.memory.queue) {
    if (this.isSameCreep(creepMemory, item)) {
      return true;
    }
  }
  return false;
};

Room.prototype.getSpawningCreeps = function() {
  const creepsSpawning = [];
  for (const spawn of this.findMySpawns()) {
    if (spawn.spawning) {
      creepsSpawning.push(Game.creeps[spawn.spawning.name]);
    }
  }
  return creepsSpawning;
};

Room.prototype.inRoom = function(creepMemory, amount = 1) {
  if (amount === 0) {
    return false;
  }
  const creepsSpawning = this.getSpawningCreeps();
  const creeps = this.findMyCreeps().concat(creepsSpawning);
  this.memory.roles = this.memory.roles || {};

  let j = 0;
  for (const creep of creeps) {
    const item = Memory.creeps[creep.name];
    if (!this.isSameCreep(creepMemory, item)) {
      continue;
    }

    j++;
    if (j >= amount) {
      this.memory.roles[creepMemory.role] = true;
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
  if (ret.cost) {
    ret.fail = ret.cost > energyAvailable;
    return ret;
  }
  _.each(ret.parts,
    (p) => {
      ret.cost += BODYPART_COST[p];
      ret.fail = ret.cost > energyAvailable;
    },
  );
  Memory.layoutsCost[parts] = ret.cost;
  return ret;
};

/**
 * findFittingValueFromScale - Finds the fitting value within a scale
 *
 * @param {object} setting - The scale
 * @param {number} value - The value to match the scale
 * @return {object} - The value to return
 **/
function findFittingValueFromScale(setting, value) {
  let foundKey = 0;
  if (!setting) {
    return;
  }
  for (const key of Object.keys(setting)) {
    if (value < key && foundKey !== 0) {
      break;
    }
    foundKey = key;
  }
  return setting[foundKey];
}

/**
 * isSettingAnObject - Checks is the setting is an object
 *
 * @param {object} setting - The setting to check
 * @return {boolean} - If it is valid
 **/
function isSettingAnObject(setting) {
  // Not sure when this happens
  if (!setting || setting === null) {
    return false;
  }
  if (_.isArray(setting)) {
    return false;
  }
  if (!_.isObject(setting)) {
    return false;
  }
  return true;
}

/**
 * Room.prototype.getSettings use for return creep spawn settings
 * adapted to room configuration
 *
 * @param {Object} creep queue's creep spawn basic datas
 * @return {object}
 */
Room.prototype.getSettings = function(creep) {
  const role = creep.role;
  const updateSettings = roles[role].updateSettings && roles[role].updateSettings(this, creep);
  const settings = _.merge({}, roles[role].settings, updateSettings);
  if (!settings) {
    this.log('try to spawn ', role, ' but settings are not done. Abort spawn');
    return;
  }
  const param = settings.param;
  return _.mapValues(settings, (setting) => {
    if (!param) {
      return setting;
    }
    for (const parameter of param) {
      if (!isSettingAnObject(setting)) {
        return setting;
      }
      const valueForI = _.get(this, parameter, 1);
      const value = findFittingValueFromScale(setting, valueForI);
      if (value === undefined) {
        break;
      }
      setting = value;
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

Room.prototype.getPartConfigMaxBodyLength = function(prefixString, sufixString) {
  let maxBodyLength = MAX_CREEP_SIZE;
  if (prefixString) {
    maxBodyLength -= prefixString.length;
  }
  if (sufixString) {
    maxBodyLength -= sufixString.length;
  }
  return maxBodyLength;
};

/**
 * Room.prototype.getPartsConfig use for generate adapted body
 *
 * @param {Collection} creep queue's creep spawn basic datas
 * @return {object} The part Config or false
 */
Room.prototype.getPartConfig = function(creep) {
  let energyAvailable = this.energyAvailable;
  const settings = this.getSettings(creep);
  const {
    prefixString,
    amount,
    maxLayoutAmount,
    sufixString,
    fillTough} = settings;
  let layoutString = settings.layoutString;
  const maxBodyLength = this.getPartConfigMaxBodyLength(prefixString, sufixString);

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
    parts = parts.concat(_.flatten(_.fill(new Array(maxRepeat), layout.parts)));
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
      parts = _.flatten(_.fill(new Array(maxTough), tough.parts)).concat(parts);
    }
  }

  return config.creep.sortParts ? this.sortParts(parts, layout) : parts;
};

Room.prototype.getCreepConfig = function(creep) {
  const role = creep.role;
  const unit = roles[role];
  if (!unit) {
    this.log('Can not find role: ' + role + ' creep_' + role);
    return false;
  }
  const id = _.random(1, 999999);
  const name = role + '-' + id;
  const body = this.getPartConfig(creep);
  if (!body) {
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
    routing: creep.routing || {targetRoom: this.name},
  });

  const opts = {
    memory: memory,
  };
  if (!this.memory.misplacedSpawn && Game.time > 10) {
    // On misplaced spawn the top field could be blocked
    // On spawning the first harvester the `misplacedSpawn` is not necessarily
    // set, so checking for `Game.time`
    opts.directions = [TOP];
  }
  return {
    body: body,
    name: name,
    opts: opts,
  };
};

/**
 * Room.prototype.spawnCreateCreep use for launch spawn of first creep in queue.
 *
 * @param {Collection} creep Object with queue's creep datas.
 * @return {boolean}
 */
Room.prototype.spawnCreateCreep = function(creep) {
  const spawns = this.findSpawnableSpawns();
  if (spawns.length === 0) {
    return;
  }

  const config = this.getCreepConfig(creep);
  if (!config) {
    return false;
  }

  for (const spawn of spawns) {
    let body = config.body;
    if (body.length > 50) {
      this.log(`spawnCreateCreep body too long: ${body.length} ${config.name} ${config.opts}`);
      body = body.splice(50);
    }
    const returnCode = spawn.spawnCreep(config.body, config.name, config.opts);
    if (returnCode !== OK) {
      this.log(`spawnCreateCreep: ${returnCode} ${JSON.stringify(config)}`);
      continue;
    }
    brain.stats.modifyRoleAmount(creep.role, 1);
    return true;
  }
  return false;
};

Room.prototype.checkAndSpawnSourcer = function() {
  const sources = this.findSources();

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

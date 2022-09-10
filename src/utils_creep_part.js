'use strict';
Object.defineProperty(exports, '__esModule', {value: true});
exports.sortCreepParts = exports.CreepPartData = undefined;

/**
 * Creep part data
 *
 * @class
 */
class CreepPartData {
  constructor() {
    this.fail = false;
    this.cost = 0;
    this.parts = [];
    this.len = 0;
  }
}

exports.CreepPartData = CreepPartData;
/**
 * Sort body parts with the same order used in layout. Parts not in layout are last ones.
 *
 * @param  {string[]} parts  the parts array to sort.
 * @param  {CreepPartData} layout the base layout.
 * @return {string[]}        sorted array.
 */
const sortCreepParts = function(parts, layout) {
  // 0. fill parts into part type count map and set
  const partTypeCountMap = new Map([
    [TOUGH, 0],
    [MOVE, 0],
    [CARRY, 0],
    [WORK, 0],
    [CLAIM, 0],
    [HEAL, 0],
    [ATTACK, 0],
    [RANGED_ATTACK, 0],
  ]);
  for (const part of parts) {
    partTypeCountMap.set(part, partTypeCountMap.get(part) + 1);
  }
  const uniquePartTypeSet = new Set();
  for (const part of layout.parts) {
    uniquePartTypeSet.add(part);
  }
  const haveRangeAttack = partTypeCountMap.get(RANGED_ATTACK) > 0;
  // 1. pre-calculate buried parts
  const buriedParts = (function() {
    const buriedParts = [];
    for (const part of uniquePartTypeSet) {
      switch (part) {
      case MOVE:
      case RANGED_ATTACK:
      case TOUGH:
        continue;
      default:
      }
      const partCount = partTypeCountMap.get(part);
      if (partCount > 0) {
        buriedParts.push(part);
        partTypeCountMap.set(part, partCount - 1);
      }
    }
    const movePartsTotal = partTypeCountMap.get(MOVE);
    if (movePartsTotal > 0) {
      buriedParts.push(MOVE);
      partTypeCountMap.set(MOVE, movePartsTotal - 1);
    }
    const rangedAttackPartsTotal = partTypeCountMap.get(RANGED_ATTACK);
    if (rangedAttackPartsTotal > 0) {
      buriedParts.push(RANGED_ATTACK);
      partTypeCountMap.set(RANGED_ATTACK, rangedAttackPartsTotal - 1);
    }
    return buriedParts;
  }());
  // 2. calculate all tough at the beginning.
  const frontToughParts = (function() {
    const frontToughParts = Array(partTypeCountMap.get(TOUGH)).fill(TOUGH);
    partTypeCountMap.set(TOUGH, 0);
    return frontToughParts;
  }());
  // 3. calculate move part 1
  const moveParts1 = (function() {
    const movePartsTotal = partTypeCountMap.get(MOVE);
    const moveParts1MoveCount = movePartsTotal % 2 === 0 ? movePartsTotal / 2 : (movePartsTotal + 1) / 2;
    const moveParts1 = Array(moveParts1MoveCount).fill(MOVE);
    partTypeCountMap.set(MOVE, movePartsTotal - moveParts1MoveCount);
    return moveParts1;
  }());
  // 4. calculate move part 2
  const moveParts2 = (function() {
    let moveParts2;
    if (haveRangeAttack) {
      moveParts2 = [];
    } else {
      const moveParts2MoveCount = partTypeCountMap.get(MOVE);
      moveParts2 = Array(moveParts2MoveCount).fill(MOVE);
      partTypeCountMap.set(MOVE, 0);
    }
    return moveParts2;
  }());
  // 5. calculate center layout loop
  const centerLayoutParts = (function() {
    const centerLayoutParts = [];
    let stillLooping = true;
    while (stillLooping) {
      stillLooping = false;
      for (const part of layout.parts) {
        if (!haveRangeAttack && part === MOVE) {
          continue;
        }
        const partCount = partTypeCountMap.get(part);
        if (partCount > 0) {
          centerLayoutParts.push(part);
          stillLooping = true;
          partTypeCountMap.set(part, partCount - 1);
        }
      }
    }
    return centerLayoutParts;
  }());
  // 6. calculate additional parts (which only exist in parts but not in layout)
  const additionalParts = (function() {
    const additionalParts = [];
    for (const entry of partTypeCountMap.entries()) {
      if (entry[1] > 0) {
        additionalParts.push(...Array(entry[1]).fill(entry[0]));
        entry[1] = 0;
      }
    }
    return additionalParts;
  }());
  // 7. calculate additional parts (which only exist in parts but not in layout)
  const resultParts = [];
  resultParts.push(...frontToughParts);
  resultParts.push(...moveParts1);
  resultParts.push(...centerLayoutParts);
  resultParts.push(...additionalParts);
  resultParts.push(...moveParts2);
  resultParts.push(...buriedParts);
  return resultParts;
};
exports.sortCreepParts = sortCreepParts;

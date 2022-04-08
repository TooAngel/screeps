'use strict';

/**
 * TowerDrainer is used to drain energy from hostile towers
 *
 * Moves to the border between routing targetRoom and attackRoom,
 * step for one tick into attackRoom, then step out and heals
 *
 * You need 13 towerDrainer to drain at maximum speed
 *
 * Towerdrainer doesn't called now from anywhere. Call them manually:
 * @example
 * Game.rooms.E17N1.memory.queue.push({role: 'towerdrainer', routing: {targetRoom: 'E16N0'}, attackRoom: 'E16N1'})
 */

roles.towerdrainer = {};

roles.towerdrainer.settings = {
  layoutString: 'TMH',
  amount: [3, 5, 2], // attack RCL 5
  // amount: [2, 3, 1], // attack RCL 3
  maxLayoutAmount: 1,
};

roles.towerdrainer.getRestPosition = function(creep) {
  const restRoom = creep.memory.routing.targetRoom;
  const attackRoom = creep.memory.attackRoom;
  if (!creep.memory.restPosition) {
    creep.notifyWhenAttacked(false);
    const room = Game.rooms[restRoom];
    const attackDirection = room.findExitTo(attackRoom);
    const restDirection = RoomPosition.oppositeDirection(attackDirection);
    const occupiedPositions = {};
    _.filter(Game.creeps, (c) => c.memory.role === 'towerdrainer' && c.memory.restPosition).forEach((c) => {
      occupiedPositions[c.memory.restPosition.x + c.memory.restPosition.y] = c.id;
    });
    const attackExits = room.find(attackDirection);
    for (const exit of attackExits) {
      const pos = exit.getAdjacentPosition(restDirection);
      if (!pos.checkForWall() && !pos.checkForObstacleStructure() && !occupiedPositions[pos.x + pos.y]) {
        creep.memory.restPosition = pos;
        creep.memory.attackDirrection = attackDirection;
        creep.memory.restDirrection = restDirection;
        break;
      }
    }
  }
  return creep.memory.restPosition;
};

roles.towerdrainer.action = function(creep) {
  const attackRoom = creep.memory.attackRoom;
  const restPos = roles.towerdrainer.getRestPosition(creep);
  if (!restPos) {
    creep.log('no position');
    creep.moveRandom();
    return false;
  }
  creep.selfHeal();

  if (creep.pos.roomName === attackRoom || creep.pos.isBorder(-1) && creep.pos.isNearTo(restPos.x, restPos.y)) {
    creep.move(creep.memory.restDirrection);
  } else if (creep.pos.isEqualTo(restPos.x, restPos.y)) {
    creep.move(creep.memory.attackDirrection);
  } else {
    creep.moveTo(restPos.x, restPos.y);
  }

  return true;
};

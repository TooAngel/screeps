'use strict';

module.exports = {
  handle: function() {
    for (let squadIndex in Memory.squads) {
      let squad = Memory.squads[squadIndex];
      if (Object.keys(squad.siege).length === 0) {
        return true;
      }
      if (squad.action == 'move') {
        for (let siegeId in squad.siege) {
          let siege = squad.siege[siegeId];
          if (!siege.waiting) {
            return true;
          }
        }
        for (let healId in squad.heal) {
          let heal = squad.heal[healId];
          if (!heal.waiting) {
            return true;
          }
        }

        squad.action = 'attack';
      }
    }

  },

  start: function(roomNameFrom, roomNameAttack) {

    let route = Game.map.findRoute(roomNameFrom, roomNameAttack);
    let target = roomNameFrom;
    if (route.length > 1) {
      target = route[route.length - 2].room;
    }

    if (!Memory.squads) {
      Memory.squads = {};
    }
    let name = Math.random();

    Game.rooms[roomNameFrom].memory.queue.push({
      role: 'squadsiege',
      target: roomNameAttack,
      squad: name
    });
    Game.rooms[roomNameFrom].memory.queue.push({
      role: 'squadheal',
      target: roomNameAttack,
      squad: name
    });
    Game.rooms[roomNameFrom].memory.queue.push({
      role: 'squadheal',
      target: roomNameAttack,
      squad: name
    });
    Game.rooms[roomNameFrom].memory.queue.push({
      role: 'squadheal',
      target: roomNameAttack,
      squad: name
    });
    let squad = {
      born: Game.time,
      target: roomNameAttack,
      from: roomNameFrom,
      siege: {},
      heal: {},
      route: route,
      action: 'move',
      moveTarget: target
    };
    Memory.squads[name] = squad;
  }
};

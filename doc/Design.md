# Design

The AI automatically generates a layout for the room and builds the structures
for the current RCL. A `scout` creep or observer explores external harvest rooms.
If the current number of rooms is less than the GCL, the AI will acquire new
rooms. Fallen rooms will be survived and basically defended. The AI sends some waves of
auto attacks. Minerals are fetched from the extractor and transported to the
terminal. Reactions are basically implemented. Depending on a threshold minerals
are sold on the market.

## [Base building](BaseBuilding.md)

### Logic

The number of structures are checked and if applicable new constructionSites
are places. Links are triggered to transfer energy to link near the storage.
Towers attack incoming creeps or heal my creeps. If no spawn is available
`nextroomer` from other rooms are called, to build up the room.

The basic creep is the `universal` which can make sure, that enough energy
will be available to build the rest of the creeps. For this we check if
a `universal` is within the room, otherwise spawn it. For the rest a priority
queue is used.


## Role

 - `upgrader` get energy from the storage, puts it into the controller.
 - `filler` get energy from a link and transfers it to the tower or storage.
 - `sourcer` get energy from source.
   - Controlled room: Transfers the energy to the link.
   - External room: Builds container, fills container, calls `carry` to get
   the energy.
 - `reserver` reservs an external controller and calls `sourcer`.
 - `carry`
    A carry transports energy from the target to the storage in the base (From sources, energy piles or storages in other rooms)
    They use fixed precalculated paths
    While moving they try to transfer energy to the next creep or if in base to other structures (tower, link, extension)
    So carries move forward if they have 'no' energy, backwards if the 'have' energy
    'no' or 'have' is defined differently for different rooms

    The idea behind that is:
    - If the carry is in the target room, they should have a proper amount of energy to move all the way back
    - If the carry is in an intermediate room, they should have at least a mediocre amount of energy to move back
    - If the carry is in the base it should empty itself before moving backansfered.

    Carries are spawned by:
      - sourcer: if the energy pile or container is over a certain threshold
      - structurer: if the enrgy pile is over a certain threshold
      - rooms: if the storage is below a certain threshold to get energy from another room
 - `scout` Breadth-first search based room exploring.
 - `universal` moves on the universal path, and transfers energy to free structures
   on the path. On low energy in storage, the `universal` falls back to the
   start up phase without relying on anything (storage, links, other creeps).
 - `nextroomer` moves to target room and builds up that room.
 - `repairer` build walls and ramparts.
 - `builder` Builds construction sites


## Routing

The routing from `start` to `end` is first done on room level:

 - Find `Game.map.findRoute(start, end)` plus the start room added as first
   entry in the array. This is stored together with the `routePos` in memory
   of the creep.
 - Inside a single room:
   - First room (`routePos == 0`): Own rooms have a layout set with a path to
     each exit pre-calculated. The first part of the path name is `Start` and
     the second the room to move to.
   - Last room (`routePos == route.length -1`): the `targetId` is stored in the
     memory of the creep. So the first part of the path name is the previous
     room and the second part is the `targetId`.
   - Rooms on the path: The previous room is the first part of the path name,
     the next room is the second part of the path name.
   The path is cached in the memory of the room with a `created` attributes
   to allow invalidation.

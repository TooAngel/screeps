/**
 * Non-player structure.
 * Spawns NPC Source Keepers that guards energy sources and minerals in some rooms.
 * This structure cannot be destroyed.
 *
 * @class
 * @extends {OwnedStructure}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/207712119-StructureKeeperLair}
 */
StructureKeeperLair = function() { };

StructureKeeperLair.prototype =
{
    /**
     * Time to spawning of the next Source Keeper.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207712119-StructureKeeperLair#ticksToSpawn}
     *
     * @type {number}
     */
    ticksToSpawn: 0
};

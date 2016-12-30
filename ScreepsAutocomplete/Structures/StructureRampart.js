/**
 * Blocks movement of hostile creeps, and defends your creeps and structures on the same tile.
 *
 * @class
 * @extends {OwnedStructure}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/207712959-StructureRampart}
 */
StructureRampart = function() { };

StructureRampart.prototype =
{
    /**
     * The amount of game ticks when this rampart will lose some hit points.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207712959-StructureRampart#ticksToDecay}
     *
     * @type {number}
     */
    ticksToDecay: 0
};

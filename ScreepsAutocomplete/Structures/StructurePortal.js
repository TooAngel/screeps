/**
 * A non-player structure.
 * Instantly teleports your creeps to a distant room acting as a room exit tile.
 * Portals appear randomly in the central room of each sector.
 *
 * @class
 * @extends {Structure}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/208647345-StructurePortal}
 */
StructurePortal = function() { };

StructurePortal.prototype =
{
    /**
     * The position object in the destination room.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208647345-StructurePortal#destination}
     *
     * @type {RoomPosition}
     */
    destination: null,

    /**
     * The amount of game ticks when the portal disappears, or undefined when the portal is stable.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208647345-StructurePortal#ticksToDecay}
     *
     * @type {undefined|number}
     */
    ticksToDecay: 0
};

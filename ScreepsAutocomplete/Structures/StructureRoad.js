/**
 * Decreases movement cost to 1.
 * Using roads allows creating creeps with less MOVE body parts.
 *
 * @class
 * @extends {Structure}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/207713089-StructureRoad}
 */
StructureRoad = function() { };

StructureRoad.prototype =
{
    /**
     * The amount of game ticks when this road will lose some hit points.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207713089-StructureRoad#ticksToDecay}
     *
     * @type {number}
     */
    ticksToDecay: 0
};

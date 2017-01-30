/**
 * Non-player structure.
 * Contains power resource which can be obtained by destroying the structure.
 * Hits the attacker creep back on each attack.
 *
 * @class
 * @extends {OwnedStructure}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/207712729-StructurePowerBank}
 */
StructurePowerBank = function() { };

StructurePowerBank.prototype =
{
    /**
     * The amount of power containing.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207712729-StructurePowerBank#power}
     *
     * @type {number}
     */
    power: 0,

    /**
     * The amount of game ticks when this structure will disappear.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207712729-StructurePowerBank#ticksToDecay}
     *
     * @type {number}
     */
    ticksToDecay: 0
};

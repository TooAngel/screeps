/**
 * Remotely transfers energy to another Link in the same room.
 *
 * @class
 * @extends {OwnedStructure}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/208436275-StructureLink}
 */
StructureLink = function() { };

StructureLink.prototype =
{
    /**
     * The amount of game ticks the link has to wait until the next transfer is possible.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208436275-StructureLink#cooldown}
     *
     * @type {number}
     */
    cooldown: 0,

    /**
     * The amount of energy containing in the link.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208436275-StructureLink#energy}
     *
     * @type {number}
     */
    energy: 0,

    /**
     * The total amount of energy the link can contain.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208436275-StructureLink#energyCapacity}
     *
     * @type {number}
     */
    energyCapacity: 0,

    /**
     * Transfer energy from the link to another link or a creep.
     * If the target is a creep, it has to be at adjacent square to the link.
     * If the target is a link, it can be at any location in the same room.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208436275-StructureLink#transferEnergy}
     *
     * @type {function}
     *
     * @param {Creep|StructureLink} target The target object.
     * @param {number|undefined|null} [amount] The amount of energy to be transferred. If omitted, all the available energy is used.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_NOT_ENOUGH_RESOURCES|ERR_INVALID_TARGET|ERR_FULL|ERR_NOT_IN_RANGE|ERR_INVALID_ARGS|ERR_TIRED|ERR_RCL_NOT_ENOUGH}
     */
    transferEnergy: function(target, amount) { }
};

/**
 * Remotely attacks or heals creeps, or repairs structures.
 * Can be targeted to any object in the room.
 * However, its effectiveness highly depends on the distance.
 * Each action consumes energy.
 *
 * @class
 * @extends {OwnedStructure}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/208437105-StructureTower}
 */
StructureTower = function() { };

StructureTower.prototype =
{
    /**
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208437105-StructureTower#energy}
     *
     * @type {number}
     */
    energy: 0,

    /**
     * @see {@link http://support.screeps.com/hc/en-us/articles/208437105-StructureTower#energyCapacity}
     *
     * @type {number}
     */
    energyCapacity: 0,

    /**
     * Remotely attack any creep in the room.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208437105-StructureTower#attack}
     *
     * @type {function}
     *
     * @param {Creep} target The target creep.
     *
     * @return {number|OK|ERR_NOT_ENOUGH_RESOURCES|ERR_INVALID_TARGET|ERR_RCL_NOT_ENOUGH}
     */
    attack: function(target) { },


    /**
     * Remotely heal any creep in the room.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208437105-StructureTower#heal}
     *
     * @type {function}
     *
     * @param {Creep} target The target creep.
     *
     * @return {number|OK|ERR_NOT_ENOUGH_RESOURCES|ERR_INVALID_TARGET|ERR_RCL_NOT_ENOUGH}
     */
    heal: function(target) { },


    /**
     * Remotely repair any structure in the room.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208437105-StructureTower#repair}
     *
     * @type {function}
     *
     * @param {Spawn|Structure} target The target structure.
     *
     * @return {number|OK|ERR_NOT_ENOUGH_RESOURCES|ERR_INVALID_TARGET|ERR_RCL_NOT_ENOUGH}
     */
    repair: function(target) { },


    /**
     * @deprecated Since version 2016-07-11, replaced by `Creep.withdraw()`.
     *
     * Transfer energy from the structure to a creep.
     * You can transfer resources to your creeps from hostile structures as well.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208437105-StructureTower#transferEnergy}
     *
     * @type {function}
     *
     * @param {Creep} target The creep object which energy should be transferred to.
     * @param {number|undefined|null} [amount] The amount of energy to be transferred. If omitted, all the remaining amount of energy will be used.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_NOT_ENOUGH_RESOURCES|ERR_INVALID_TARGET|ERR_FULL|ERR_NOT_IN_RANGE}
     */
    transferEnergy: function(target, amount) { }
};

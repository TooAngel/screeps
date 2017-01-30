/**
 * Launches a nuke to another room dealing huge damage to the landing area.
 * Each launch has a cooldown and requires energy and ghodium resources.
 * Launching creates a Nuke object at the target room position which is visible to any player until it is landed.
 * Incoming nuke cannot be moved or cancelled. Nukes cannot be launched from or to novice rooms.
 *
 * @class
 * @extends {OwnedStructure}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/208488255-StructureNuker}
 */
StructureNuker = function() { };

StructureNuker.prototype =
{
    /**
     * The amount of energy containing in this structure.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208488255-StructureNuker#energy}
     *
     * @type {number}
     */
    energy: 0,

    /**
     * The total amount of energy this structure can contain.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208488255-StructureNuker#energyCapacity}
     *
     * @type {number}
     */
    energyCapacity: 0,

    /**
     * The amount of ghodium containing in this structure.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208488255-StructureNuker#ghodium}
     *
     * @type {number}
     */
    ghodium: 0,

    /**
     * The total amount of ghodium this structure can contain.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208488255-StructureNuker#ghodiumCapacity}
     *
     * @type {number}
     */
    ghodiumCapacity: 0,

    /**
     * The amount of game ticks until the next launch is possible.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208488255-StructureNuker#cooldown}
     *
     * @type {number}
     */
    cooldown: 0,

    /**
     * Launch a nuke to the specified position.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208488255-StructureNuker#launchNuke}
     *
     * @type {function}
     *
     * @param {RoomPosition} pos The target room position.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_NOT_ENOUGH_RESOURCES|ERR_INVALID_TARGET|ERR_NOT_IN_RANGE|ERR_TIRED|ERR_RCL_NOT_ENOUGH}
     */
    launchNuke: function(pos) { }
};

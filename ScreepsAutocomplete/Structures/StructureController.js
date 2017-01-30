/**
 * Claim this structure to take control over the room.
 * The controller structure cannot be damaged or destroyed.
 * It can be addressed by Room.controller property.
 *
 * @class
 * @extends {OwnedStructure}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/207711889-StructureController}
 */
StructureController = function() { };

StructureController.prototype =
{

    /**
     * Ticks left before another safeMode can be used
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207711889-StructureController#safeModeCooldown}
     *
     * @type {number}
     */
    safeModeCooldown: 0,
    
    /**
     * The number of available safeMode activations
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207711889-StructureController#safeModeAvailable}
     *
     * @type {number}
     */
    safeModeAvailable: 0,

    /**
     * Returns if safeMode is active. If not this will return undefined, not false.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207711889-StructureController#safeMode}
     *
     * @type {Boolean|undefined}
     */
    safeMode: undefined,

    /**
     * Triggers the activation of a saveMode if possible and available
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207711889-StructureController#activateSafeMode}
     *
     * @type {function}
     *
     * @return {OK|ERR_NOT_OWNER|ERR_NOT_ENOUGH_RESOURCES|ERR_TIRED}
     */
    activateSafeMode: function() {},
    
    /**
     * Current controller level, from 0 to 8.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207711889-StructureController#level}
     *
     * @type {number}
     */
    level: 0,

    /**
     * The current progress of upgrading the controller to the next level.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207711889-StructureController#progress}
     *
     * @type {number}
     */
    progress: 0,

    /**
     * The progress needed to reach the next level.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207711889-StructureController#progressTotal}
     *
     * @type {number}
     */
    progressTotal: 0,

    /**
     * An object with the controller reservation info if present
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207711889-StructureController#reservation}
     *
     * @type {null|{username: string, ticksToEnd: number}}
     */
    reservation: {},

    /**
     * The amount of game ticks when this controller will lose one level.
     * This timer can be reset by using Creep.upgradeController.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207711889-StructureController#ticksToDowngrade}
     *
     * @type {number}
     */
    ticksToDowngrade: 0,

    /**
     * The amount of game ticks while this controller cannot be upgraded due to attack.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207711889-StructureController#upgradeBlocked}
     *
     * @type {number}
     */
    upgradeBlocked: 0,

    /**
     * Make your claimed controller neutral again.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207711889-StructureController#unclaim}
     *
     * @type {function}
     *
     * @return {number|OK|ERR_NOT_OWNER}
     */
    unclaim: function() { }
};

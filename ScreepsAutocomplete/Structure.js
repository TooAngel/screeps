/**
 * The base prototype object of all structures.
 * @class
 * @extends {RoomObject}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/203079221-Structure}
 */
Structure = function() { };

Structure.prototype =
{
    /**
     * The current amount of hit points of the structure.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079221-Structure#hits}
     *
     * @type {number}
     */
    hits: 0,

    /**
     * The total amount of hit points of the structure.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079221-Structure#hitsMax}
     *
     * @type {number}
     */
    hitsMax: 0,

    /**
     * A unique object identificator.
     * You can use Game.getObjectById method to retrieve an object instance by its id.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079221-Structure#id}
     *
     * @type {string}
     */
    id: "",

    /**
     * One of the STRUCTURE_* constants.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079221-Structure#structureType}
     *
     * @type {string}
     */
    structureType: "",

    /**
     * Destroy this structure immediately.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079221-Structure#destroy}
     *
     * @type {function}
     *
     * @return {number|OK|ERR_NOT_OWNER}
     */
    destroy: function() { },

    /**
     * Check whether this structure can be used.
     * If the room controller level is not enough,
     * then this method will return false, and the structure will be highlighted with red in the game.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079221-Structure#isActive}
     *
     * @type {function}
     *
     * @return {boolean}
     */
    isActive: function() { },

    /**
     * Toggle auto notification when the structure is under attack.
     * The notification will be sent to your account email.
     * Turned on by default.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079221-Structure#notifyWhenAttacked}
     *
     * @type {function}
     *
     * @param {boolean} enabled Whether to enable notification or disable.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_INVALID_ARGS}
     */
    notifyWhenAttacked: function(enabled) { }
};

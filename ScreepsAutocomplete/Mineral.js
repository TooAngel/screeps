/**
 * A mineral deposit.
 * Can be harvested by creeps with a WORK body part using the extractor structure.
 *
 * @class
 * @extends {RoomObject}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/207218579-Mineral}
 */
Mineral = function() { };

Mineral.prototype =
{
    /**
     * The remaining amount of resources.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207218579-Mineral#mineralAmount}
     *
     * @type {number}
     */
    mineralAmount: 0,

    /**
     * The resource type, one of the RESOURCE_* constants.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207218579-Mineral#mineralType}
     *
     * @type {number}
     */
    mineralType: 0,

    /**
     * A unique object identificator.
     * You can use Game.getObjectById method to retrieve an object instance by its id.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207218579-Mineral#id}
     *
     * @type {string}
     */
    id: "",

    /**
     * The remaining time after which the deposit will be refilled.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207218579-Mineral#ticksToRegeneration}
     *
     * @type {number}
     */
    ticksToRegeneration: 0
};

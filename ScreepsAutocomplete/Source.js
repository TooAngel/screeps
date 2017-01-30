/**
 * An energy source object.
 * Can be harvested by creeps with a WORK body part.
 *
 * @class
 * @extends {RoomObject}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/203079211-Source}
 */
Source = function() { };

Source.prototype =
{
    /**
     * The remaining amount of energy.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079211-Source#energy}
     *
     * @type {number}
     */
    energy: 0,

    /**
     * The total amount of energy in the source.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079211-Source#energyCapacity}
     *
     * @type {number}
     */
    energyCapacity: 0,

    /**
     * A unique object identificator.
     * You can use Game.getObjectById method to retrieve an object instance by its id.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079211-Source#id}
     *
     * @type {string}
     */
    id: "",

    /**
     * The remaining time after which the source will be refilled.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079211-Source#ticksToRegeneration}
     *
     * @type {number}
     */
    ticksToRegeneration: 0
};

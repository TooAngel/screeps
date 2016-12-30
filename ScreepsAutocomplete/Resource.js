/**
 * A dropped piece of resource.
 * It will decay after a while if not picked up.
 * Dropped resource pile decays for ceil(amount/1000) units per tick.
 *
 * @class
 * @extends {RoomObject}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/203016362-Resource}
 */
Resource = function() { };

Resource.prototype =
{
    /**
     * The amount of resource units containing.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016362-Resource#amount}
     *
     * @type {number}
     */
    amount: 0,

    /**
     * A unique object identificator.
     * You can use Game.getObjectById method to retrieve an object instance by its id.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016362-Resource#id}
     *
     * @type {string}
     */
    id: "",

    /**
     * One of the RESOURCE_* constants.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016362-Resource#resourceType}
     *
     * @type {string}
     */
    resourceType: ""
};
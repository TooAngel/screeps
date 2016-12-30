/**
 * A site of a structure which is currently under construction.
 * A construction site can be created using the 'Construct' button at the left of the game field or the Room.createConstructionSite method.
 * To build a structure on the construction site, give a worker creep some amount of energy and perform Creep.build action.
 *
 * @class
 * @extends {RoomObject}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/203016342-ConstructionSite}
 */
ConstructionSite = function() { };

ConstructionSite.prototype =
{
    /**
     * A unique object identificator.
     * You can use Game.getObjectById method to retrieve an object instance by its id.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016342-ConstructionSite#id}
     *
     * @type {string}
     */
    id: "",

    /**
     * Whether this is your own construction site.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016342-ConstructionSite#my}
     *
     * @type {boolean}
     */
    my: true,

    /**
     * An object with the structure’s owner info
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016342-ConstructionSite#owner}
     *
     * @type {{username: ""}}
     */
    owner:
    {
        username: ""
    },

    /**
     * The current construction progress.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016342-ConstructionSite#progress}
     *
     * @type {number}
     */
    progress: 0,

    /**
     * The total construction progress needed for the structure to be built.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016342-ConstructionSite#progressTotal}
     *
     * @type {number}
     */
    progressTotal: 0,

    /**
     * One of the STRUCTURE_* constants.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016342-ConstructionSite#structureType}
     *
     * @type {string}
     */
    structureType: "",

    /**
     * Remove the construction site.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016342-ConstructionSite#remove}
     *
     * @type {function}
     *
     * @return {number|OK|ERR_NOT_OWNER}
     */
    remove: function() { }
};

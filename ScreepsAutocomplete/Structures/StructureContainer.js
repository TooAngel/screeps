/**
 * A small container that can be used to store resources.
 * This is a walkable structure.
 * All dropped resources automatically goes to the container at the same tile.
 *
 * @class
 * @extends {Structure}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/208435885-StructureContainer}
 */
StructureContainer = function() { };

StructureContainer.prototype =
{


    /**
     * An object with the structure contents.
     * Each object key is one of the RESOURCE_* constants, values are resources amounts.
     * Use _.sum(structure.store) to get the total amount of contents.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208435885-StructureContainer#store}
     *
     * @type {Array<string, number>}
     */
    store: {},

    /**
     * The total amount of resources the structure can contain.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208435885-StructureContainer#storeCapacity}
     *
     * @type {number}
     */
    storeCapacity: 0,

    /**
     * @deprecated Since version 2016-07-11, replaced by `Creep.withdraw()`.
     *
     * Transfer resource from this structure to a creep.
     * The target has to be at adjacent square.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208435885-StructureContainer#transfer}
     *
     * @type {function}
     *
     * @param {Creep} target The target object.
     * @param {string} resourceType One of the RESOURCE_* constants.
     * @param {number|undefined|null} [amount] The amount of resources to be transferred. If omitted, all the available amount is used.
     *
     * @return {number|OK|ERR_NOT_ENOUGH_RESOURCES|ERR_INVALID_TARGET|ERR_FULL|ERR_NOT_IN_RANGE|ERR_INVALID_ARGS}
     */
    transfer: function(target, resourceType, amount) { }
};

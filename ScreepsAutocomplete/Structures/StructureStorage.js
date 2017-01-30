/**
 * A structure that can store huge amount of resource units.
 * Only one structure per room is allowed that can be addressed by Room.storage property.
 *
 * @class
 * @extends {OwnedStructure}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/208436805-StructureStorage}
 */
StructureStorage = function() { };

StructureStorage.prototype =
{
    /**
     * An object with the storage contents.
     * Each object key is one of the RESOURCE_* constants, values are resources amounts.
     * Use _.sum(structure.store) to get the total amount of contents.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208436805-StructureStorage#store}
     *
     * @type {Array<string, number>}
     */
    store: {},

    /**
     * The total amount of resources the storage can contain.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208436805-StructureStorage#storeCapacity}
     *
     * @type {number}
     */
    storeCapacity: 0,

    /**
     * @deprecated Since version 2016-07-11, replaced by `Creep.withdraw()`.
     *
     * Transfer resource from this storage to a creep.
     * The target has to be at adjacent square.
     * You can transfer resources to your creeps from hostile structures as well.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208436805-StructureStorage#transfer}
     *
     * @type {function}
     *
     * @param {Creep} target The target object.
     * @param {string} resourceType One of the RESOURCE_* constants.
     * @param {number|undefined|null} [amount] The amount of resources to be transferred. If omitted, all the available amount is used.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_NOT_ENOUGH_RESOURCES|ERR_INVALID_TARGET|ERR_FULL|ERR_NOT_IN_RANGE|ERR_INVALID_ARGS}
     */
    transfer: function(target, resourceType, amount) { }
};

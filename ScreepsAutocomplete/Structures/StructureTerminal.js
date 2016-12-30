/**
 * Sends any resources to a Terminal in another room.
 * The destination Terminal can belong to any player.
 * If its storage is full, the resources are dropped on the ground.
 * Each transaction requires additional energy (regardless of the transfer resource type) that can be calculated using Game.market.calcTransactionCost method.
 * For example, sending 1000 mineral units from W0N0 to W10N5 will consume 742 energy units.
 * You can track your incoming and outgoing transactions and estimate range cost between rooms using the Game.market object.
 * Only one Terminal per room is allowed that can be addressed by Room.terminal property.
 *
 * @class
 * @extends {OwnedStructure}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/207713399-StructureTerminal}
 */
StructureTerminal = function() { };

StructureTerminal.prototype =
{
    /**
     * An object with the storage contents.
     * Each object key is one of the RESOURCE_* constants, values are resources amounts.
     * Use _.sum(structure.store) to get the total amount of contents.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207713399-StructureTerminal#store}
     *
     * @type {Array<string, number>}
     */
    store: {},

    /**
     * The total amount of resources the storage can contain.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207713399-StructureTerminal#storeCapacity}
     *
     * @type {number}
     */
    storeCapacity: 0,

    /**
     * Sends resource to a Terminal in another room with the specified name.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207713399-StructureTerminal#send}
     *
     * @type {function}
     *
     * @param {string} resourceType One of the RESOURCE_* constants.
     * @param {number} amount The amount of resources to be sent. The minimum amount is 100.
     * @param {string|undefined|null} [destination] The name of the target room. You don't have to gain visibility in this room.
     * @param {string|undefined|null} [description] The description of the transaction. It is visible to the recipient. The maximum length is 100 characters.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_NOT_ENOUGH_RESOURCES|ERR_INVALID_ARGS}
     */
    send: function(resourceType, amount, destination, description) { },

    /**
     * @deprecated Since version 2016-07-11, replaced by `Creep.withdraw()`.
     *
     * Transfer resource from this terminal to a creep.
     * The target has to be at adjacent square.
     * You can transfer resources to your creeps from hostile structures as well.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207713399-StructureTerminal#transfer}
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

/**
 *
 * @class
 * @extends {RoomObject}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep}
 */
Creep = function() { };

Creep.prototype =
{
    /**
     * An array describing the creep’s body
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#body}
     *
     * @type {Array<{boost:string, type:string, hits:number}>}
     *
     * @note boost: If the body part is boosted, this property specifies the mineral type which is used for boosting. One of the RESOURCE_* constants.
     * @note type: One of the body part types constants.
     * @note hits: The remaining amount of hit points of this body part.
     *
     */
    body: [],

    /**
     * An object with the creep's cargo contents.
     * Each object key is one of the RESOURCE_* constants, values are resources amounts.
     * Use _.sum(creep.carry) to get the total amount of contents.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#carry}
     *
     * @type {object<string, number>}
     */
    carry: {},

    /**
     * The total amount of resources the creep can carry.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#carryCapacity}
     *
     * @type {number}
     */
    carryCapacity: 0,

    /**
     * The movement fatigue indicator. If it is greater than zero, the creep cannot move.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#fatigue}
     *
     * @type {number}
     */
    fatigue: 0,

    /**
     * The current amount of hit points of the creep.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#hits}
     *
     * @type {number}
     */
    hits: 0,

    /**
     * The maximum amount of hit points of the creep.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#hitsMax}
     *
     * @type {number}
     */
    hitsMax: 0,

    /**
     * A unique object identificator.
     * You can use Game.getObjectById method to retrieve an object instance by its id.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#id}
     *
     * @type {string}
     */
    id: "",

    /**
     * A shorthand to Memory.creeps[creep.name].
     * You can use it for quick access the creep’s specific memory data object.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#memory}
     *
     * @type {*}
     */
    memory: {},

    /**
     * Whether it is your creep or foe.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#my}
     *
     * @type {boolean}
     */
    my: true,

    /**
     * Creep’s name.
     * You can choose the name while creating a new creep, and it cannot be changed later.
     * This name is a hash key to access the creep via the Game.creeps object.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#name}
     *
     * @type {string}
     */
    name: "",

    /**
     * The text message that the creep was saying at the last tick.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#saying}
     *
     * @type {string}
     */
    saying: "",

    /**
     * An object with the creep’s owner info
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#owner}
     *
     * @type {{username:string}}
     */
    owner:
    {
        username: ""
    },

    /**
     * Whether this creep is still being spawned.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#spawning}
     *
     * @type {boolean}
     */
    spawning: false,

    /**
     * The remaining amount of game ticks after which the creep will die.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#ticksToLive}
     *
     * @type {number}
     */
    ticksToLive: 0,

    /**
     * Attack another creep or structure in a short-ranged attack.
     * Requires the ATTACK body part.
     * If the target is inside a rampart, then the rampart is attacked instead.
     * The target has to be at adjacent square to the creep.
     * If the target is a creep with ATTACK body parts and is not inside a rampart, it will automatically hit back at the attacker.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#attack}
     *
     * @type {function}
     *
     * @param {Creep|Spawn|Structure} target The target object to be attacked.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_INVALID_TARGET|ERR_NOT_IN_RANGE|ERR_NO_BODYPART}
     */
    attack: function(target) { },

    /**
     * Decreases the controller's downgrade or reservation timer for 1 tick per every 5 CLAIM body parts (so the creep must have at least 5xCLAIM).
     * The controller under attack cannot be upgraded for the next 1,000 ticks.
     * The target has to be at adjacent square to the creep.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#attackController}
     *
     * @type {function}
     *
     * @param {StructureController} target The target controller object.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_INVALID_TARGET|ERR_NOT_IN_RANGE|ERR_NO_BODYPART}
     */
    attackController: function(target) { },

    /**
     * Build a structure at the target construction site using carried energy.
     * Requires WORK and CARRY body parts.
     * The target has to be within 3 squares range of the creep.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#build}
     *
     * @type {function}
     *
     * @param {ConstructionSite} target The target construction site to be built.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_NOT_ENOUGH_RESOURCES|ERR_INVALID_TARGET|ERR_NOT_IN_RANGE|ERR_NO_BODYPART|ERR_RCL_NOT_ENOUGH}
     */
    build: function(target) { },

    /**
     * Cancel the order given during the current game tick.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#cancelOrder}
     *
     * @type {function}
     *
     * @param {string} methodName The name of a creep's method to be cancelled.
     *
     * @return {number|OK|ERR_NOT_FOUND}
     */
    cancelOrder: function(methodName) { },

    /**
     * Claims a neutral controller under your control.
     * Requires the CLAIM body part.
     * The target has to be at adjacent square to the creep.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#claimController}
     *
     * @type {function}
     *
     * @param {StructureController} target The target controller object.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_INVALID_TARGET|ERR_FULL|ERR_NOT_IN_RANGE|ERR_NO_BODYPART|ERR_GCL_NOT_ENOUGH}
     */
    claimController: function(target) { },

    /**
     * Dismantles any (even hostile) structure returning 50% of the energy spent on its repair.
     * Requires the WORK body part.
     * If the creep has an empty CARRY body part, the energy is put into it; otherwise it is dropped on the ground.
     * The target has to be at adjacent square to the creep.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#dismantle}
     *
     * @type {function}
     *
     * @param {Spawn|Structure} target The target structure.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_INVALID_TARGET|ERR_NOT_IN_RANGE|ERR_NO_BODYPART}
     */
    dismantle: function(target) { },

    /**
     * Drop this resource on the ground.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#drop}
     *
     * @type {function}
     *
     * @param {string} resourceType One of the RESOURCE_* constants.
     * @param {number} [amount] The amount of resource units to be dropped. If omitted, all the available carried amount is used.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_NOT_ENOUGH_RESOURCES}
     */
    drop: function(resourceType, amount) { },

    /**
     * Get the quantity of live body parts of the given type.
     * Fully damaged parts do not count.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#getActiveBodyparts}
     *
     * @type {function}
     *
     * @param {string} type A body part type, one of the following body part constants: MOVE, WORK, CARRY, ATTACK, RANGED_ATTACK, HEAL, TOUGH
     *
     * @return {number} A number representing the quantity of body parts.
     */
    getActiveBodyparts: function(type) { },

    /**
     * Harvest energy from the source or minerals from the mineral deposit.
     * Requires the WORK body part.
     * If the creep has an empty CARRY body part, the harvested resource is put into it; otherwise it is dropped on the ground.
     * The target has to be at an adjacent square to the creep.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#harvest}
     *
     * @type {function}
     *
     * @param {Source|Mineral} target The object to be harvested.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_NOT_FOUND|ERR_NOT_ENOUGH_RESOURCES|ERR_INVALID_TARGET|ERR_NOT_IN_RANGE|ERR_NO_BODYPART}
     */
    harvest: function(target) { },

    /**
     * Heal self or another creep.
     * It will restore the target creep’s damaged body parts function and increase the hits counter.
     * Requires the HEAL body part.
     * The target has to be at adjacent square to the creep.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#heal}
     *
     * @type {function}
     *
     * @param {Creep} target The target creep object.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_INVALID_TARGET|ERR_NOT_IN_RANGE|ERR_NO_BODYPART}
     */
    heal: function(target) { },

    /**
     * Move the creep one square in the specified direction.
     * Requires the MOVE body part.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#move}
     *
     * @type {function}
     *
     * @param {number} direction One of the following constants: TOP, TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT, TOP_LEFT
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_TIRED|ERR_NO_BODYPART}
     */
    move: function(direction) { },

    /**
     * Move the creep using the specified predefined path.
     * Requires the MOVE body part.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#moveByPath}
     *
     * @type {function}
     *
     * @param {Array|string} path A path value as returned from Room.findPath or RoomPosition.findPathTo methods. Both array form and serialized string form are accepted.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_NOT_FOUND|ERR_INVALID_ARGS|ERR_TIRED|ERR_NO_BODYPART}
     */
    moveByPath: function(path) { },

    /**
     * Find the optimal path to the target within the same room and move to it.
     * A shorthand to consequent calls of pos.findPathTo() and move() methods.
     * If the target is in another room, then the corresponding exit will be used as a target.
     * Requires the MOVE body part.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#moveTo}
     *
     * @type {function}
     *
     * @param {number} x X position of the target in the same room.
     * @param {number} [y] Y position of the target in the same room.
     * @param {object} [opts] An object containing additional options
     * @param {number} [opts.reusePath] This option enables reusing the path found along multiple game ticks. It allows to save CPU time, but can result in a slightly slower creep reaction behavior. The path is stored into the creep's memory to the _move property. The reusePath value defines the amount of ticks which the path should be reused for. The default value is 5. Increase the amount to save more CPU, decrease to make the movement more consistent. Set to 0 if you want to disable path reusing.
     * @param {boolean} [opts.serializeMemory] If reusePath is enabled and this option is set to true, the path will be stored in memory in the short serialized form using Room.serializePath. The default value is true.
     * @param {boolean} [opts.noPathFinding] If this option is set to true, moveTo method will return ERR_NOT_FOUND if there is no memorized path to reuse. This can significantly save CPU time in some cases. The default value is false.
     * @note opts also supports any method from the Room.findPath options.
     *
     * @alias moveTo(target, [opts])
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_TIRED|ERR_NO_BODYPART|ERR_INVALID_TARGET|ERR_NO_PATH}
     */
    moveTo: function(x, y, opts) { },

    /**
     * Toggle auto notification when the creep is under attack.
     * The notification will be sent to your account email.
     * Turned on by default.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#notifyWhenAttacked}
     *
     * @type {function}
     *
     * @param {boolean} enabled Whether to enable notification or disable.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_INVALID_ARGS}
     */
    notifyWhenAttacked: function(enabled) { },

    /**
     * Pick up an item (a dropped piece of energy).
     * Requires the CARRY body part.
     * The target has to be at adjacent square to the creep or at the same square.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#pickup}
     *
     * @type {function}
     *
     * @param {Resource} target The target object to be picked up.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_INVALID_TARGET|ERR_FULL|ERR_NOT_IN_RANGE}
     */
    pickup: function(target) { },

    /**
     * A ranged attack against another creep or structure.
     * Requires the RANGED_ATTACK body part.
     * If the target is inside a rampart, the rampart is attacked instead.
     * The target has to be within 3 squares range of the creep.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#rangedAttack}
     *
     * @type {function}
     *
     * @param {Creep|Spawn|Structure} target The target object to be attacked.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_INVALID_TARGET|ERR_NOT_IN_RANGE|ERR_NO_BODYPART}
     */
    rangedAttack: function(target) { },

    /**
     * Heal another creep at a distance.
     * It will restore the target creep’s damaged body parts function and increase the hits counter.
     * Requires the HEAL body part.
     * The target has to be within 3 squares range of the creep.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#rangedHeal}
     *
     * @type {function}
     *
     * @param {Creep} target The target creep object.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_INVALID_TARGET|ERR_NOT_IN_RANGE|ERR_NO_BODYPART}
     */
    rangedHeal: function(target) { },

    /**
     * A ranged attack against all hostile creeps or structures within 3 squares range.
     * Requires the RANGED_ATTACK body part.
     * The attack power depends on the range to each target.
     * Friendly units are not affected.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#rangedMassAttack}
     *
     * @type {function}
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_NO_BODYPART}
     */
    rangedMassAttack: function() { },

    /**
     * Repair a damaged structure using carried energy.
     * Requires the WORK and CARRY body parts.
     * The target has to be within 3 squares range of the creep.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#repair}
     *
     * @type {function}
     *
     * @param {Spawn|Structure} target The target structure to be repaired.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_NOT_ENOUGH_RESOURCES|ERR_INVALID_TARGET|ERR_NOT_IN_RANGE|ERR_NO_BODYPART}
     */
    repair: function(target) { },

    /**
     * Temporarily block a neutral controller from claiming by other players.
     * Each tick, this command increases the counter of the period during which the controller is unavailable by 1 tick per each CLAIM body part.
     * The maximum reservation period to maintain is 5,000 ticks.
     * The target has to be at adjacent square to the creep.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#reserveController}
     *
     * @type {function}
     *
     * @param {StructureController} target The target controller object to be reserved.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_INVALID_TARGET|ERR_NOT_IN_RANGE|ERR_NO_BODYPART}
     */
    reserveController: function(target) { },

    /**
     * Display a visual speech balloon above the creep with the specified message. The message will be
     * available for one tick. You can read the last message using the saying property.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#say}
     *
     * @type {function}
     *
     * @param {string} message The message to be displayed. Maximum length is 10 characters.
     * @param {boolean} [public] Set to true to allow other players to see this message. Default is false.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY}
     */
    say: function(message, public) { },

    /**
     * Kill the creep immediately.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#suicide}
     *
     * @type {function}
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY}
     */
    suicide: function() { },

    /**
     * Transfer resource from the creep to another object.
     * The target has to be at adjacent square to the creep.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#transfer}
     *
     * @type {function}
     *
     * @param {Creep|Spawn|Structure} target The target object.
     * @param {string} resourceType One of the RESOURCE_* constants.
     * @param {number|undefined|null} [amount] The amount of resources to be transferred. If omitted, all the available carried amount is used.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_NOT_ENOUGH_RESOURCES|ERR_INVALID_TARGET|ERR_FULL|ERR_NOT_IN_RANGE|ERR_INVALID_ARGS}
     */
    transfer: function(target, resourceType, amount) { },

    /**
     * Upgrade your controller to the next level using carried energy.
     * Upgrading controllers raises your Global Control Level in parallel.
     * Requires WORK and CARRY body parts.
     * The target has to be within 3 squares range of the creep.
     * A fully upgraded level 8 controller can't be upgraded with the power over 15 energy units per tick regardless of creeps power.
     * The cumulative effect of all the creeps performing upgradeController in the current tick is taken into account.
     * The effect can be boosted by ghodium mineral compounds (including limit increase).
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#upgradeController}
     *
     * @type {function}
     *
     * @param {StructureController} target The target controller object to be upgraded.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_NOT_ENOUGH_RESOURCES|ERR_INVALID_TARGET|ERR_NOT_IN_RANGE|ERR_NO_BODYPART}
     */
    upgradeController: function(target) { },

    /**
     * Withdraw resources from a structure.
     * The target has to be at adjacent square to the creep.
     * Multiple creeps can withdraw from the same structure in the same tick.
     * Your creeps can withdraw resources from hostile structures as well, in case if there is no hostile rampart on top of it.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203013212-Creep#withdraw}
     *
     * @type {function}
     *
     * @param {Structure} target The target object.
     * @param {string} resourceType One of the RESOURCE_* constants.
     * @param {number|undefined|null} [amount] The amount of resources to be transferred. If omitted, all the available carried amount is used.
     *
     * @return {number|OK|ERR_NOT_OWNER|ERR_BUSY|ERR_NOT_ENOUGH_RESOURCES|ERR_INVALID_TARGET|ERR_FULL|ERR_NOT_IN_RANGE|ERR_INVALID_ARGS}
     */
    withdraw: function(target, resourceType, amount) { }
};

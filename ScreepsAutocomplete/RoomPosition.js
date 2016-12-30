/**
 * An object representing the specified position in the room.
 * Every object in the room contains RoomPosition as the pos property.
 * The position object of a custom location can be obtained using the Room.getPositionAt() method or using the constructor.
 *
 * @param {number} x X position in the room.
 * @param {number} y Y position in the room.
 * @param {string} roomName The room name.
 *
 * @class
 * @constructor
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/203079201-RoomPosition}
 */
RoomPosition = function(x, y, roomName) { };

RoomPosition.prototype =
{
    /**
     * The name of the room.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079201-RoomPosition#roomName}
     *
     * @type {string}
     */
    roomName: "",

    /**
     * X position in the room.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079201-RoomPosition#x}
     *
     * @type {number}
     */
    x: 0,

    /**
     * Y position in the room.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079201-RoomPosition#y}
     *
     * @type {number}
     */
    y: 0,

    /**
     * Create new ConstructionSite at the specified location.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079201-RoomPosition#createConstructionSite}
     *
     * @type {function}
     *
     * @param {string} structureType One of the STRUCTURE_* constants.
     *
     * @return {number|OK|ERR_INVALID_TARGET|ERR_FULL|ERR_INVALID_ARGS|ERR_RCL_NOT_ENOUGH}
     */
    createConstructionSite: function(structureType) { },

    /**
     * Create new Flag at the specified location.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079201-RoomPosition#createFlag}
     *
     * @type {function}
     *
     * @param {string} [name] The name of a new flag. It should be unique, i.e. the Game.flags object should not contain another flag with the same name (hash key). If not defined, a random name will be generated.
     * @param {string} [color] The color of a new flag. Should be one of the COLOR_* constants. The default value is COLOR_WHITE.
     * @param {string} [secondaryColor] The secondary color of a new flag. Should be one of the COLOR_* constants. The default value is equal to color.
     *
     * @return {string|number|ERR_NAME_EXISTS|ERR_INVALID_ARGS}
     */
    createFlag: function(name, color, secondaryColor) { },

    /**
     * Find an object with the shortest path from the given position.
     * Uses A* search algorithm and Dijkstra's algorithm.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079201-RoomPosition#findClosestByPath}
     *
     * @type {function}
     *
     * @param {number|Array<RoomPosition>|Array<RoomObject>} type See Room.find.
     * @param {object} [opts] An object containing pathfinding options (see Room.findPath)
     * @param {object|function|string} [opts.filter] Only the objects which pass the filter using the Lodash.filter method will be used.
     * @param {string} [opts.algorithm] One of the following constants:
                                        astar is faster when there are relatively few possible targets;
                                        dijkstra is faster when there are a lot of possible targets or when the closest target is nearby.
                                        The default value is determined automatically using heuristics.

     * @note Alternative function: findClosestByPath: function(objects, opts)
     * @param {array} objects An array of room's objects or RoomPosition objects that the search should be executed against.

     * @return {object|null} The closest object if found, null otherwise.
     */
    findClosestByPath: function(type, opts) { },

    /**
     * Find an object with the shortest linear distance from the given position.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079201-RoomPosition#findClosestByRange}
     *
     * @type {function}
     *
     * @param {number|Array<RoomPosition>|Array<RoomObject>} type See Room.find.
     * @param {object} [opts]
     * @param {object|function|string} [opts.filter] Only the objects which pass the filter using the Lodash.filter method will be used.
     *
     * @note Alterative function: findClosestByRange: function(objects, opts)
     * @param {array} objects An array of room's objects or RoomPosition objects that the search should be executed against.
     *
     * @return {object|null} The closest object if found, null otherwise.
     */
    findClosestByRange: function(type, opts) { },

    /**
     * Find all objects in the specified linear range.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079201-RoomPosition#findInRange}
     *
     * @type {function}
     *
     * @param {number|Array<RoomPosition>|Array<RoomObject>} type See Room.find.
     * @param {number} range The range distance.
     * @param {object} [opts] See Room.find.
     *
     * @note Alternative function: findInRange(objects, range, opts)
     * @param {array} objects An array of room's objects or RoomPosition objects that the search should be executed against.
     *
     * @return {array} An array with the objects found.
     */
    findInRange: function(type, range, opts) { },

    /**
     * Find an optimal path to the specified position using A* search algorithm.
     * This method is a shorthand for Room.findPath.
     * If the target is in another room, then the corresponding exit will be used as a target.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079201-RoomPosition#findPathTo}
     *
     * @type {function}
     *
     * @param {number|RoomPosition|RoomObject} x X position in the room.
     * @param {number} [y] Y position in the room.
     * @param {object} [opts] An object containing pathfinding options flags (see Room.findPath for more details).
     *
     * @note Alternative function: findPathTo(target, opts)
     * @param {object} target Can be a RoomPosition object or any object containing RoomPosition.
     *
     * @return {array} An array with path steps in the following format:
                         [
                            { x: 10, y: 5, dx: 1,  dy: 0, direction: RIGHT },
                            { x: 10, y: 6, dx: 0,  dy: 1, direction: BOTTOM },
                            { x: 9,  y: 7, dx: -1, dy: 1, direction: BOTTOM_LEFT },
                             ...
                         ]
     */
    findPathTo: function(x, y, opts) { },

    /**
     * Get linear direction to the specified position.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079201-RoomPosition#getDirectionTo}
     *
     * @type {function}
     *
     * @param {number|RoomPosition|RoomObject} x X position in the room.
     * @param {number} [y] Y position in the room.
     *
     * @note Alternative function: getDirectionTo(target)
     * @param {object} target Can be a RoomPosition object or any object containing RoomPosition.
     *
     * @return {number|TOP|TOP_RIGHT|RIGHT|BOTTOM_RIGHT|BOTTOM|BOTTOM_LEFT|LEFT|TOP_LEFT} A number representing one of the direction constants.
     */
    getDirectionTo: function(x, y) { },

    /**
     * Get linear range to the specified position.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079201-RoomPosition#getRangeTo}
     *
     * @type {function}
     *
     * @param {number|RoomPosition|RoomObject} x X position in the room.
     * @param {number} [y] Y position in the room.
     *
     * @note Alternative function: getRangeTo(target)
     * @param {object} target Can be a RoomPosition object or any object containing RoomPosition.
     *
     * @return {number} A number of squares to the given position.
     */
    getRangeTo: function(x, y) { },

    /**
     * Check whether this position is in the given range of another position.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079201-RoomPosition#inRangeTo}
     *
     * @type {function}
     *
     * @param {number|RoomPosition|RoomObject} x X position in the room.
     * @param {number} [y] Y position in the room.
     * @param {number} range The range distance.
     *
     *
     * @note Alternative function: inRangeTo(target, range)
     * @param {RoomPosition} target The target position.
     *
     * @return {boolean}
     */
    inRangeTo: function(x, y, range) { },

    /**
     * Check whether this position is the same as the specified position.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079201-RoomPosition#isEqualTo}
     *
     * @type {function}
     *
     * @param {number|RoomPosition|RoomObject} x X position in the room.
     * @param {number} [y] Y position in the room.
     *
     * @note Alternative function: isEqualTo(target)
     * @param {object} target Can be a RoomPosition object or any object containing RoomPosition.
     *
     * @return {boolean}
     */
    isEqualTo: function(x, y) { },

    /**
     * Check whether this position is on the adjacent square to the specified position.
     * The same as inRangeTo(target, 1)
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079201-RoomPosition#isNearTo}
     *
     * @type {function}
     *
     * @param {number|RoomPosition|RoomObject} x X position in the room.
     * @param {number} [y] Y position in the room.
     *
     * @note Alternative function: isNearTo(target)
     * @param {object} target Can be a RoomPosition object or any object containing RoomPosition.
     *
     * @return {boolean}
     */
    isNearTo: function(x, y) { },

    /**
     * Get the list of objects at the specified room position.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079201-RoomPosition#look}
     *
     * @type {function}
     *
     * @return {array} An array with objects at the specified position in the following format:
                         [
                            { type: 'creep', creep: {...} },
                            { type: 'structure', structure: {...} },
                            ...
                            { type: 'terrain', terrain: 'swamp' }
                         ]
     */
    look: function() { },

    /**
     * Get an object with the given type at the specified room position.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079201-RoomPosition#lookFor}
     *
     * @type {function}
     *
     * @param {string} type One of the LOOK_* constants.
     *
     * @return {array} An array of objects of the given type at the specified position if found.
     */
    lookFor: function(type) { }
};

/**
 * An object representing the room in which your units and structures are in.
 * It can be used to look around, find paths, etc.
 * Every object in the room contains its linked Room instance in the room property.
 *
 * @class
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room}
 */
Room = {
    /**
     * Serialize a path array into a short string representation, which is suitable to store in memory.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#serializePath}
     *
     * @type {function}
     *
     * @param {Array} path A path array retrieved from Room.findPath.
     *
     * @return {string} A serialized string form of the given path.
     */
    serializePath: function(path) { },

    /**
     * Deserialize a short string path representation into an array form.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#deserializePath}
     *
     * @type {function}
     *
     * @param {string} path A serialized path string.
     *
     * return {Array} A path array.
     */
    deserializePath: function(path) { }
};

Room.prototype =
{
    /**
     * The Controller structure of this room, if present, otherwise undefined.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#controller}
     *
     * @type {undefined|StructureController}
     */
    controller: null,

    /**
     * Total amount of energy available in all spawns and extensions in the room.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#energyAvailable}
     *
     * @type {number}
     */
    energyAvailable: 0,

    /**
     * Total amount of energyCapacity of all spawns and extensions in the room.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#energyCapacityAvailable}
     *
     * @type {number}
     */
    energyCapacityAvailable: 0,

    /**
     * A shorthand to Memory.rooms[room.name].
     * You can use it for quick access the room’s specific memory data object.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#memory}
     *
     * @type {*}
     */
    memory: {},

    /**
     * The mode of the room
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#mode}
     *
     * @type {string|MODE_SIMULATION|MODE_SURVIVAL|MODE_WORLD|MODE_ARENA}
     */
    mode: "",

    /**
     * The name of the room.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#name}
     *
     * @type {string}
     */
    name: "",

    /**
     * The Storage structure of this room, if present, otherwise undefined.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#storage}
     *
     * @type {undefined|StructureStorage}
     */
    storage: null,

    /**
     * The Terminal structure of this room, if present, otherwise undefined.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#terminal}
     *
     * @type {undefined|StructureTerminal}
     */
    terminal: null,

    /**
     * Create new ConstructionSite at the specified location.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#createConstructionSite}
     *
     * @type {function}
     *
     * @param {number|RoomPosition|RoomObject} x The X position.
     * @param {number|string} [y] The Y position.
     * @param {string} [structureType] One of the STRUCTURE_* constants.
     *
     * @note Alternative function: createConstructionSite(pos, structureType)
     * @param {object} pos Can be a RoomPosition object or any object containing RoomPosition.
     *
     * @return {number|OK|ERR_INVALID_TARGET|ERR_FULL|ERR_INVALID_ARGS|ERR_RCL_NOT_ENOUGH}
     */
    createConstructionSite: function(x, y, structureType) { },

    /**
     * Create new Flag at the specified location.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#createFlag}
     *
     * @type {function}
     *
     * @param {number|RoomPosition|RoomObject} x The X position.
     * @param {number|string} y The Y position.
     * @param {string|string} [name] The name of a new flag. It should be unique, i.e. the Game.flags object should not contain another flag with the same name (hash key). If not defined, a random name will be generated.
     * @param {string} [color] The color of a new flag. Should be one of the COLOR_* constants. The default value is COLOR_WHITE.
     * @param {string} [secondaryColor] The secondary color of a new flag. Should be one of the COLOR_* constants. The default value is equal to color.
     *
     * @note Alternative function: createConstructionSite(pos, name, color, secondaryColor)
     * @param {object} pos Can be a RoomPosition object or any object containing RoomPosition.
     *
     * @return {number|ERR_NAME_EXISTS|ERR_INVALID_ARGS}
     */
    createFlag: function(x, y, name, color, secondaryColor) { },

    /**
     * Find all objects of the specified type in the room.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#find}
     *
     * @type {function}
     *
     * @param {number} type One of the FIND_* constants.
     * @param {object} [opts] An object with additional options
     * @param {object|function|string} [opts.filter] The result list will be filtered using the Lodash.filter method.
     *
     * @return {Array} An array with the objects found.
     */
    find: function(type, opts) { },

    /**
     * Find the exit direction en route to another room.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#findExitTo}
     *
     * @type {function}
     *
     * @param {string|Room} room Another room name or room object.
     *
     * @return {FIND_EXIT_TOP|FIND_EXIT_RIGHT|FIND_EXIT_BOTTOM|FIND_EXIT_LEFT|number|ERR_NO_PATH|ERR_INVALID_ARGS}
     */
    findExitTo: function(room) { },

    /**
     * Find an optimal path inside the room between fromPos and toPos using A* search algorithm.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#findPath}
     *
     * @type {function}
     *
     * @param {RoomPosition} fromPos The start position.
     * @param {RoomPosition} toPos The end position.
     * @param {object} [opts] An object containing additonal pathfinding flags
     * @param {boolean} [opts.ignoreCreeps] Treat squares with creeps as walkable. Can be useful with too many moving creeps around or in some other cases. The default value is false.
     * @param {boolean} [opts.ignoreDestructibleStructures] Treat squares with destructible structures (constructed walls, ramparts, spawns, extensions) as walkable. Use this flag when you need to move through a territory blocked by hostile structures. If a creep with an ATTACK body part steps on such a square, it automatically attacks the structure. The default value is false.
     * @param {boolean} [opts.ignoreRoads] Ignore road structures. Enabling this option can speed up the search. The default value is false. This is only used when the new PathFinder is enabled.
     * @param {function(string, CostMatrix)} [opts.costCallback] You can use this callback to modify a CostMatrix for any room during the search. The callback accepts two arguments, roomName and costMatrix. Use the costMatrix instance to make changes to the positions costs. If you return a new matrix from this callback, it will be used instead of the built-in cached one. This option is only used when the new PathFinder is enabled.
     * @param {Array} [opts.ignore] An array of the room's objects or RoomPosition objects which should be treated as walkable tiles during the search. This option cannot be used when the new PathFinder is enabled (use costCallback option instead).
     * @param {Array} [opts.avoid] An array of the room's objects or RoomPosition objects which should be treated as obstacles during the search. This option cannot be used when the new PathFinder is enabled (use costCallback option instead).
     * @param {number} [opts.maxOps] The maximum limit of possible pathfinding operations. You can limit CPU time used for the search based on ratio 1 op ~ 0.001 CPU. The default value is 2000.
     * @param {number} [opts.heuristicWeight] Weight to apply to the heuristic in the A* formula F = G + weight * H. Use this option only if you understand the underlying A* algorithm mechanics! The default value is 1.2.
     * @param {boolean} [opts.serialize] If true, the result path will be serialized using Room.serializePath. The default is false.
     * @param {number} [opts.maxRooms] The maximum allowed rooms to search. The default (and maximum) is 16. This is only used when the new PathFinder is enabled.
     *
     * @return {Array} An array with path steps in the following format:
                         [
                             { x: 10, y: 5, dx: 1,  dy: 0, direction: RIGHT },
                             { x: 10, y: 6, dx: 0,  dy: 1, direction: BOTTOM },
                             { x: 9,  y: 7, dx: -1, dy: 1, direction: BOTTOM_LEFT },
                             ...
                         ]

     */
    findPath: function(fromPos, toPos, opts) { },

    /**
     * Creates a RoomPosition object at the specified location.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#getPositionAt}
     *
     * @type {function}
     *
     * @param {number} x The X position.
     * @param {number} y The Y position.
     *
     * @return {null|RoomPosition}
     */
    getPositionAt: function(x, y) { },

    /**
     * Get the list of objects at the specified room position.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#lookAt}
     *
     * @type {function}
     *
     * @param {number} x X position in the room.
     * @param {number|RoomPosition|RoomObject} [y] Y position in the room.
     *
     * @note Alternative function: lookAt(target)
     * @param {object} target Can be a RoomPosition object or any object containing RoomPosition.
     *
     * @return {Array} An array with objects at the specified position in the following format:
                         [
                             { type: 'creep', creep: {...} },
                             { type: 'structure', structure: {...} },
                             ...
                             { type: 'terrain', terrain: 'swamp' }
                         ]
     */
    lookAt: function(x, y) { },

    /**
     * Get the list of objects at the specified room area.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#lookAtArea}
     *
     * @type {function}
     *
     * @param {number} top The top Y boundary of the area.
     * @param {number} left The left X boundary of the area.
     * @param {number} bottom The bottom Y boundary of the area.
     * @param {number} right The right X boundary of the area.
     * @param {boolean} [asArray] Set to true if you want to get the result as a plain array.
     *
     * @return {object} An object with all the objects in the specified area in the following format:
                        // 10,5,11,7
                         {
                            10 :
                            {
                                5 :
                                [
                                    {
                                        type : 'creep',
                                        creep :
                                        {
                                            ...
                                        }
                                    },
                                    {
                                        type : 'terrain',
                                        terrain : 'swamp'
                                    }
                                ],
                                6 :
                                [
                                    {
                                        type : 'terrain',
                                        terrain : 'swamp'
                                    }
                                ],
                                7 :
                                [
                                    {
                                        type : 'terrain',
                                        terrain : 'swamp'
                                    }
                                ]
                            },
                            11 :
                            {
                                5 :
                                [
                                    {
                                        type : 'terrain',
                                        terrain : 'normal'
                                    }
                                ],
                                6 :
                                [
                                    {
                                        type : 'structure',
                                        structure :
                                        {
                                            ...
                                        }
                                    },
                                    {
                                        type : 'terrain',
                                        terrain : 'swamp'
                                    }
                                ],
                                7 :
                                [
                                    {
                                        type : 'terrain',
                                        terrain : 'wall'
                                    }
                                ]
                            }
                        }
     */
    lookAtArea: function(top, left, bottom, right, asArray) { },

    /**
     * Get an object with the given type at the specified room position.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#lookForAt}
     *
     * @type {function}
     *
     * @param {string} type One of the LOOK_* constants.
     * @param {number|RoomPosition|RoomObject} x X position in the room.
     * @param {number} [y] Y position in the room.
     *
     * @note Alternative function: lookForAt(type, target)
     * @param {object} target Can be a RoomPosition object or any object containing RoomPosition.
     *
     * @return {Array} An array of objects of the given type at the specified position if found.
     */
    lookForAt: function(type, x, y) { },

    /**
     * Get the list of objects with the given type at the specified room area.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079011-Room#lookForAtArea}
     *
     * @type {function}
     *
     * @param {string} type One of the LOOK_* constants.
     * @param {number} top The top Y boundary of the area.
     * @param {number} left The left X boundary of the area.
     * @param {number} bottom The bottom Y boundary of the area.
     * @param {number} right The right X boundary of the area.
     * @param {boolean} [asArray] Set to true if you want to get the result as a plain array.
     *
     * @return {object} An object with all the objects of the given type in the specified area in the following format:
                        //10,5,11,7
                        {
                            10:
                            {
                                5: [{...}],
                                6: undefined,
                                7: undefined
                            },
                            11:
                            {
                                5: undefined,
                                6: [{...}, {...}],
                                7: undefined
                            }
                        }
     */
    lookForAtArea: function(type, top, left, bottom, right, asArray) { }
};

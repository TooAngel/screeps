/**
 * A nuke landing position.
 * This object cannot be removed or modified.
 * You can find incoming nukes in the room using the FIND_NUKES constant.
 * @class
 * @extends {RoomObject}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/208488525-Nuke}
 */
Nuke = function() { };

Nuke.prototype =
{
    /**
     * A unique object identificator.
     * You can use Game.getObjectById method to retrieve an object instance by its id.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208488525-Nuke#id}
     *
     * @type {string}
     */
    id: "",

    /**
     * The name of the room where this nuke has been launched from.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208488525-Nuke#launchRoomName}
     *
     * @type {string}
     */
    launchRoomName: "",

    /**
     * The remaining landing time.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208488525-Nuke#timeToLand}
     *
     * @type {number}
     */
    timeToLand: 0
};

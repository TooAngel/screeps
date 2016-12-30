/**
 * Provides visibility into a distant room from your script.
 *
 * @class
 * @extends {OwnedStructure}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/208436365-StructureObserver}
 */
StructureObserver = function() { };

StructureObserver.prototype =
{
    /**
     * Provide visibility into a distant room from your script.
     * The target room object will be available on the next tick.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/208436365-StructureObserver#observeRoom}
     *
     * @type {function}
     *
     * @param {string} roomName The name of the target room.
     *
     * @return {number|OK|ERR_INVALID_ARGS|ERR_RCL_NOT_ENOUGH}
     */
    observeRoom: function(roomName) { }
};

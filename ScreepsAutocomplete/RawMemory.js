/**
 * RawMemory object allows to implement your own memory stringifier instead of built-in serializer based on JSON.stringify.
 *
 * @class
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/205619121-RawMemory}
 */
RawMemory = function() { };

RawMemory.prototype =
{
    /**
     * Get a raw string representation of the Memory object.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/205619121-RawMemory#get}
     *
     * @type {function}
     *
     * @return {string}
     */
    get: function() { },

    /**
     * Set new memory value.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/205619121-RawMemory#set}
     *
     * @type {function}
     *
     * @param {string} value
     *
     * @return {void}
     */
    set: function(value) { }
};

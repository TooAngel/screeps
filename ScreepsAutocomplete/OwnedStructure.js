/**
 * The base prototype for a structure that has an owner.
 * Such structures can be found using FIND_MY_STRUCTURES and FIND_HOSTILE_STRUCTURES constants.
 *
 * @class
 * @extends {Structure}
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/207710979-OwnedStructure}
 */
OwnedStructure = function() { };

OwnedStructure.prototype =
{
    /**
     * Whether this is your own structure.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207710979-OwnedStructure#my}
     *
     * @type {boolean}
     */
    my: true,

    /**
     * An object with the structure’s owner info
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/207710979-OwnedStructure#owner}
     *
     * @type {{username: string}}
     */
    owner:
    {
        username: ""
    }
};

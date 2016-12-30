/**
 * The main global game object containing all the gameplay information.
 *
 * @see {@link http://support.screeps.com/hc/en-us/articles/203016382-Game}
 *
 * @class
 */
Game =
{
    /**
     * An object containing information about your CPU usage
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016382-Game#cpu}
     */
    cpu:
    {
        /**
         * Your CPU limit depending on your Global Control Level.
         *
         * @type {number}
         */
        limit: 0,

        /**
         * An amount of available CPU time at the current game tick.
         * It can be higher than Game.cpu.limit.
         *
         * @type {number}
         */
        tickLimit: 0,

        /**
         * An amount of unused CPU accumulated in your bucket.
         *
         * @type {number}
         */
        bucket: 0,

        /**
         * Get amount of CPU time used from the beginning of the current game tick.
         * Always returns 0 in the Simulation mode.
         *
         * @see {@link http://support.screeps.com/hc/en-us/articles/203016382-Game#cpu.getUsed}
         *
         * @type {function}
         *
         * @return {number}
         */
        getUsed: function() { }
    },

    /**
     * A hash containing all your construction sites with their id as hash keys.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016382-Game#constructionSites}
     *
     * @type {Array<string, ConstructionSite>}
     */
    constructionSites: {},

    /**
     * A hash containing all your creeps with creep names as hash keys.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016382-Game#creeps}
     *
     * @type {Array<string, Creep>}
     */
    creeps: {},

    /**
     * A hash containing all your flags with flag names as hash keys.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016382-Game#flags}
     *
     * @type {Array<string, Flag>}
     */
    flags: {},

    /**
     * Your Global Control Level
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016382-Game#gcl}
     */
    gcl:
    {
        /**
         * The current level.
         *
         * @type {number}
         */
        level: 0,

        /**
         * The current progress to the next level.
         *
         * @type {number}
         */
        progress: 0,

        /**
         * The progress required to reach the next level.
         *
         * @type {number}
         */
        progressTotal: 0
    },

    /**
     * A global object representing world map.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016382-Game#map}
     * @see {@link http://support.screeps.com/hc/en-us/articles/203079191-Map}
     *
     */
    map:
    {
        /**
         * List all exits available from the room with the given name.
         *
         * @see {@link http://support.screeps.com/hc/en-us/articles/203079191-Map#describeExits}
         *
         * @type {function}
         *
         * @param {string} roomName The room name.
         *
         * @return {null|object} The exits information in the following format, or null if the room not found.
                                 {
                                    "1": "W8N4",    // TOP
                                    "3": "W7N3",    // RIGHT
                                    "5": "W8N2",    // BOTTOM
                                    "7": "W9N3"     // LEFT
                                }
         */
        describeExits: function(roomName) { },

        /**
         * Find the exit direction from the given room en route to another room.
         *
         * @see {@link http://support.screeps.com/hc/en-us/articles/203079191-Map#findExit}
         *
         * @type {function}
         *
         * @param {string|Room} fromRoom Start room name or room object.
         * @param {string|Room} toRoom Finish room name or room object.
         * @param {object} [opts] An object with the pathfinding options. See findRoute.
         *
         * @return {FIND_EXIT_TOP|FIND_EXIT_RIGHT|FIND_EXIT_BOTTOM|FIND_EXIT_LEFT|number|ERR_NO_PATH|ERR_INVALID_ARGS}
         */
        findExit: function(fromRoom, toRoom, opts) { },

        /**
         * Find route from the given room to another room.
         *
         * @see {@link http://support.screeps.com/hc/en-us/articles/203079191-Map#findRoute}
         *
         * @type {function}
         *
         * @param {string|Room} fromRoom Start room name or room object.
         * @param {string|Room} toRoom Finish room name or room object.
         * @param {object} [opts] An object with the pathfinding options.
         * @param {function} [opts.routeCallback] This callback accepts two arguments: function(roomName, fromRoomName). It can be used to calculate the cost of entering that room. You can use this to do things like prioritize your own rooms, or avoid some rooms. You can return a floating point cost or Infinity to block the room.
         *
         * @return {Array|number|ERR_NO_PATH} The route array in the following format:
                                             [
                                                 { exit: FIND_EXIT_RIGHT, room: 'arena21' },
                                                 { exit: FIND_EXIT_BOTTOM, room: 'arena22' }
                                             ]
         */
        findRoute: function(fromRoom, toRoom, opts) { },

        /**
         * Get the linear distance (in rooms) between two rooms.
         * You can use this function to estimate the energy cost of sending resources through terminals, or using observers and nukes.
         *
         * @see {@link http://support.screeps.com/hc/en-us/articles/203079191-Map#getRoomLinearDistance}
         *
         * @type {function}
         *
         * @param {string} roomName1 The name of the first room.
         * @param {string} roomName2 The name of the second room.
         *
         * @return {number} A number of rooms between the given two rooms.
         */
        getRoomLinearDistance: function(roomName1, roomName2) { },

        /**
         * Get terrain type at the specified room position.
         * This method works for any room in the world even if you have no access to it.
         *
         * @see {@link http://support.screeps.com/hc/en-us/articles/203079191-Map#getTerrainAt}
         *
         * @type {function}
         *
         * @param {number|RoomPosition} x X position in the room.
         * @param {number} [y] Y position in the room.
         * @param {string} [roomName] The room name.
         *
         * @note Alternative function: getTerrainAt(pos)
         * @param {RoomPosition} pos The position object.
         *
         * @return {"plain"|"swamp"|"wall"}
         */
        getTerrainAt: function(x, y, roomName) { },

        /**
         * Check if the room with the given name is available to move into
         *
         * @see {@link http://support.screeps.com/hc/en-us/articles/203079191-Map#isRoomAvailable}
         *
         * @type {function}
         *
         * @param {string} roomName The room name.
         *
         * @return {boolean}
         */
        isRoomAvailable: function(roomName) { },

        /**
         * Check if the room with the given name is protected by temporary "newbie" walls.
         * This method has been deprecated in favor of isRoomAvailable
         *
         * @see {@link http://support.screeps.com/hc/en-us/articles/203079191-Map#isRoomProtected}
         *
         * @type {function}
         *
         * @param {string} roomName The room name.
         *
         * @return {boolean}
         */
        isRoomProtected: function(roomName) { }
    },

    /**
     * A global object representing the in-game market.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016382-Game#market}
     * @see {@link http://support.screeps.com/hc/en-us/articles/207928635-Market}
     */
    market:
    {
        /**
         * An array of the last 100 incoming transactions to your terminals with the following format:
         [{
        transactionId : "56dec546a180ce641dd65960",
        time : 10390687,
        sender : {username: "Sender"},
        recipient : {username: "Me"},
        resourceType : "U",
        amount : 100,
        from : "W0N0",
        to : "W10N10",
        description : "trade contract #1",
        order: {		// optional
            id : "55c34a6b5be41a0a6e80c68b",
            type : "sell",
            price : 2.95
        }
    }]
         * @see {@link http://support.screeps.com/hc/en-us/articles/207928635-Market#incomingTransactions}
         *
         * @type {Array}
         */
        incomingTransactions: [],

        /**
         * An array of the last 100 outgoing transactions from your terminals with the following format:
         [{
        transactionId : "56dec546a180ce641dd65960",
        time : 10390687,
        sender : {username: "Me"},
        recipient : {username: "Recipient"},
        resourceType : "U",
        amount : 100,
        from : "W0N0",
        to : "W10N10",
        description : "trade contract #1",
        order: {		// optional
            id : "55c34a6b5be41a0a6e80c68b",
            type : "sell",
            price : 2.95
        }
    }]

         * @see {@link http://support.screeps.com/hc/en-us/articles/207928635-Market#outgoingTransactions}
         *
         * @type {Array}
         */
        outgoingTransactions: [],

        /**
         * This property is still under development.
         * An array of your active and inactive buy/sell orders on the market, in the following format:
         [
         {
            id : "55c34a6b5be41a0a6e80c68b",
            active : true,
            type : "sell"
            resourceType : "OH",
            roomName : "W1N1",
            amount : 15821,
            price : 2.95
        }, {
            id : "55c34a6b52411a0a6e80693a",
            active : true,
            type : "buy"
            resourceType : "energy",
            roomName : "W1N1",
            amount : 94000,
            price : 0.45
        }, {
            id : "55c34a6b5be41a0a6e80c123",
            active : true,
            type : "sell"
            resourceType : "token",
            amount : 3,
            price : 50000
        }
         ]

         * @see {@link http://support.screeps.com/hc/en-us/articles/207928635-Market#myOrders}
         *
         * @type {Array}
         */
        myOrders: [],

        /**
         * This property is still under development.
         * An array of all available buy/sell orders on the market.
         * Only active orders are visible.
         [
         {
             id : "55c34a6b5be41a0a6e80c68b",
             type : "sell"
             resourceType : "OH",
             roomName : "W1N1",
             amount : 15821,
             price : 2.95
         }, {
            id : "55c34a6b52411a0a6e80693a",
            type : "buy"
            resourceType : "energy",
            roomName : "W1N1",
            amount : 94000,
            price : 0.45
        }, {
            id : "55c34a6b5be41a0a6e80c123",
            type : "sell"
            resourceType : "token",
            amount : 3,
            price : 50000
        }
         ]

         * @see {@link http://support.screeps.com/hc/en-us/articles/207928635-Market#orders}
         *
         * @type {Array}
         */
        orders: [],

        /**
         * Estimate the energy transaction cost of StructureTerminal.send and Market.deal methods.
         * The formula: Math.ceil( amount * ( Math.log( 0.1 * linearDistanceBetweenRooms + 0.9) + 0.1) )
         *
         * @see {@link http://support.screeps.com/hc/en-us/articles/207928635-Market#calcTransactionCost}
         *
         * @type {function}
         *
         * @param {number} amount Amount of resources to be sent.
         * @param {string} roomName1 The name of the first room.
         * @param {string} roomName2 The name of the second room.
         *
         * @return {number} The amount of energy required to perform the transaction.
         */
        calcTransactionCost: function(amount, roomName1, roomName2) { },

        /**
         * This method is still under development.
         * Cancel a previously created order.
         * If a buy order provided, then the reserved credits amount will be refunded in full.
         * The 5% fee is not returned.
         *
         * @see {@link http://support.screeps.com/hc/en-us/articles/207928635-Market#cancelOrder}
         *
         * @type {function}
         *
         * @param {string} orderId The order ID as provided in Game.market.myOrders.
         *
         * @return {number|OK|ERR_INVALID_ARGS}
         */
        cancelOrder: function(orderId) { },

        /**
         * This method is still under development.
         * Create a buy order in your terminal.
         * You will be charged price*amount*0.05 credits when the order is placed, and the price*amount credits will be reserved.
         * The maximum buy orders count is 50 per player.
         * You can cancel an order to refund the reserved credits amount.
         *
         * @see {@link http://support.screeps.com/hc/en-us/articles/207928635-Market#createBuyOrder}
         *
         * @type {function}
         *
         * @param {string} resourceType Either one of the RESOURCE_* constants or GAMETIME_TOKEN.
         * @param {number} price The price for one resource unit in credits. Can be a decimal number.
         * @param {number} totalAmount The amount of resources to be bought in total.
         * @param {string} [roomName] The room where your order will be created. You must have your own Terminal structure in this room, otherwise the created order will be temporary inactive. This argument is not used when resourceType equals to GAMETIME_TOKEN.
         *
         * @return {number|OK|ERR_NOT_ENOUGH_RESOURCES|ERR_FULL|ERR_INVALID_ARGS}
         */
        createBuyOrder: function(resourceType, price, totalAmount, roomName) { },

        /**
         * This method is still under development.
         * Create a sell order in your terminal.
         * You will be charged price*amount*0.05 credits when the order is placed.
         * The maximum sell orders count is 50 per player.
         *
         * @see {@link http://support.screeps.com/hc/en-us/articles/207928635-Market#createSellOrder}
         *
         * @type {function}
         *
         * @param {string} resourceType Either one of the RESOURCE_* constants or GAMETIME_TOKEN. If your Terminal doesn't have the specified resource, the order will be temporary inactive.
         * @param {number} price The price for one resource unit in credits. Can be a decimal number.
         * @param {number} totalAmount The amount of resources to be sold in total. The Terminal doesn't have to contain all the given amount at the same time. If Infinity is provided, the order will remain active until the Terminal contains the specified resource.
         * @param {string} [roomName] The room where your order will be created. You must have your own Terminal structure in this room, otherwise the created order will be temporary inactive. This argument is not used when resourceType equals to GAMETIME_TOKEN.
         *
         * @return {number|OK|ERR_NOT_ENOUGH_RESOURCES|ERR_FULL|ERR_INVALID_ARGS}
         */
        createSellOrder: function(resourceType, price, totalAmount, roomName) { },

        /**
         * This method is still under development.
         * Execute a trade deal from your Terminal to another player's Terminal using the specified buy/sell order.
         * Your Terminal will be charged amount*linearDistanceBetweenRooms*0.1 energy units of transfer cost regardless of the order resource type.
         * You can use Game.map.getRoomLinearDistance method to estimate it.
         *
         * @see {@link http://support.screeps.com/hc/en-us/articles/207928635-Market#deal}
         *
         * @type {function}
         *
         * @param {string} orderId The order ID as provided in Game.market.orders.
         * @param {string} targetRoomName The name of your room which has to contain an active Terminal with enough amount of energy.
         * @param {number} amount The amount of resources to transfer.
         *
         * @return {number|OK|ERR_NOT_ENOUGH_RESOURCES|ERR_INVALID_ARGS}
         */
        deal: function(orderId, targetRoomName, amount) { },

        /**
         * This method is still under development.
         * Add more capacity to an existing order. It will affect remainingAmount and totalAmount properties. You will
         * be charged price*addAmount*0.05 credits.
         *
         * @see {@link http://support.screeps.com/hc/en-us/articles/207928635-Market#extendOrder}
         *
         * @type {function}
         *
         * @param {string} orderId The order ID as provided in Game.market.orders.
         * @param {number} addAmount How much capacity to add. Cannot be a negative value.
         *
         * @return {number|OK|ERR_NOT_ENOUGH_RESOURCES|ERR_INVALID_ARGS}
         */
        extendOrder: function(orderId, addAmount) { },

        /**
         * This method is still under development.
         * Get other players' orders currently active on the market.
         *
         * @see {@link http://support.screeps.com/hc/en-us/articles/207928635-Market#getAllOrders}
         *
         * @type {function}
         *
         * @param {object|function} [filter] An object or function that will filter the resulting list using the lodash.filter method.
         *
         * @return {Array} An orders array in the following form:

                            id - The unique order ID.
                            created - The order creation time in game ticks.
                            type - Either ORDER_SELL or ORDER_BUY.
                            resourceType - Either one of the RESOURCE_* constants or SUBSCRIPTION_TOKEN.
                            roomName - The room where this order is placed.
                            amount - Currently available amount to trade.
                            remainingAmount - How many resources are left to trade via this order. When it becomes equal to zero, the order is removed.
                            price - The price per unit of the resourceType

                            [{
	                            id : "55c34a6b5be41a0a6e80c68b",
                                created : 13131117,
                                type : "sell"
                                resourceType : "OH",
                                roomName : "W1N1",
                                amount : 15821,
                                remainingAmount : 30000,
                                price : 2.95
                            }, {
                                id : "55c34a6b52411a0a6e80693a",
                                created : 13134122,
                                type : "buy"
                                resourceType : "energy",
                                roomName : "W1N1",
                                amount : 94000,
                                remainingAmount : 94000,
                                price : 0.45
                            }, {
                                id : "55c34a6b5be41a0a6e80c123",
                                created : 13105123,
                                type : "sell"
                                resourceType : "token",
                                amount : 3,
                                remainingAmount : 10,
                                price : 50000
                            }]
         */
        getAllOrders: function(filter) { },

        /**
         * This method is still under development.
         * Retrieve info for specific market order.
         *
         * @see {@link http://support.screeps.com/hc/en-us/articles/207928635-Market#getOrderById}
         *
         * @type {function}
         *
         * @param {string} id The order ID
         *
         * @return {object} An object with the order info in the following form:
                             {
	                            id : "55c34a6b5be41a0a6e80c68b",
                                created : 13131117,
                                type : "sell"
                                resourceType : "OH",
                                roomName : "W1N1",
                                amount : 15821,
                                remainingAmount : 30000,
                                price : 2.95
                            }
         */
        getOrderById: function(id) { }
    },

    /**
     * A hash containing all the rooms available to you with room names as hash keys.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016382-Game#rooms}
     *
     * @type {Array<string, Room>}
     */
    rooms: {},

    /**
     * A hash containing all your spawns with spawn names as hash keys.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016382-Game#spawns}
     *
     * @type {Array<string, Spawn>}
     */
    spawns: {},

    /**
     * A hash containing all your structures with structure id as hash keys.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016382-Game#structures}
     *
     * @type {Array<string, Structure>}
     */
    structures: {},

    /**
     * System game tick counter. It is automatically incremented on every tick.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016382-Game#time}
     *
     * @type {number}
     */
    time: 0,

    /**
     * Get an object with the specified unique ID.
     * It may be a game object of any type.
     * Only objects from the rooms which are visible to you can be accessed.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016382-Game#getObjectById}
     *
     * @type {function}
     *
     * @param {string} id The unique identificator.
     *
     * @return {object|null}
     */
    getObjectById: function(id) { },

    /**
     * Send a custom message at your profile email.
     * This way, you can set up notifications to yourself on any occasion within the game.
     * You can schedule up to 20 notifications during one game tick.
     * Not available in the Simulation Room.
     *
     * @see {@link http://support.screeps.com/hc/en-us/articles/203016382-Game#notify}
     *
     * @param {string} message Custom text which will be sent in the message. Maximum length is 1000 characters.
     * @param {number} [groupInterval] If set to 0 (default), the notification will be scheduled immediately. Otherwise, it will be grouped with other notifications and mailed out later using the specified time in minutes.
     *
     * @return {void}
     */
    notify: function(message, groupInterval) { }
};

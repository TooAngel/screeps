
/** CREEP BODY PARTS **/

/**
 * @constant
 * @type {string}
 */
const MOVE = "move";

/**
 * @constant
 * @type {string}
 */
const WORK = "work";

/**
 * @constant
 * @type {string}
 */
const CARRY = "carry";

/**
 * @constant
 * @type {string}
 */
const ATTACK = "attack";

/**
 * @constant
 * @type {string}
 */
const RANGED_ATTACK = "ranged_attack";

/**
 * @constant
 * @type {string}
 */
const TOUGH = "tough";

/**
 * @constant
 * @type {string}
 */
const HEAL = "heal";

/**
 * @constant
 * @type {string}
 */
const CLAIM = "claim";

/** DIRECTION CONSTANTS **/

/**
 * @constant
 * @type {number}
 */
const TOP = 1;

/**
 * @constant
 * @type {number}
 */
const TOP_RIGHT = 2;

/**
 * @constant
 * @type {number}
 */
const RIGHT = 3;

/**
 * @constant
 * @type {number}
 */
const BOTTOM_RIGHT = 4;

/**
 * @constant
 * @type {number}
 */
const BOTTOM = 5;

/**
 * @constant
 * @type {number}
 */
const BOTTOM_LEFT = 6;

/**
 * @constant
 * @type {number}
 */
const LEFT = 7;

/**
 * @constant
 * @type {number}
 */
const TOP_LEFT = 8;

/** ERROR CONSTANTS **/

/**
 * @constant
 * @type {number}
 */
const OK = 0;

/**
 * @constant
 * @type {number}
 */
const ERR_NOT_OWNER = -1;

/**
 * @constant
 * @type {number}
 */
const ERR_NO_PATH = -2;

/**
 * @constant
 * @type {number}
 */
const ERR_NAME_EXISTS = -3;

/**
 * @constant
 * @type {number}
 */
const ERR_BUSY = -4;

/**
 * @constant
 * @type {number}
 */
const ERR_NOT_FOUND = -5;

/**
 * @constant
 * @type {number}
 */
const ERR_NOT_ENOUGH_ENERGY = -6;

/**
 * @constant
 * @type {number}
 */
const ERR_NOT_ENOUGH_RESOURCES = -6;

/**
 * @constant
 * @type {number}
 */
const ERR_NOT_ENOUGH_EXTENSIONS = -6;

/**
 * @constant
 * @type {number}
 */
const ERR_INVALID_TARGET = -7;

/**
 * @constant
 * @type {number}
 */
const ERR_FULL = -8;

/**
 * @constant
 * @type {number}
 */
const ERR_NOT_IN_RANGE = -9;

/**
 * @constant
 * @type {number}
 */
const ERR_INVALID_ARGS = -10;

/**
 * @constant
 * @type {number}
 */
const ERR_TIRED = -11;

/**
 * @constant
 * @type {number}
 */
const ERR_NO_BODYPART = -12;

/**
 * @constant
 * @type {number}
 */
const ERR_RCL_NOT_ENOUGH = -14;

/**
 * @constant
 * @type {number}
 */
const ERR_GCL_NOT_ENOUGH = -15;

/** COLOR CONSTANTS **/

/**
 * @constant
 * @type {number}
 */
const COLOR_RED = 1;

/**
 * @constant
 * @type {number}
 */
const COLOR_PURPLE = 2;

/**
 * @constant
 * @type {number}
 */
const COLOR_BLUE = 3;

/**
 * @constant
 * @type {number}
 */
const COLOR_CYAN = 4;

/**
 * @constant
 * @type {number}
 */
const COLOR_GREEN = 5;

/**
 * @constant
 * @type {number}
 */
const COLOR_YELLOW = 6;

/**
 * @constant
 * @type {number}
 */
const COLOR_ORANGE = 7;

/**
 * @constant
 * @type {number}
 */
const COLOR_BROWN = 8;

/**
 * @constant
 * @type {number}
 */
const COLOR_GREY = 9;

/**
 * @constant
 * @type {number}
 */
const COLOR_WHITE = 10;

/** FIND CONSTANTS **/

/**
 * @constant
 * @type {number}
 */
const FIND_EXIT_TOP = 1;

/**
 * @constant
 * @type {number}
 */
const FIND_EXIT_RIGHT = 3;

/**
 * @constant
 * @type {number}
 */
const FIND_EXIT_BOTTOM = 5;

/**
 * @constant
 * @type {number}
 */
const FIND_EXIT_LEFT = 7;

/**
 * @constant
 * @type {number}
 */
const FIND_EXIT = 10;

/**
 * @constant
 * @type {number}
 */
const FIND_CREEPS = 101;

/**
 * @constant
 * @type {number}
 */
const FIND_MY_CREEPS = 102;

/**
 * @constant
 * @type {number}
 */
const FIND_HOSTILE_CREEPS = 103;

/**
 * @constant
 * @type {number}
 */
const FIND_SOURCES_ACTIVE = 104;

/**
 * @constant
 * @type {number}
 */
const FIND_SOURCES = 105;

/**
 * @constant
 * @type {number}
 */
const FIND_DROPPED_ENERGY = 106;

/**
 * @constant
 * @type {number}
 */
const FIND_DROPPED_RESOURCES = 106;

/**
 * @constant
 * @type {number}
 */
const FIND_STRUCTURES = 107;

/**
 * @constant
 * @type {number}
 */
const FIND_MY_STRUCTURES = 108;

/**
 * @constant
 * @type {number}
 */
const FIND_HOSTILE_STRUCTURES = 109;

/**
 * @constant
 * @type {number}
 */
const FIND_FLAGS = 110;

/**
 * @constant
 * @type {number}
 */
const FIND_CONSTRUCTION_SITES = 111;

/**
 * @constant
 * @type {number}
 */
const FIND_MY_SPAWNS = 112;

/**
 * @constant
 * @type {number}
 */
const FIND_HOSTILE_SPAWNS = 113;

/**
 * @constant
 * @type {number}
 */
const FIND_MY_CONSTRUCTION_SITES = 114;

/**
 * @constant
 * @type {number}
 */
const FIND_HOSTILE_CONSTRUCTION_SITES = 115;

/**
 * @constant
 * @type {number}
 */
const FIND_MINERALS = 116;

/**
 * @constant
 * @type {number}
 */
const FIND_NUKES = 117;

/** GAME MODE CONSTANTS **/

/**
 * @constant
 * @type {string}
 */
const MODE_SIMULATION = "simulation";

/**
 * @constant
 * @type {string}
 */
const MODE_SURVIVAL = "survival";

/**
 * @constant
 * @type {string}
 */
const MODE_WORLD = "world";

/**
 * @constant
 * @type {string}
 */
const MODE_ARENA = "arena";

/** STRUCTURE CONSTANTS **/

/**
 * @constant
 * @type {string}
 */
const STRUCTURE_EXTENSION = "extension";

/**
 * @constant
 * @type {string}
 */
const STRUCTURE_RAMPART = "rampart";

/**
 * @constant
 * @type {string}
 */
const STRUCTURE_ROAD = "road";

/**
 * @constant
 * @type {string}
 */
const STRUCTURE_SPAWN = "spawn";

/**
 * @constant
 * @type {string}
 */
const STRUCTURE_WALL = "constructedWall";

/**
 * @constant
 * @type {string}
 */
const STRUCTURE_LINK = "link";

/**
 * @constant
 * @type {string}
 */
const STRUCTURE_KEEPER_LAIR = "keeperLair";

/**
 * @constant
 * @type {string}
 */
const STRUCTURE_CONTROLLER = "controller";

/**
 * @constant
 * @type {string}
 */
const STRUCTURE_STORAGE = "storage";

/**
 * @constant
 * @type {string}
 */
const STRUCTURE_TOWER = "tower";

/**
 * @constant
 * @type {string}
 */
const STRUCTURE_OBSERVER = "observer";

/**
 * @constant
 * @type {string}
 */
const STRUCTURE_POWER_BANK = "powerBank";

/**
 * @constant
 * @type {string}
 */
const STRUCTURE_POWER_SPAWN = "powerSpawn";

/**
 * @constant
 * @type {string}
 */
const STRUCTURE_PORTAL = "portal";

/**
 * @constant
 * @type {string}
 */
const STRUCTURE_EXTRACTOR = "extractor";

/**
 * @constant
 * @type {string}
 */
const STRUCTURE_LAB = "lab";

/**
 * @constant
 * @type {string}
 */
const STRUCTURE_TERMINAL = "terminal";

/**
 * @constant
 * @type {string}
 */
const STRUCTURE_CONTAINER = "container";

/**
 * @constant
 * @type {string}
 */
const STRUCTURE_NUKER = "nuker";

/** RESOURCE CONSTANTS **/

/**
 * @constant
 * @type {string}
 */
const RESOURCE_ENERGY = "energy";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_POWER = "power";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_HYDROGEN = "H";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_OXYGEN = "O";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_UTRIUM = "U";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_KEANIUM = "K";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_LEMERGIUM = "L";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_ZYNTHIUM = "Z";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_CATALYST = "X";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_HYDROXIDE = "OH";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_ZYNTHIUM_KEANITE = "ZK";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_UTRIUM_LEMERGITE = "UL";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_GHODIUM = "G";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_UTRIUM_HYDRIDE = "UH";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_UTRIUM_OXIDE = "UO";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_KEANIUM_HYDRIDE = "KH";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_KEANIUM_OXIDE = "KO";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_LEMERGIUM_HYDRIDE = "LH";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_LEMERGIUM_OXIDE = "LO";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_ZYNTHIUM_HYDRIDE = "ZH";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_ZYNTHIUM_OXIDE = "ZO";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_GHODIUM_HYDRIDE = "GH";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_GHODIUM_OXIDE = "GO";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_UTRIUM_ACID = "UH2O";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_UTRIUM_ALKALIDE = "UHO2";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_KEANIUM_ACID = "KH2O";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_KEANIUM_ALKALIDE = "KHO2";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_LEMERGIUM_ACID = "LH2O";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_LEMERGIUM_ALKALIDE = "LHO2";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_ZYNTHIUM_ACID = "ZH2O";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_ZYNTHIUM_ALKALIDE = "ZHO2";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_GHODIUM_ACID = "GH2O";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_GHODIUM_ALKALIDE = "GHO2";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_CATALYZED_UTRIUM_ACID = "XUH2O";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_CATALYZED_UTRIUM_ALKALIDE = "XUHO2";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_CATALYZED_KEANIUM_ACID = "XKH2O";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_CATALYZED_KEANIUM_ALKALIDE = "XKHO2";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_CATALYZED_LEMERGIUM_ACID = "XLH2O";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE = "XLHO2";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_CATALYZED_ZYNTHIUM_ACID = "XZH2O";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE = "XZHO2";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_CATALYZED_GHODIUM_ACID = "XGH2O";

/**
 * @constant
 * @type {string}
 */
const RESOURCE_CATALYZED_GHODIUM_ALKALIDE = "XGHO2";

/**
 * @constant
 * @type {object}
 */
const REACTIONS = {
    H: {
        O: "OH",
        L: "LH",
        K: "KH",
        U: "UH",
        Z: "ZH",
        G: "GH"
    },
    O: {
        H: "OH",
        L: "LO",
        K: "KO",
        U: "UO",
        Z: "ZO",
        G: "GO"
    },
    Z: {
        K: "ZK",
        H: "ZH",
        O: "ZO"
    },
    L: {
        U: "UL",
        H: "LH",
        O: "LO"
    },
    K: {
        Z: "ZK",
        H: "KH",
        O: "KO"
    },
    G: {
        H: "GH",
        O: "GO"
    },
    U: {
        L: "UL",
        H: "UH",
        O: "UO"
    },
    OH: {
        UH: "UH2O",
        UO: "UHO2",
        ZH: "ZH2O",
        ZO: "ZHO2",
        KH: "KH2O",
        KO: "KHO2",
        LH: "LH2O",
        LO: "LHO2",
        GH: "GH2O",
        GO: "GHO2"
    },
    X: {
        UH2O: "XUH2O",
        UHO2: "XUHO2",
        LH2O: "XLH2O",
        LHO2: "XLHO2",
        KH2O: "XKH2O",
        KHO2: "XKHO2",
        ZH2O: "XZH2O",
        ZHO2: "XZHO2",
        GH2O: "XGH2O",
        GHO2: "XGHO2"
    },
    ZK: {
        UL: "G"
    },
    UL: {
        ZK: "G"
    },
    LH: {
        OH: "LH2O"
    },
    ZH: {
        OH: "ZH2O"
    },
    GH: {
        OH: "GH2O"
    },
    KH: {
        OH: "KH2O"
    },
    UH: {
        OH: "UH2O"
    },
    LO: {
        OH: "LHO2"
    },
    ZO: {
        OH: "ZHO2"
    },
    KO: {
        OH: "KHO2"
    },
    UO: {
        OH: "UHO2"
    },
    GO: {
        OH: "GHO2"
    },
    LH2O: {
        X: "XLH2O"
    },
    KH2O: {
        X: "XKH2O"
    },
    ZH2O: {
        X: "XZH2O"
    },
    UH2O: {
        X: "XUH2O"
    },
    GH2O: {
        X: "XGH2O"
    },
    LHO2: {
        X: "XLHO2"
    },
    UHO2: {
        X: "XUHO2"
    },
    KHO2: {
        X: "XKHO2"
    },
    ZHO2: {
        X: "XZHO2"
    },
    GHO2: {
        X: "XGHO2"
    }
};

/**
 * @constant
 * @type {object}
 */
const BOOSTS = {
    work: {
        UO: {
            harvest: 2
        },
        UHO2: {
            harvest: 3
        },
        XUHO2: {
            harvest: 4
        },
        LH: {
            build: 1.3,
            repair: 1.3
        },
        LH2O: {
            build: 1.65,
            repair: 1.65
        },
        XLH2O: {
            build: 2,
            repair: 2
        },
        ZH: {
            dismantle: 2
        },
        ZH2O: {
            dismantle: 3
        },
        XZH2O: {
            dismantle: 4
        },
        GH: {
            upgradeController: 1.3
        },
        GH2O: {
            upgradeController: 1.65
        },
        XGH2O: {
            upgradeController: 2
        }
    },
    attack: {
        UH: {
            attack: 2
        },
        UH2O: {
            attack: 3
        },
        XUH2O: {
            attack: 4
        }
    },
    ranged_attack: {
        KO: {
            rangedAttack: 2,
            rangedMassAttack: 2
        },
        KHO2: {
            rangedAttack: 3,
            rangedMassAttack: 3
        },
        XKHO2: {
            rangedAttack: 4,
            rangedMassAttack: 4
        }
    },
    heal: {
        LO: {
            heal: 2,
            rangedHeal: 2
        },
        LHO2: {
            heal: 3,
            rangedHeal: 3
        },
        XLHO2: {
            heal: 4,
            rangedHeal: 4
        }
    },
    carry: {
        KH: {
            capacity: 2
        },
        KH2O: {
            capacity: 3
        },
        XKH2O: {
            capacity: 4
        }
    },
    move: {
        ZO: {
            fatigue: 2
        },
        ZHO2: {
            fatigue: 3
        },
        XZHO2: {
            fatigue: 4
        }
    },
    tough: {
        GO: {
            damage: .7
        },
        GHO2: {
            damage: .5
        },
        XGHO2: {
            damage: .3
        }
    }
};

/**
 * @constant
 * @type {string[]}
 */
const RESOURCES_ALL = [
    RESOURCE_ENERGY,
    RESOURCE_POWER,
    RESOURCE_HYDROGEN,
    RESOURCE_OXYGEN,
    RESOURCE_UTRIUM,
    RESOURCE_KEANIUM,
    RESOURCE_LEMERGIUM,
    RESOURCE_ZYNTHIUM,
    RESOURCE_CATALYST,
    RESOURCE_GHODIUM,
    RESOURCE_HYDROXIDE,
    RESOURCE_ZYNTHIUM_KEANITE,
    RESOURCE_UTRIUM_LEMERGITE,
    RESOURCE_UTRIUM_HYDRIDE,
    RESOURCE_UTRIUM_OXIDE,
    RESOURCE_KEANIUM_HYDRIDE,
    RESOURCE_KEANIUM_OXIDE,
    RESOURCE_LEMERGIUM_HYDRIDE,
    RESOURCE_LEMERGIUM_OXIDE,
    RESOURCE_ZYNTHIUM_HYDRIDE,
    RESOURCE_ZYNTHIUM_OXIDE,
    RESOURCE_GHODIUM_HYDRIDE,
    RESOURCE_GHODIUM_OXIDE,
    RESOURCE_UTRIUM_ACID,
    RESOURCE_UTRIUM_ALKALIDE,
    RESOURCE_KEANIUM_ACID,
    RESOURCE_KEANIUM_ALKALIDE,
    RESOURCE_LEMERGIUM_ACID,
    RESOURCE_LEMERGIUM_ALKALIDE,
    RESOURCE_ZYNTHIUM_ACID,
    RESOURCE_ZYNTHIUM_ALKALIDE,
    RESOURCE_GHODIUM_ACID,
    RESOURCE_GHODIUM_ALKALIDE,
    RESOURCE_CATALYZED_UTRIUM_ACID,
    RESOURCE_CATALYZED_UTRIUM_ALKALIDE,
    RESOURCE_CATALYZED_KEANIUM_ACID,
    RESOURCE_CATALYZED_KEANIUM_ALKALIDE,
    RESOURCE_CATALYZED_LEMERGIUM_ACID,
    RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE,
    RESOURCE_CATALYZED_ZYNTHIUM_ACID,
    RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE,
    RESOURCE_CATALYZED_GHODIUM_ACID,
    RESOURCE_CATALYZED_GHODIUM_ALKALIDE
];

/**
 * @constant
 * @type {string[]}
 */
const BODYPARTS_ALL = [
    MOVE,
    WORK,
    CARRY,
    ATTACK,
    RANGED_ATTACK,
    TOUGH,
    HEAL,
    CLAIM
];

/**
 * @constant
 * @type {string[]}
 */
const COLORS_ALL = [
    COLOR_RED,
    COLOR_PURPLE,
    COLOR_BLUE,
    COLOR_CYAN,
    COLOR_GREEN,
    COLOR_YELLOW,
    COLOR_ORANGE,
    COLOR_BROWN,
    COLOR_GREY,
    COLOR_WHITE
];

/**
 * @constant
 * @type {object}
 */
const BODYPART_COST = {
    move:           50,
    work:          100,
    attack:         80,
    carry:          50,
    heal:          250,
    ranged_attack: 150,
    tough:          10,
    claim:         600
};

/**
 * Spawn time per body part in ticks
 * @constant
 * @type {number}
 */
const CREEP_SPAWN_TIME = 3;

/**
 * @constant
 * @type {number}
 */
const CREEP_RENEW_RATIO = 1.2;

/**
 * Lifetime of a creep
 * @constant
 * @type {number}
 */
const CREEP_LIFE_TIME = 1500;

/**
 * Lifetime of a creep with CLAIM body parts
 * @constant
 * @type {number}
 */
const CREEP_CLAIM_LIFE_TIME = 500;

/**
 * use unknown
 * @constant
 * @type {number}
 */
const CREEP_CORPSE_RATE = 0.2;

/**
 * @constant
 * @type {string[]}
 */
const OBSTACLE_OBJECT_TYPES = [
    'spawn',
    'creep',
    'wall',
    'source',
    'constructedWall',
    'extension',
    'link',
    'storage',
    'tower',
    'observer',
    'powerSpawn',
    'powerBank',
    'lab',
    'terminal',
    'nuker'
];

/**
 * @constant
 * @type {number}
 */
const ENERGY_REGEN_TIME = 300;

/**
 * @constant
 * @type {number}
 */
const ENERGY_DECAY = 1000;

/**
 * @constant
 * @type {number}
 */
const MINERAL_REGEN_TIME = 50000;

/**
 * @constant
 * @type {object}
 */
const MINERAL_MIN_AMOUNT = {
    H: 140000,
    O: 140000,
    L: 70000,
    K: 70000,
    Z: 70000,
    U: 70000,
    X: 70000
};

/**
 * @constant
 * @type {number}
 */
const MINERAL_RANDOM_FACTOR = 2;

/**
 * @constant
 * @type {number}
 */
const REPAIR_COST = 0.01;

/**
 * @constant
 * @type {number}
 */
const DISMANTLE_COST = 0.005;

/**
 * @constant
 * @type {number}
 */
const RAMPART_DECAY_AMOUNT = 300;

/**
 * @constant
 * @type {number}
 */
const RAMPART_DECAY_TIME = 100;

/**
 * @constant
 * @type {number}
 */
const RAMPART_HITS = 1;

/**
 * @constant
 * @type {object}
 */
const RAMPART_HITS_MAX = {
    2: 300000,
    3: 1000000,
    4: 3000000,
    5: 10000000,
    6: 30000000,
    7: 100000000,
    8: 300000000
};

/**
 * @constant
 * @type {number}
 */
const SPAWN_HITS = 5000;

/**
 * @constant
 * @type {number}
 */
const SPAWN_ENERGY_START = 300;

/**
 * @constant
 * @type {number}
 */
const SPAWN_ENERGY_CAPACITY = 300;

/**
 * @constant
 * @type {number}
 */
const SOURCE_ENERGY_CAPACITY = 3000;

/**
 * @constant
 * @type {number}
 */
const SOURCE_ENERGY_NEUTRAL_CAPACITY = 1500;

/**
 * @constant
 * @type {number}
 */
const SOURCE_ENERGY_KEEPER_CAPACITY = 4500;

/**
 * @constant
 * @type {number}
 */
const ROAD_HITS = 5000;

/**
 * @constant
 * @type {number}
 */
const WALL_HITS = 1;

/**
 * @constant
 * @type {number}
 */
const WALL_HITS_MAX = 300000000;

/**
 * @constant
 * @type {number}
 */
const EXTENSION_HITS = 1000;

/**
 * @constant
 * @type {object}
 */
const EXTENSION_ENERGY_CAPACITY = {
    0: 50,
    1: 50,
    2: 50,
    3: 50,
    4: 50,
    5: 50,
    6: 50,
    7: 100,
    8: 200
};

/**
 * @constant
 * @type {number}
 */
const ROAD_WEAROUT = 1;

/**
 * @constant
 * @type {number}
 */
const ROAD_DECAY_AMOUNT = 100;

/**
 * @constant
 * @type {number}
 */
const ROAD_DECAY_TIME = 1000;

/**
 * @constant
 * @type {number}
 */
const LINK_HITS = 1000;

/**
 * @constant
 * @type {number}
 */
const LINK_HITS_MAX = 1000;

/**
 * @constant
 * @type {number}
 */
const LINK_CAPACITY = 800;

/**
 * @constant
 * @type {number}
 */
const LINK_COOLDOWN = 1;

/**
 * @constant
 * @type {number}
 */
const LINK_LOSS_RATIO = 0.03;

/**
 * @constant
 * @type {number}
 */
const CONTAINER_HITS = 250000;

/**
 * @constant
 * @type {number}
 */
const CONTAINER_CAPACITY = 2000;

/**
 * @constant
 * @type {number}
 */
const CONTAINER_DECAY = 5000;

/**
 * @constant
 * @type {number}
 */
const CONTAINER_DECAY_TIME = 100;

/**
 * @constant
 * @type {number}
 */
const CONTAINER_DECAY_TIME_OWNED = 500;

/**
 * @constant
 * @type {number}
 */
const NUKER_HITS = 1000;

/**
 * @constant
 * @type {number}
 */
const NUKER_COOLDOWN = 100000;

/**
 * @constant
 * @type {number}
 */
const NUKER_ENERGY_CAPACITY = 300000;

/**
 * @constant
 * @type {number}
 */
const NUKER_GHODIUM_CAPACITY = 5000;

/**
 * @constant
 * @type {number}
 */
const NUKE_LAND_TIME = 50000;

/**
 * @constant
 * @type {number}
 */
const NUKE_RANGE = 10;

/**
 * @constant
 * @type {object}
 */
const NUKE_DAMAGE = {
    0: 10000000,
    2: 5000000
};

/**
 * @constant
 * @type {number}
 */
const PORTAL_DECAY = 30000;

/**
 * @constant
 * @type {number}
 */
const STORAGE_CAPACITY = 1000000;

/**
 * @constant
 * @type {number}
 */
const STORAGE_HITS = 10000;

/**
 * @constant
 * @type {number}
 */
const CARRY_CAPACITY = 50;

/**
 * @constant
 * @type {number}
 */
const HARVEST_POWER = 2;

/**
 * @constant
 * @type {number}
 */
const HARVEST_MINERAL_POWER = 1;

/**
 * @constant
 * @type {number}
 */
const REPAIR_POWER = 100;

/**
 * @constant
 * @type {number}
 */
const DISMANTLE_POWER = 100;

/**
 * @constant
 * @type {number}
 */
const BUILD_POWER = 5;

/**
 * @constant
 * @type {number}
 */
const ATTACK_POWER = 30;

/**
 * @constant
 * @type {number}
 */
const UPGRADE_CONTROLLER_POWER = 1;

/**
 * @constant
 * @type {number}
 */
const RANGED_ATTACK_POWER = 10;

/**
 * @constant
 * @type {number}
 */
const HEAL_POWER = 12;

/**
 * @constant
 * @type {number}
 */
const RANGED_HEAL_POWER = 4;

/**
 * @constant
 * @type {object}
 */
const CONSTRUCTION_COST = {
    spawn: 15000,
    extension: 3000,
    road: 300,
    constructedWall: 1,
    rampart: 1,
    link: 5000,
    storage: 30000,
    tower: 5000,
    observer: 8000,
    powerSpawn: 100000,
    extractor: 5000,
    lab: 50000,
    terminal: 100000,
    container: 5000,
    nuker: 100000
};

/**
 * @constant
 * @type {number}
 */
const CONSTRUCTION_COST_ROAD_SWAMP_RATIO = 5;

/**
 * @constant
 * @type {object}
 */
const CONTROLLER_LEVELS = {
    1: 200,
    2: 45000,
    3: 135000,
    4: 405000,
    5: 1215000,
    6: 3645000,
    7: 10935000
};

/**
 * @constant
 * @type {object}
 */
const CONTROLLER_STRUCTURES = {
    spawn: { 0: 0, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 2, 8: 3 },
    extension: { 0: 0, 1: 0, 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60 },
    link: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2, 6: 3, 7: 4, 8: 6 },
    road: { 0: 2500, 1: 2500, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500 },
    constructedWall: { 1: 0, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500 },
    rampart: { 1: 0, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500 },
    storage: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 },
    tower: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1, 6: 2, 7: 2, 8: 4 },
    observer: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1 },
    powerSpawn: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1 }
};

/**
 * @constant
 * @type {object}
 */
const CONTROLLER_DOWNGRADE = {
    1: 20000,
    2: 50000,
    3: 50000,
    4: 50000,
    5: 50000,
    6: 50000,
    7: 50000,
    8: 50000
};

/**
 * @constant
 * @type {number}
 */
const CONTROLLER_CLAIM_DOWNGRADE = 0.2;

/**
 * @constant
 * @type {number}
 */
const CONTROLLER_RESERVE = 1;

/**
 * @constant
 * @type {number}
 */
const CONTROLLER_RESERVE_MAX = 5000;

/**
 * @constant
 * @type {number}
 */
const CONTROLLER_MAX_UPGRADE_PER_TICK = 15;

/**
 * @constant
 * @type {number}
 */
const CONTROLLER_ATTACK_BLOCKED_UPGRADE = 1000;

/**
 * @constant
 * @type {number}
 */
const CONTROLLER_NUKE_BLOCKED_UPGRADE = 200;

/**
 * @constant
 * @type {number}
 */
const TERMINAL_CAPACITY = 300000;

/**
 * @constant
 * @type {number}
 */
const TERMINAL_HITS = 3000;

/**
 * @constant
 * @type {number}
 */
const TERMINAL_SEND_COST = 0.1;

/**
 * @constant
 * @type {number}
 */
const TERMINAL_MIN_SEND = 100;

/**
 * @constant
 * @type {number}
 */
const TOWER_HITS = 3000;

/**
 * @constant
 * @type {number}
 */
const TOWER_CAPACITY = 1000;

/**
 * @constant
 * @type {number}
 */
const TOWER_ENERGY_COST = 10;

/**
 * @constant
 * @type {number}
 */
const TOWER_POWER_ATTACK = 600;

/**
 * @constant
 * @type {number}
 */
const TOWER_POWER_HEAL = 400;

/**
 * @constant
 * @type {number}
 */
const TOWER_POWER_REPAIR = 800;

/**
 * @constant
 * @type {number}
 */
const TOWER_OPTIMAL_RANGE = 5;

/**
 * @constant
 * @type {number}
 */
const TOWER_FALLOFF_RANGE = 20;

/**
 * @constant
 * @type {number}
 */
const TOWER_FALLOFF = 0.75;

/**
 * @constant
 * @type {number}
 */
const OBSERVER_HITS = 500;

/**
 * @constant
 * @type {number}
 */
const OBSERVER_RANGE = 10;

/**
 * @constant
 * @type {number}
 */
const POWER_BANK_HITS = 2000000;

/**
 * @constant
 * @type {number}
 */
const POWER_BANK_CAPACITY_MAX = 5000;

/**
 * @constant
 * @type {number}
 */
const POWER_BANK_CAPACITY_MIN = 500;

/**
 * @constant
 * @type {number}
 */
const POWER_BANK_CAPACITY_CRIT = 0.3;

/**
 * @constant
 * @type {number}
 */
const POWER_BANK_DECAY = 5000;

/**
 * @constant
 * @type {number}
 */
const POWER_BANK_HIT_BACK = 0.5;

/**
 * @constant
 * @type {number}
 */
const POWER_SPAWN_HITS = 5000;

/**
 * @constant
 * @type {number}
 */
const POWER_SPAWN_ENERGY_CAPACITY = 5000;

/**
 * @constant
 * @type {number}
 */
const POWER_SPAWN_POWER_CAPACITY = 100;

/**
 * @constant
 * @type {number}
 */
const POWER_SPAWN_ENERGY_RATIO = 50;

/**
 * @constant
 * @type {number}
 */
const LAB_HITS = 500;

/**
 * @constant
 * @type {number}
 */
const LAB_MINERAL_CAPACITY = 3000;

/**
 * @constant
 * @type {number}
 */
const LAB_ENERGY_CAPACITY = 2000;

/**
 * @constant
 * @type {number}
 */
const LAB_BOOST_ENERGY = 20;

/**
 * @constant
 * @type {number}
 */
const LAB_BOOST_MINERAL = 30;

/**
 * @constant
 * @type {number}
 */
const LAB_COOLDOWN = 10;

/**
 * @constant
 * @type {number}
 */
const GCL_POW = 2.4;

/**
 * @constant
 * @type {number}
 */
const GCL_MULTIPLY = 1000000;

/**
 * @constant
 * @type {number}
 */
const GCL_NOVICE = 3;

/**
 * @constant
 * @type {number}
 */
const TERRAIN_MASK_WALL = 1;

/**
 * @constant
 * @type {number}
 */
const TERRAIN_MASK_SWAMP = 2;

/**
 * @constant
 * @type {number}
 */
const TERRAIN_MASK_LAVA = 4;

/**
 * @constant
 * @type {number}
 */
const MAX_CONSTRUCTION_SITES = 100;

/**
 * @constant
 * @type {number}
 */
const MAX_CREEP_SIZE = 50;

/** LOOK CONSTANTS **/

/**
 * @constant
 * @type {string}
 */
const LOOK_CREEPS = "creep";

/**
 * @constant
 * @type {string}
 */
const LOOK_ENERGY = "energy";

/**
 * @constant
 * @type {string}
 */
const LOOK_RESOURCES = "resource";

/**
 * @constant
 * @type {string}
 */
const LOOK_SOURCES = "source";

/**
 * @constant
 * @type {string}
 */
const LOOK_MINERALS = "mineral";

/**
 * @constant
 * @type {string}
 */
const LOOK_STRUCTURES = "structure";

/**
 * @constant
 * @type {string}
 */
const LOOK_FLAGS = "flag";

/**
 * @constant
 * @type {string}
 */
const LOOK_CONSTRUCTION_SITES = "constructionSite";

/**
 * @constant
 * @type {string}
 */
const LOOK_NUKES = "nuke";

/**
 * @constant
 * @type {string}
 */
const LOOK_TERRAIN = "terrain";

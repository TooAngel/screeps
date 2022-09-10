'use strict';

declare var MOVE: string;
declare var WORK: string;
declare var CARRY: string;
declare var ATTACK: string;
declare var RANGED_ATTACK: string;
declare var TOUGH: string;
declare var HEAL: string;
declare var CLAIM: string;

/**
 * Creep part data
 *
 * @class
 */
class CreepPartData {

    /**
     * true if not enough energy
     *
     * @type {boolean}
     */
    fail: boolean;

    /**
     * cost of parts
     *
     * @type {int}
     */
    cost: number;

    /**
     *  part as array
     *
     * @type {string[]}
     */
    parts: string[];

    /**
     *  the amount of parts
     *
     * @type {int}
     */
    len: number;

    /**
     *  null
     *
     * @type {boolean|undefined}
     */
    null: boolean | undefined;

    constructor() {
        this.fail = false;
        this.cost = 0;
        this.parts = [];
        this.len = 0;
    }
}

/**
 * Sort body parts with the same order used in layout. Parts not in layout are last ones.
 *
 * @param  {string[]} parts  the parts array to sort.
 * @param  {CreepPartData} layout the base layout.
 * @return {string[]}        sorted array.
 */
const sortCreepParts = function (
    parts: string[],
    layout: CreepPartData
) {
    // 0. fill parts into part type count map and set

    const partTypeCountMap: Map<string, number> = new Map<string, number>(
        [
            [TOUGH, 0],
            [MOVE, 0],
            [CARRY, 0],
            [WORK, 0],
            [CLAIM, 0],
            [HEAL, 0],
            [ATTACK, 0],
            [RANGED_ATTACK, 0],
        ]
    );
    for (const part of parts) {
        partTypeCountMap.set(part, partTypeCountMap.get(part) + 1);
    }

    const uniquePartTypeSet: Set<string> = new Set<string>();
    for (const part of layout.parts) {
        uniquePartTypeSet.add(part);
    }

    const haveRangeAttack: boolean = partTypeCountMap.get(RANGED_ATTACK) > 0;

    // 1. pre-calculate buried parts

    const buriedParts: string[] = calculateBuriedParts(
        layout,
        partTypeCountMap,
        uniquePartTypeSet,
        haveRangeAttack
    );

    // 2. calculate all tough at the beginning.
    const frontToughParts: string[] = calculateFrontToughParts(
        layout,
        partTypeCountMap,
        uniquePartTypeSet,
        haveRangeAttack
    );

    // 3. calculate move part 1
    const moveParts1: string[] = calculateMoveParts1(
        layout,
        partTypeCountMap,
        uniquePartTypeSet,
        haveRangeAttack
    );

    // 4. calculate move part 2
    const moveParts2: string[] = calculateMoveParts2(
        layout,
        partTypeCountMap,
        uniquePartTypeSet,
        haveRangeAttack
    );

    // 5. calculate center layout loop
    const centerLayoutParts: string[] = calculateCenterLayoutParts(
        layout,
        partTypeCountMap,
        uniquePartTypeSet,
        haveRangeAttack
    );

    // 6. calculate additional parts (which only exist in parts but not in layout)
    const additionalParts: string[] = calculateAdditionalParts(
        layout,
        partTypeCountMap,
        uniquePartTypeSet,
        haveRangeAttack
    );

    // 7. calculate additional parts (which only exist in parts but not in layout)

    const resultParts: string[] = [];

    resultParts.push(...frontToughParts);
    resultParts.push(...moveParts1);
    resultParts.push(...centerLayoutParts);
    resultParts.push(...additionalParts);
    resultParts.push(...moveParts2);
    resultParts.push(...buriedParts);

    return resultParts

};

/**
 * calculateBuriedParts
 *
 * @param {CreepPartData} layout
 * @param {Map<string, number>}  partTypeCountMap
 * @param {Set<string>}  uniquePartTypeSet
 * @param {boolean} haveRangeAttack
 * @return {string[]} calculateBuriedParts
 */
function calculateBuriedParts(
    layout: CreepPartData,
    partTypeCountMap: Map<string, number>,
    uniquePartTypeSet: Set<string>,
    haveRangeAttack: boolean
) {
    const buriedParts = [];
    for (const part of uniquePartTypeSet) {
        switch (part) {
            case MOVE:
            case HEAL:
            case RANGED_ATTACK:
            case TOUGH:
                continue;
            default:
        }
        const partCount: number = partTypeCountMap.get(part);
        if (partCount > 0) {
            buriedParts.push(part);
            partTypeCountMap.set(part, partCount - 1);
        }
    }
    const movePartsTotal: number = partTypeCountMap.get(MOVE);
    if (movePartsTotal > 0) {
        buriedParts.push(MOVE);
        partTypeCountMap.set(MOVE, movePartsTotal - 1);
    }
    const healPartsTotal: number = partTypeCountMap.get(HEAL);
    if (healPartsTotal > 0) {
        buriedParts.push(
            ...Array<string>(healPartsTotal).fill(HEAL)
        );
        partTypeCountMap.set(HEAL, 0);
    }
    const rangedAttackPartsTotal: number = partTypeCountMap.get(RANGED_ATTACK);
    if (rangedAttackPartsTotal > 0) {
        buriedParts.push(RANGED_ATTACK);
        partTypeCountMap.set(RANGED_ATTACK, rangedAttackPartsTotal - 1);
    }
    return buriedParts;
}

/**
 * calculateFrontToughParts
 *
 * @param {CreepPartData} layout
 * @param {Map<string, number>}  partTypeCountMap
 * @param {Set<string>}  uniquePartTypeSet
 * @param {boolean} haveRangeAttack
 * @return {string[]} calculateFrontToughParts
 */
function calculateFrontToughParts(
    layout: CreepPartData,
    partTypeCountMap: Map<string, number>,
    uniquePartTypeSet: Set<string>,
    haveRangeAttack: boolean
) {
    const frontToughParts = Array(partTypeCountMap.get(TOUGH)).fill(TOUGH);
    partTypeCountMap.set(TOUGH, 0);
    return frontToughParts;
}

/**
 * calculateMoveParts1
 *
 * @param {CreepPartData} layout
 * @param {Map<string, number>}  partTypeCountMap
 * @param {Set<string>}  uniquePartTypeSet
 * @param {boolean} haveRangeAttack
 * @return {string[]} calculateMoveParts1
 */
function calculateMoveParts1(
    layout: CreepPartData,
    partTypeCountMap: Map<string, number>,
    uniquePartTypeSet: Set<string>,
    haveRangeAttack: boolean
) {
    const movePartsTotal: number = partTypeCountMap.get(MOVE);
    const moveParts1MoveCount: number = movePartsTotal % 2 === 0 ? movePartsTotal / 2 : (movePartsTotal + 1) / 2;
    const moveParts1 = Array(moveParts1MoveCount).fill(MOVE);
    partTypeCountMap.set(MOVE, movePartsTotal - moveParts1MoveCount);
    return moveParts1;
}

/**
 * calculateMoveParts2
 *
 * @param {CreepPartData} layout
 * @param {Map<string, number>}  partTypeCountMap
 * @param {Set<string>}  uniquePartTypeSet
 * @param {boolean} haveRangeAttack
 * @return {string[]} calculateMoveParts2
 */
function calculateMoveParts2(
    layout: CreepPartData,
    partTypeCountMap: Map<string, number>,
    uniquePartTypeSet: Set<string>,
    haveRangeAttack: boolean
) {
    let moveParts2: string[];
    if (haveRangeAttack) {
        moveParts2 = [];
    } else {
        const moveParts2MoveCount: number = partTypeCountMap.get(MOVE);
        moveParts2 = Array(moveParts2MoveCount).fill(MOVE);
        partTypeCountMap.set(MOVE, 0);
    }
    return moveParts2;
}

/**
 * calculateCenterLayoutParts
 *
 * @param {CreepPartData} layout
 * @param {Map<string, number>}  partTypeCountMap
 * @param {Set<string>}  uniquePartTypeSet
 * @param {boolean} haveRangeAttack
 * @return {string[]} calculateCenterLayoutParts
 */
function calculateCenterLayoutParts(
    layout: CreepPartData,
    partTypeCountMap: Map<string, number>,
    uniquePartTypeSet: Set<string>,
    haveRangeAttack: boolean
) {
    const centerLayoutParts = [];
    let stillLooping: boolean = true;
    while (stillLooping) {
        stillLooping = false;
        for (const part of layout.parts) {
            if (!haveRangeAttack && part === MOVE) {
                continue;
            }
            const partCount: number = partTypeCountMap.get(part);
            if (partCount > 0) {
                centerLayoutParts.push(part);
                stillLooping = true;
                partTypeCountMap.set(part, partCount - 1);
            }
        }
    }
    return centerLayoutParts;
}

/**
 * calculateAdditionalParts
 *
 * @param {CreepPartData} layout
 * @param {Map<string, number>}  partTypeCountMap
 * @param {Set<string>}  uniquePartTypeSet
 * @param {boolean} haveRangeAttack
 * @return {string[]} calculateAdditionalParts
 */
function calculateAdditionalParts(
    layout: CreepPartData,
    partTypeCountMap: Map<string, number>,
    uniquePartTypeSet: Set<string>,
    haveRangeAttack: boolean
) {
    const additionalParts = [];
    for (const entry of partTypeCountMap.entries()) {
        if (entry[1] > 0) {
            additionalParts.push(
                ...Array<string>(entry[1]).fill(entry[0])
            );
            entry[1] = 0;
        }
    }
    return additionalParts;
}

export {CreepPartData, sortCreepParts}

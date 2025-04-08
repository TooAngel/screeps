/**
 * printRoomCostMatrix - prints the room.data.costMatrix
 *
 * @param {object} room
 * @return {void}
 */
function printRoomCostMatrix(room) {
  let line = '    ';
  for (let x = 0; x < 50; x++) {
    line += x.toString().padStart(3, ' ');
  }
  console.log(line);
  for (let y = 0; y < 50; y++) {
    let line = `${y.toString().padStart(3, ' ')} `;
    for (let x = 0; x < 50; x++) {
      line += room.data.costMatrix.get(x, y).toString().padStart(3, ' ');
    }
    console.log(line);
  }
}

module.exports.printRoomCostMatrix = printRoomCostMatrix;

/**
 * printCostMatrix - prints the room.data.costMatrix
 *
 * @param {object} costMatrix
 * @return {void}
 */
function printCostMatrix(costMatrix) {
  let line = '    ';
  for (let x = 0; x < 50; x++) {
    line += x.toString().padStart(3, ' ');
  }
  console.log(line);
  for (let y = 0; y < 50; y++) {
    let line = `${y.toString().padStart(3, ' ')} `;
    for (let x = 0; x < 50; x++) {
      line += costMatrix.get(x, y).toString().padStart(3, ' ');
    }
    console.log(line);
  }
}

module.exports.printCostMatrix = printCostMatrix;

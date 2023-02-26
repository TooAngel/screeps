'use strict';

const {debugLog} = require('./logging');
const pixelLog = (message) => {
  debugLog('pixel', message);
}

module.exports.handlePixel = function() {
  if (typeof PIXEL !== 'undefined') {
    // generate PIXEL
    if (Game.cpu.bucket >= PIXEL_CPU_COST + config.pixel.minBucketAfter) {
      global.load = Math.round(Game.cpu.getUsed());
      Game.cpu.generatePixel();
      const pixel = Game.resources[PIXEL] || ""
      const deltaPixel = Game.time - (global.data.pixel || 0)
      pixelLog(`PIXEL generated!\tCurrent ${pixel + 1}\t delta: ${deltaPixel} \t load: ${global.load}`)
      global.data.pixel = Game.time;
    }

    // sell PIXEL, make money to buy energy
    if (config.pixel.sell && Game.resources[PIXEL] > config.pixel.minPixelAmount) {
      const buyOrder = _.sortBy(Game.market.getAllOrders({type: "buy", resourceType: PIXEL}), (o) => -o.price)[0];
      if (buyOrder) {
        const history = Game.market.getHistory(PIXEL);
        const lastDay = history[history.length - 1];
        if (lastDay) {
          const minPriceToSell = (lastDay.avgPrice - (config.pixel.allowedSalesHistoryDeviation * lastDay.stddevPrice)).toPrecision(3);
          if (buyOrder.price >= minPriceToSell) {
            pixelLog(`PIXEL pices: ${buyOrder.price}\tamount: ${buyOrder.amount}\tlastDay.avgPrice: ${lastDay.avgPrice}\tlastDay.stddevPrice: ${lastDay.stddevPrice}\tminPrice: ${minPriceToSell}`)
            const amount = Math.min(buyOrder.amount, Game.resources[PIXEL] - config.pixel.minPixelAmount);
            Game.market.deal(buyOrder.id, amount);
            pixelLog(`PIXEL sold!\t${buyOrder.price} @ ${amount}`)
          }
        }
      } else {
        pixelLog(`PIXEL has no bestOrder ${buyOrder}`)
      }
    }
  }
}

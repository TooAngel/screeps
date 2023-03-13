/**
 * generatePixel
 */
function generatePixel() {
  if (global.config.pixel.enabled) {
    if (typeof PIXEL !== 'undefined') {
      if (Game.cpu.bucket >= PIXEL_CPU_COST + global.config.pixel.minBucketAfter) {
        Game.cpu.generatePixel();
      }
    }
  }
}

module.exports.generatePixel = generatePixel;

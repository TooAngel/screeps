module.exports.stats = function() {
  let aggregate = function(result, value, key) {
    result[value.pos.roomName] = (result[value.pos.roomName] || (result[value.pos.roomName] = 0)) + 1;
    return result;
  };
  let resultReduce = _.reduce(Game.constructionSites, aggregate, {});
  console.log(JSON.stringify(resultReduce));
};

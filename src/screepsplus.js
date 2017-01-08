/**
 * Loads a screepspl.us grafana agent into the client. This requires that you
 * load the authorization token as a string into Memory.screepsplusToken.
 *
 * NOTE: This is specifically for players that do not close their clients or
 *   do not care about data being pushed while they are not online. It will
 *   *only* work while a client is open.
 *
 * Author: SemperRabbit (special thanks to ags131 for assisting)
 */

global.runAgent = function() {
  Memory.screepsplusToken = config.stats.screepsplusToken;
  let output = `<SCRIPT>
  if(!document.pushStats){
    document.pushStats = function(){
      let el = angular.element($('body'));
      let conn = el.injector().get('Connection');
      Promise.all([
        conn.getMemoryByPath('','screepsplusToken'),
        conn.getMemoryByPath('','stats'),
      ]).then(function(data){
        let [token, stats] = data;
        let xhr=new XMLHttpRequest();
        xhr.open('POST', 'https://screepspl.us/api/stats/submit', true);
        xhr.setRequestHeader('Authorization','JWT ' + token);
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        xhr.onreadystatechange=function(){if(xhr.readyState===XMLHttpRequest.DONE&&xhr.status===200){console.log('resp',xhr.responseText);}};
        xhr.send(JSON.stringify(stats));
      }).catch(function(){});
    };
    document.pushStats();
    setInterval(document.pushStats, 15000);
  }
  </SCRIPT>`;
  console.log(output.split('\n').map((s) => s.trim()).join(''));
};
if (config.stats.enabled && config.stats.screepsplusToken) {
  runAgent();
}

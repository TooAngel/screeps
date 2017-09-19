#!/usr/bin/env bash

cd test-server
npm install
cd ..

screeps start \
  --db test-server/db.json \
  --logdir test-server/logs \
  --modfile test-server/mods.json \
  --assetdir test-server/assets \
  --cli_host localhost \
  --host 127.0.0.1 \
  --password tooangel \
  &

sleep 5
echo 'Spawn bot'
echo "bots.spawn('screeps-bot-tooangel', 'W1N7', {username: 'TooAngel', cpu: 100, gcl: 1, x: 43, y: 35})" | screeps cli &
sleep 2
echo "storage.db.users.update({username: 'TooAngel'}, {\$set: {password: '70dbaf0462458b31ff9b3d184d06824d1de01f6ad59cae7b5b9c01a8b530875ac502c46985b63f0c147cf59936ac1be302edc532abc38236ab59efecb3ec7f64fad7e4544c1c5a5294a8f6f45204deeb009a31dd6e81e879cfb3b7e63f3d937f412734b1a3fa7bc04bf3634d6bc6503bb0068c3f6b44f3a84b5fa421690a7399799e3be95278381ae2ac158c27f31eef99db1f21e75d285802cda983cd8a73a8a85d03ba45dcc7eb2b2ada362887df10bf74cdcca47f911147fd0946fb5119c888f048000044072dcc29b1c428b40b805cadeee7b3afc1e9d9d546c2a878ff8df9fcf805a28cc8b6e4b78051f0adb33642f1097bf0a189f388860302df6173b8e7955a35b278655df2d7615b54da6c63dc501c7914d726bea325c2225f343dff0068ac42300661664ee5611eb623e1efa379f571d46ba6a0e13a9e3e9c5bb7a772b685258f768216a830c5e9af3685898d98a9935cca2ba5efb5e1e4a9f2745c53bff318bda3e376bcd06b06d87a55045a76a1982f6e3b9fb77d39c2ff5c09c76989d1c779655bc2acdf55879b68f6155d14c26bdca3af5c7fd6de9926dbc091da280e6f7e3d727fa68c89aa8ac25b5e50bd14bf2dbcd452975710ef4b8d61a81c8f6ef2d5584eacfcb1ab4202860320f03313d23076a3b3e085af5f0a9e010ddb0ad5af57ed0db459db0d29aa2bcbcd64588d4c54d0c5265bf82f31349d9456', salt: '7eeb813417828682419582da8f997dea3e848ce8293e68b2dbb2f334b1f8949f'}})" | screeps cli &
sleep 3
node utils/check_private_server.js &
echo "system.resumeSimulation()" | screeps cli &

echo $PID
sleep 300
echo "storage.db['rooms.objects'].find({room: 'W1N7', type: 'controller'})" | screeps cli > output.log &
sleep 5
kill %1 %2 %3 %4

grep "progress:" output.log
if grep -q "progress: 0" output.log;
then
    echo '!!! No progress on the controller !!!'
    rm output.log
    exit 1
else
    echo 'Yeah'
    rm output.log
    exit 0
fi

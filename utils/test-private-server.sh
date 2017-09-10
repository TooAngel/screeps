#!/usr/bin/env bash

screeps start \
  --db test-server/db.json \
  --logdir test-server/logs \
  --modfile test-server/mods.json \
  --assetdir tesst-server/assets \
  --cli_host localhost \
  --host 127.0.0.1 \
  &
sleep 5
echo 'Spawn bot'
echo "bots.spawn('screeps-bot-tooangel', 'W1N7')" | screeps cli &
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

# Autoload
atm only for private servers:
because removed grunt task + config for screeps.com

## workflow

 - edit files in `./src`
 - run `grunt private`
 - sync files in `./build` manually with your host
 
### internal
on run `grunt private` we do

 - check files in `./src`
 - do a `grunt test` on success move them to `./dest`
 - concat files from `./dest` to `./build` in right order 
 
### todo 
 - upload or sync with your favorite sync system the `./build/main.js`
 - create `grunt sync:privateA`, `grunt sync:privateB`, `grunt sync:privateC` with `privateA.json`, `privateB.json`, `privateC.json` ...
 - add grunt task + config for `screeps.com`

### left requires
 - require('autoload'), (nealy) empty file
 - require('screeps-profiler'), surrounded by try catch
 - require('config_local'), surrounded by try catch

## postprocessing
move following files to destination
 
 - latest.screeps-bot-tooangel.js
 - autoload.js
 - screeps-profiler.js
 
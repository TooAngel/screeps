'use strict';

let usedOnStart = 0;
let enabled = false;
let depth = 0;

function AlreadyWrappedError() {
  this.name = 'AlreadyWrappedError';
  this.message = 'Error attempted to double wrap a function.';
  this.stack = ((new Error())).stack;
}

function setupProfiler() {
  depth = 0; // reset depth, this needs to be done each tick.
  Game.profiler = {
    stream(duration, filter) {
      setupMemory('stream', duration || 10, filter);
    },
    email(duration, filter) {
      setupMemory('email', duration || 100, filter);
    },
    profile(duration, filter) {
      setupMemory('profile', duration || 100, filter);
    },
    background(filter) {
      setupMemory('background', false, filter);
    },
    restart() {
      if (Profiler.isProfiling()) {
        const filter = Memory.profiler.filter;
        let duration = false;
        if (!!Memory.profiler.disableTick) {
          // Calculate the original duration, profile is enabled on the tick after the first call,
          // so add 1.
          duration = Memory.profiler.disableTick - Memory.profiler.enabledTick + 1;
        }
        const type = Memory.profiler.type;
        setupMemory(type, duration, filter);
      }
    },
    reset: resetMemory,
    output: Profiler.output,
  };

  overloadCPUCalc();
}

function setupMemory(profileType, duration, filter) {
  resetMemory();
  const disableTick = Number.isInteger(duration) ? Game.time + duration : false;
  if (!Memory.profiler) {
    Memory.profiler = {
      map: {},
      totalTime: 0,
      enabledTick: Game.time + 1,
      disableTick,
      type: profileType,
      filter,
    };
  }
}

function resetMemory() {
  Memory.profiler = null;
}

function overloadCPUCalc() {
  if (Game.rooms.sim) {
    usedOnStart = 0; // This needs to be reset, but only in the sim.
    Game.cpu.getUsed = function getUsed() {
      return performance.now() - usedOnStart;
    };
  }
}

function getFilter() {
  return Memory.profiler.filter;
}

const functionBlackList = [
  'getUsed', // Let's avoid wrapping this... may lead to recursion issues and should be inexpensive.
  'constructor', // es6 class constructors need to be called with `new`
];

function wrapFunction(name, originalFunction) {
  if (originalFunction.profilerWrapped) { throw new AlreadyWrappedError(); }
  function wrappedFunction() {
    if (Profiler.isProfiling()) {
      const nameMatchesFilter = name === getFilter();
      const start = Game.cpu.getUsed();
      if (nameMatchesFilter) {
        depth++;
      }
      const result = originalFunction.apply(this, arguments);
      if (depth > 0 || !getFilter()) {
        const end = Game.cpu.getUsed();
        Profiler.record(name, end - start);
      }
      if (nameMatchesFilter) {
        depth--;
      }
      return result;
    }

    return originalFunction.apply(this, arguments);
  }

  wrappedFunction.profilerWrapped = true;
  wrappedFunction.toString = () =>
    `// screeps-profiler wrapped function:\n${originalFunction.toString()}`;

  return wrappedFunction;
}

function hookUpPrototypes() {
  Profiler.prototypes.forEach(proto => {
    profileObjectFunctions(proto.val, proto.name);
  });
}

function profileObjectFunctions(object, label) {
  const objectToWrap = object.prototype ? object.prototype : object;

  Object.getOwnPropertyNames(objectToWrap).forEach(functionName => {
    const extendedLabel = `${label}.${functionName}`;

    const isBlackListed = functionBlackList.indexOf(functionName) !== -1;
    if (isBlackListed) {
      return;
    }

    const descriptor = Object.getOwnPropertyDescriptor(objectToWrap, functionName);
    if (!descriptor) {
      return;
    }

    const hasAccessor = descriptor.get || descriptor.set;
    if (hasAccessor) {
      const configurable = descriptor.configurable;
      if (!configurable) {
        return;
      }

      const profileDescriptor = {};

      if (descriptor.get) {
        const extendedLabelGet = `${extendedLabel}:get`;
        profileDescriptor.get = profileFunction(descriptor.get, extendedLabelGet);
      }

      if (descriptor.set) {
        const extendedLabelSet = `${extendedLabel}:set`;
        profileDescriptor.set = profileFunction(descriptor.set, extendedLabelSet);
      }

      Object.defineProperty(objectToWrap, functionName, profileDescriptor);
      return;
    }

    const isFunction = typeof descriptor.value === 'function';
    if (!isFunction) {
      return;
    }
    const originalFunction = objectToWrap[functionName];
    objectToWrap[functionName] = profileFunction(originalFunction, extendedLabel);
  });

  return objectToWrap;
}

function profileFunction(fn, functionName) {
  const fnName = functionName || fn.name;
  if (!fnName) {
    console.log('Couldn\'t find a function name for - ', fn);
    console.log('Will not profile this function.');
    return fn;
  }

  return wrapFunction(fnName, fn);
}

const Profiler = {
  printProfile() {
    console.log(Profiler.output());
  },

  emailProfile() {
    Game.notify(Profiler.output(1000));
  },

  output(passedOutputLengthLimit) {
    const outputLengthLimit = passedOutputLengthLimit || 1000;
    if (!Memory.profiler || !Memory.profiler.enabledTick) {
      return 'Profiler not active.';
    }

    const endTick = Math.min(Memory.profiler.disableTick || Game.time, Game.time);
    const startTick = Memory.profiler.enabledTick + 1;
    const elapsedTicks = endTick - startTick;
    const header = 'calls\t\ttime\t\tavg\t\tfunction';
    const footer = [
      `Avg: ${(Memory.profiler.totalTime / elapsedTicks).toFixed(2)}`,
      `Total: ${Memory.profiler.totalTime.toFixed(2)}`,
      `Ticks: ${elapsedTicks}`,
    ].join('\t');

    const lines = [header];
    let currentLength = header.length + 1 + footer.length;
    const allLines = Profiler.lines();
    let done = false;
    while (!done && allLines.length) {
      const line = allLines.shift();
      // each line added adds the line length plus a new line character.
      if (currentLength + line.length + 1 < outputLengthLimit) {
        lines.push(line);
        currentLength += line.length + 1;
      } else {
        done = true;
      }
    }
    lines.push(footer);
    return lines.join('\n');
  },

  lines() {
    const stats = Object.keys(Memory.profiler.map).map(functionName => {
      const functionCalls = Memory.profiler.map[functionName];
      return {
        name: functionName,
        calls: functionCalls.calls,
        totalTime: functionCalls.time,
        averageTime: functionCalls.time / functionCalls.calls,
      };
    }).sort((val1, val2) => {
      return val2.totalTime - val1.totalTime;
    });

    const lines = stats.map(data => {
      return [
        data.calls,
        data.totalTime.toFixed(1),
        data.averageTime.toFixed(3),
        data.name,
      ].join('\t\t');
    });

    return lines;
  },

  prototypes: [
    { name: 'Game', val: Game },
    { name: 'Room', val: Room },
    { name: 'Structure', val: Structure },
    { name: 'Spawn', val: Spawn },
    { name: 'Creep', val: Creep },
    { name: 'RoomPosition', val: RoomPosition },
    { name: 'Source', val: Source },
    { name: 'Flag', val: Flag },
  ],

  record(functionName, time) {
    if (!Memory.profiler.map[functionName]) {
      Memory.profiler.map[functionName] = {
        time: 0,
        calls: 0,
      };
    }
    Memory.profiler.map[functionName].calls++;
    Memory.profiler.map[functionName].time += time;
  },

  endTick() {
    if (Game.time >= Memory.profiler.enabledTick) {
      const cpuUsed = Game.cpu.getUsed();
      Memory.profiler.totalTime += cpuUsed;
      Profiler.report();
    }
  },

  report() {
    if (Profiler.shouldPrint()) {
      Profiler.printProfile();
    } else if (Profiler.shouldEmail()) {
      Profiler.emailProfile();
    }
  },

  isProfiling() {
    if (!enabled || !Memory.profiler) {
      return false;
    }
    return !Memory.profiler.disableTick || Game.time <= Memory.profiler.disableTick;
  },

  type() {
    return Memory.profiler.type;
  },

  shouldPrint() {
    const streaming = Profiler.type() === 'stream';
    const profiling = Profiler.type() === 'profile';
    const onEndingTick = Memory.profiler.disableTick === Game.time;
    return streaming || (profiling && onEndingTick);
  },

  shouldEmail() {
    return Profiler.type() === 'email' && Memory.profiler.disableTick === Game.time;
  },
};

module.exports = {
  wrap(callback) {
    if (enabled) {
      setupProfiler();
    }

    if (Profiler.isProfiling()) {
      usedOnStart = Game.cpu.getUsed();

      // Commented lines are part of an on going experiment to keep the profiler
      // performant, and measure certain types of overhead.

      // var callbackStart = Game.cpu.getUsed();
      const returnVal = callback();
      // var callbackEnd = Game.cpu.getUsed();
      Profiler.endTick();
      // var end = Game.cpu.getUsed();

      // var profilerTime = (end - start) - (callbackEnd - callbackStart);
      // var callbackTime = callbackEnd - callbackStart;
      // var unaccounted = end - profilerTime - callbackTime;
      // console.log('total-', end, 'profiler-', profilerTime, 'callbacktime-',
      // callbackTime, 'start-', start, 'unaccounted', unaccounted);
      return returnVal;
    }

    return callback();
  },

  enable() {
    enabled = true;
    hookUpPrototypes();
  },

  output: Profiler.output,

  registerObject: profileObjectFunctions,
  registerFN: profileFunction,
  registerClass: profileObjectFunctions,
};

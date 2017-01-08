## Room

### Setup

Positions:
 - `upgrader` creep next to the `controller`
 - `storage` structure next to the `upgrader`
 - `filler` creep next to the `storage`
 - `pathStart` position next to the `storage`


From `pathStart` all (sources, controller, mineral, mid of each exit) paths
are calculated and saved. The longest path is used to place structures (spawn,
extension, lab, observer, terminal, tower) next to it. Next to `filler` a link,
tower and power_spawn is located. `Link`s are placed next to the sources and at
the paths to the exits. Layers of walls are placed at the exits, positions
within the precalculated paths are replaced by ramparts.

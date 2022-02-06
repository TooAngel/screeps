# TooAngel bot on a private server

You feel lonely, already dominating the default bots or just want to have some more action on your server, then you are at the right place.

## Installation

Follow the instructions on [Steam](http://steamcommunity.com/sharedfiles/filedetails/?id=800902233) or

- Launch your `Dedicated Server` via steam
- Click on `MODS`
- `Browse Steam Workshop`
- Search for `screeps-bot-tooangel` and `subscribe`
- Restart the server
- And execute in the `CLI` `bots.spawn('screeps-bot-tooangel', 'W7N4')` (or replace the room name with something else)

### Alternatively

- Add
```
  "bots": {
    "screeps-bot-tooangel": "node_modules/screeps-bot-tooangel/src"
  }
```
to your `mods.json`

## Interaction

For interaction details head of to [TooAngel NPC](NPC.md)
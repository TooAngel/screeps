# API

The API is all about reputation and collaboration via Quests.
Reputation equals somehow a credit value, actions are mostly based on the current market value of a certain item. E.g. attacking the TooAngel NPC with a Nuke reduces the reputation with a market value of `CPU_UNLOCK`.

## Increase reputation via resources

- Sending resources via terminal transfer increases the reputation based on the market value of the resource.

## Information about the reputation

### Highscores

The TooAngel NPC provides two public memory segments 1 and 2.
- Segment 1 shows the top 10 players (highest reputation)
- Segment 2 shows the bottom 10 players (lowest reputation) 

### Request reputation

To get your current reputation send a terminal transfer to one of the TooAngel NPC rooms.
Sufficient energy needs to be send, so that the TooAngel NPC can send a response.

`{"type": "reputation"}`

Response:

`{"type": "reputation", "reputation": "REPUTATION"}`

## Quests API

### Apply for quests (optional, mainly used to increase visibility of the quest feature)

The TooAngel NPC provides quests via controller signs. This allows player to apply for quests and gives visibility of the Quests feature for other players.
The sign has the format:

```
{
    "type": "quest",
    "id": "QUEST_ID",
    "origin": "ROOM_NAME",
    "info": "http://tooangel.github.io/screeps"
}
```

To apply for a Quest send a message via terminal transfer to the `origin` room, with the content:

```
{
    "type": "quest",
    "id": "QUEST_ID",
    "action": "apply"
}
```

The actual quest will be send to the room the transfer was initiated from.

## Getting / Sending quests

Quests can be received from the TooAngel NPC and also send to the TooAngel NPC.
When quests are solved the reputation increases.
When quests are send to the TooAngel NPC the reputation is decreased.

### Quest format

Quests are send via terminal transfer:

```
{
  "type": "quest",
  "id": "QUEST_ID",
  "room": "ROOM_NAME, in which the quest needs to be solved",
  "quest": "TYPE OF QUEST",
  "end": "Game.time when the quest needs to be finished"
}
```

Quest types can be found in [Quests](Quests.md)

### Quest completed (optional)

The TooAngel NPC sends a quest completion message, with a certain amount of resources. This is not necessary when sending quests to the TooAngel NPC.
Internally the reputation is increased.

```
{
  "type": "quest",
  "id": "QUEST_ID",
  "result": "won"
};
```
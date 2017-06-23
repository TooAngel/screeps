# Quests

The TooAngel AI provides Quests which solvable by other players. Solving a
quest brings reputation and sometimes resources, too. With increasing reputation
the difficulty level of the quests increases, from build some constructionSites
up to 'Room xyz needs to have an unclaimed controller in tick ...'

The reputation of the players is public visible and gives an indicator how
advanced other players are. And hopefully it brings even more fun
playing against the TooAngel bot on a private server.

And most important, the best way I could come up with to handle interaction
of the TooAngel AI instances.

The reputation weights other players, e.g. players with high
reputation can pass through reserved or controlled rooms without punishment.
Other players can send quests to the TooAngel AI, which they solved.

## Communication

Quests locations are controller signs, in the following example in room `W2N7`.

    {"type": "Quest", "id": 0.3451, "origin": "W1N7", info: "http://tooangel.github.io/screeps/doc/Quests.html"}

To apply for the Quest, send a message via Terminal transfer to the `origin` room.

   {"type": "Quest", "id": 0.3451, "room": "W2N7"}

 - `room` quest location

On acceptance of the application, a response is send via terminal transfer.

   {"type": "Quest", "id": 0.3451, "room": "W3N8", "quest": "buildcs", "end": 12345653}

  - `room` the room to solve quest
  - `type` quest type
  - `end` the end time of the quest

On successful finishing a quest a terminal transfer is send

  {"type": "Quest", "id": 0.3451, "reputation": "100", "result": "won"}

 - `reputation` the current reputation of the player


Quests can be:
 - `buildcs` Build all construction sites in the given room
 - **tbd** Write your (or my) name with roads (or walls) in a specific room
 - **tbd** Defend specific room for some time
 - **tbd** Defend your room
 - **tbd** Attack my (or someone else) room
 - ...

If necessary the `Quester` creep will watch the progress and needs to stay alive.

Next level:
To introduce the bidirectional collaboration a Quest will send, to give
a Quest back to our AI. After that both sides are able to send Quests to each other.

To avoid misuse, requesting Quests will cost reputation. The requestable
quest types depend on the reputation level.

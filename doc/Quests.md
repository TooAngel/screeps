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

For communication see: [API](API.md)


Quests can be:
 - `buildcs` Build all construction sites in the given room
 - **tbd** Write your (or my) name with roads (or walls or creeps) in a specific room
 - **tbd** Bring `resource` to room
 - **tbd** Send `resource` via terminal to room
 - **tbd** Get `resource` via creep from room
 - **tbd** Defend specific room for some time
 - **tbd** Defend your room
 - **tbd** Attack my (or someone else) room
 - **tbd** Sign controller in room with `[username] smells funny`
 - **tbd** Dismantle structure `id` in room
 - **tbd** Solving math problems: Send a creep to a room and `say` math problems and the other creep need to `say` the solution
 - **tbd** Send a creep with random `BODYPARTS` to a room
 - ...

If necessary the `Quester` creep will watch the progress and needs to stay alive.

Next level:
To introduce the bidirectional collaboration a Quest will send, to give
a Quest back to our AI. After that both sides are able to send Quests to each other.

To avoid misuse, requesting Quests will cost reputation. The requestable
quest types depend on the reputation level.

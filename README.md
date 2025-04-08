# TooAngel NPC / bot / source code for screeps

[![CircleCI](https://circleci.com/gh/TooAngel/screeps.svg?style=svg)](https://circleci.com/gh/TooAngel/screeps)
[![npm version](https://badge.fury.io/js/screeps-bot-tooangel.svg)](https://badge.fury.io/js/screeps-bot-tooangel)
[![Maintainability](https://api.codeclimate.com/v1/badges/3c8ff1391c93ab7209af/maintainability)](https://codeclimate.com/github/TooAngel/screeps/maintainability)
[![discord](./doc/discord-logo-blue.png)](https://discord.gg/RrGFHKb)


This project is a code base for [screeps](https://screeps.com/) a strategy sandbox MMO game. The codebase is a fully automated player and covers all important features provided by the game.

Nowadays there are a couple of other automated screeps bot around. The
TooAngel bot layed the groundwork for bots on the private server and the full
automation idea. It was the first full automated open source code base and
invented the idea of an community driven merge processes as well as a full
automated bot deploy process.

Pull Requests are automatically merged ([World Driven](https://www.worlddriven.org)) and deployed to the
[Screeps TooAngel account](https://www.screeps.com).

## Use cases

There are different occasions where you get into contact with the TooAngel NPC / bot / source code.

- [As NPC on the public server](doc/NPC.md)
- [Deployed as bot on a private server](doc/Bot.md)
- [Using it as code base](doc/CodeBase.md)

## Note

This is not a good example for code quality or structure, most LOCs written
while fighting or other occasions which needed quick fixes or in the ingame
editor (getting better :-)). But I think there are a couple of funny ideas.
Every contribution is welcome.

## Features

 - [Automatic Base building](doc/BaseBuilding.md)
 - Remote harvesting
 - [Mineral handling, harvesting, market, reactions and boosting](doc/Mineral.md)
 - Power and Commodity harvesting
 - Room extension
 - [Diplomatic module, for retaliations](doc/Diplomacy.md)
 - Reviving attacked rooms
 - [Quests](doc/Quests.md)
 
 - [Layout visualization](doc/Visualization.md)
 - [Manual commands](doc/Manual.md)
 - [Testing](doc/Testing.md)


## Design

[More details of the AI design](doc/Design.md)

## Links

- [Game Docs](https://docs.screeps.com/)
- [API Docs](https://docs.screeps.com/api/)

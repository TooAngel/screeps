# TooAngel NPC / bot / source code for screeps

[![CircleCI](https://circleci.com/gh/TooAngel/screeps.svg?style=svg)](https://circleci.com/gh/TooAngel/screeps)
[![npm version](https://badge.fury.io/js/screeps-bot-tooangel.svg)](https://badge.fury.io/js/screeps-bot-tooangel)
[![Maintainability](https://api.codeclimate.com/v1/badges/3c8ff1391c93ab7209af/maintainability)](https://codeclimate.com/github/TooAngel/screeps/maintainability)
[![Discord](https://img.shields.io/discord/860665589738635336?color=7289da&label=Discord&logo=discord&logoColor=white)](https://discord.gg/RrGFHKb)


This project is a codebase for [Screeps](https://screeps.com/), a strategy sandbox MMO game. The codebase is a fully automated player that covers all important features provided by the game.

The TooAngel bot laid the groundwork for bots on private servers and pioneered the full automation concept. It was the first fully automated open source codebase and introduced the concept of community-driven merge processes as well as fully automated bot deployment.

Pull Requests are automatically merged ([World Driven](https://www.worlddriven.org)) and deployed to the
[Screeps TooAngel account](https://www.screeps.com).

## Use cases

There are different occasions where you get into contact with the TooAngel NPC / bot / source code.

- [As NPC on the public server](doc/NPC.md)
- [Deployed as bot on a private server](doc/Bot.md)
- [Using it as code base](doc/CodeBase.md)

## Contributing

This project welcomes all kinds of contributions! Whether you're reporting issues, suggesting features, or submitting pull requests, your input helps improve the bot.

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details about the automated merge process and how to get involved.

The codebase includes many innovative ideas and solutions developed through practical gameplay experience. While some code was written quickly during active gameplay situations, the project continues to evolve and improve with community contributions.

## Features

### Core Automation
- [Automatic base building](doc/BaseBuilding.md) - Smart room layout and construction
- Remote harvesting - Automated resource collection from external rooms
- Room extension and expansion management
- Reviving attacked rooms automatically

### Resource Management
- [Mineral handling, harvesting, market, reactions and boosting](doc/Mineral.md)
- Power and commodity harvesting
- Automated market trading

### AI Systems
- [Trapped scenario detection](doc/Design.md#trapped-detection-system) - Detects when bot is imprisoned by hostile players
- [Diplomatic module for retaliations](doc/Diplomacy.md) - Reputation-based player interactions
- [Quest system](doc/Quests.md) - Interactive challenges for other players

### Development Tools
- [Layout visualization](doc/Visualization.md) - Visual debugging tools
- [Manual commands](doc/Manual.md) - Administrative controls
- [Testing framework](doc/Testing.md) - Automated testing system


## Design

[More details of the AI design](doc/Design.md)

## Links

- [Game Docs](https://docs.screeps.com/)
- [API Docs](https://docs.screeps.com/api/)

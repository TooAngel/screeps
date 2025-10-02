# Diplomacy System

The TooAngel bot features a sophisticated reputation-based diplomacy system that dynamically adjusts behavior based on interactions with other players.

## Reputation Mechanics

### Core Concept
A `reputation` score is maintained for each player the bot encounters. This score influences all future interactions and determines the bot's behavioral responses to that player.

### Reputation Factors

#### Positive Actions (Increase Reputation)
- **Resource Transfers**: Sending resources via terminal increases reputation based on market value
- **Quest Completion**: Successfully solving quests provides significant reputation bonuses
- **Peaceful Coexistence**: Respecting room boundaries and avoiding hostile actions
- **Collaborative Behavior**: Supporting mutual objectives and peaceful interactions

#### Negative Actions (Decrease Reputation)
- **Hostile Creeps**: Sending armed creeps into controlled rooms
- **Structure Destruction**: Attacking or destroying spawns, towers, and other structures
- **Nuclear Attacks**: Launching nukes results in severe reputation penalties
- **Resource Theft**: Attempting to steal resources or disrupt operations

## Behavioral Responses

### Positive Reputation Benefits
- **Safe Passage**: Player creeps can move through reserved/controlled rooms without retaliation
- **Resource Sharing**: Access to power banks and other valuable resources in bot-controlled areas
- **Quest Priority**: Higher chance of receiving valuable or interesting quests
- **Defensive Assistance**: Bot may provide defensive support in certain situations

### Negative Reputation Consequences
- **Room Harassment**: Bot becomes annoying presence in player's reserved rooms
- **Active Hostility**: Direct attacks on player's rooms and structures
- **Nuclear Retaliation**: Severe negative reputation may trigger nuclear responses
- **Resource Denial**: Blocked access to shared resources and opportunities

## Reputation Levels

The system operates on multiple reputation thresholds that trigger different behavioral states:

### High Positive (Ally Status)
- Full cooperation and resource sharing
- Priority quest offerings
- Defensive pacts and mutual protection

### Moderate Positive (Friendly)
- Safe passage through territories
- Basic resource sharing opportunities
- Standard quest interactions

### Neutral (Default)
- Standard defensive behavior
- Limited interactions based on immediate context

### Moderate Negative (Hostile)
- Increased territorial aggression
- Resource competition and denial
- Retaliatory strikes for continued hostility

### High Negative (Enemy Status)
- Full warfare protocols activated
- Nuclear deterrent deployment
- Persistent harassment and attack patterns

## Integration with Quest System

The diplomacy system is tightly integrated with the [Quest system](Quests.md), where reputation determines:
- Quest difficulty and rewards
- Quest availability and types
- Trust levels for collaborative missions
- Penalty systems for quest failures

For detailed API information about reputation queries and diplomatic communications, see [API.md](API.md).
# Mineral Handling

The TooAngel bot includes comprehensive mineral management for advanced gameplay features including reactions, boosting, and market trading.

## Mining and Storage

### Basic Storage Strategy
- **Room mineral**: Harvested and stored in terminal up to 500k units
- **Other minerals**: Stored up to 1k units each for reaction purposes
- **Base minerals**: Automatically requested via terminal transfer from other controlled rooms

### Extraction Process
- Mineral extractors are built automatically when room reaches appropriate RCL
- Mining operations coordinate with container placement and carry creep logistics
- Extracted minerals are transported to terminal for storage and distribution

## Reactions and Processing

### Reaction Chain Management
- All minerals are automatically reacted to their most advanced compounds
- Reaction priority follows game's compound dependency tree
- Labs are automatically filled and managed by dedicated mineral creeps

### Lab Operations
- **Mineral creeps**: Specialized role responsible for filling labs with required compounds
- **Reaction scheduling**: Optimizes lab usage for maximum compound production efficiency
- **Boost preparation**: Ensures required compounds are available for creep boosting

## Market Integration

### Automated Trading
- Minerals exceeding storage thresholds are automatically sold on the market
- Market prices are monitored for optimal selling opportunities
- Trade orders are managed to maximize profit while maintaining essential reserves

## Creep Boosting

### Boost Request System
- Creeps request specific boosts during spawn process based on their assigned tasks
- After spawning, boosted creeps automatically move to appropriate labs
- Boost application is coordinated to minimize lab downtime

### Boost Types
- **Military creeps**: Combat-focused boosts for attack, heal, and tough compounds
- **Work creeps**: Efficiency boosts for construction, repair, and harvesting operations
- **Movement creeps**: Speed enhancements for critical logistics operations
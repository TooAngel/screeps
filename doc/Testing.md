# Testing

## Local Testing Environment

To test the bot in a local environment:
- Create a `.env` file in the project root (see `.env.example` for reference)
- This enables local development and testing without affecting the live bot

## Automated Testing

The following tests are automatically executed on new PRs and commits to master:

### Code Quality Checks
- **ESLint**: Code style and formatting validation
- **CircleCI Integration**: Continuous integration pipeline

### Functional Testing
- **Private Server Testing**: Deploys bot to a test server
- **Controller Upgrade Validation**: Verifies the bot can successfully upgrade room controllers within expected timeframes
- **Performance Benchmarks**: Ensures the bot operates efficiently under various conditions

## Testing Commands

```bash
# Setup test server with multiple bots
npm run setupTestServer

# Resume existing test environment
docker compose up

# Run local deployment
npm run deployLocal

# Manual testing server
node utils/test.js
```

## Test Configuration

For local testing configuration, see [CodeBase.md](CodeBase.md) for details on:
- Setting up `.screeps.yaml` for local server connections
- Configuring `config_local.js` for testing scenarios
- Using debug flags for detailed logging during tests

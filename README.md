# Spardose Analytics

AI-powered crypto position analysis platform with terminal-style interface.

## Features

- **Position Analysis**: Analyze DeFi position data and get insights
- **Top Earning Analysis**: Identify top performing positions from wallet pool data
- **Real-time Streaming**: Get AI responses as they're generated
- **Terminal Interface**: Clean, agentic-style terminal UI
- **Hidden Chat**: Optional AI chat assistant (toggle button)

## Quick Start

### Prerequisites

- Docker and Docker Compose
- OpenAI API key

### Setup

1. **Clone and configure**:
   ```bash
   git clone <repository-url>
   cd spardose
   cp server/.env.template server/.env
   # Edit server/.env with your OpenAI API key
   ```

2. **Start services**:
   ```bash
   docker-compose up -d
   ```

3. **Access**:
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/analyze/position` | POST | Analyze position data |
| `/analyze/top-earning` | POST | Analyze top earning positions |
| `/health` | GET | Health check |

## Environment Configuration

### Development
```bash
# server/.env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
DEBUG=true
```

### Production
```bash
# Setup production environment
./setup-production.sh

# Edit production config
nano server/.env.production

# Deploy to production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Docker Commands

```bash
# Development
docker-compose up -d

# Production (after running setup-production.sh)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Rebuild
docker-compose up -d --build

# Production rebuild
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Logs
docker-compose logs -f

# Production logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

## Test Data

Sample data is available in `server/tests/data/`:
- `position-plan-1.json`: Position analysis test data
- `top-earning-positions.json`: Top earning analysis test data

Use the "LOAD_SAMPLE" buttons in the UI to test with sample data.

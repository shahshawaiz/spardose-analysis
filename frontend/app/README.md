# Spardose Frontend

A modern Next.js frontend for the Spardose financial analysis platform.

## Project Structure

```
frontend/
├── app/                    # Next.js application
│   ├── components/        # React components
│   ├── lib/              # API client and utilities
│   ├── pages/            # Next.js pages
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── package.json          # Dependencies
├── Dockerfile           # Container config
└── README.md            # This file
```

- **Chat Interface**: Interactive chat with AI assistant
- **Analysis Tools**: Multiple analysis types for financial data
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **TypeScript**: Full type safety and better development experience
- **Docker Ready**: Containerized for easy deployment

## Available Analysis Types

1. **General Analysis**: General data analysis and insights
2. **Position Analysis**: Detailed position performance analysis
3. **Position Plans**: Find and analyze position plans
4. **Top Earning Analysis**: Identify and analyze top-performing positions

## Development

### Local Development

```bash
cd frontend
npm install
npm run dev
```

The Next.js app is located in the `app/` directory, matching the backend structure.

### Docker Development

```bash
# From project root
make frontend
# Or
docker-compose up --build spardose-frontend
```

## API Integration

The frontend communicates with the backend API through:
- Base URL: `http://localhost:8000` (configurable via `NEXT_PUBLIC_API_BASE_URL`)
- All API calls are handled through the `lib/api.ts` client
- Error handling and loading states included

## Environment Variables

- `NEXT_PUBLIC_API_BASE_URL`: Backend API base URL (default: http://localhost:8000)

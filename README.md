# 3 Raya Backend

This is the backend service for the 3 Raya (Tic-tac-toe) game, built with NestJS and MongoDB.

## Features

- RESTful API for game management
- Real-time game state tracking
- Move validation
- Game history storage
- Swagger API documentation

## Prerequisites

- Node.js (v18 or higher)
- MongoDB
- npm or yarn package manager

## Installation

```bash
# Install dependencies
npm install
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=3001
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Documentation

Once the application is running, you can access the Swagger API documentation at:
```
http://localhost:3001/api
```

## Available Scripts

- `npm run build` - Build the application
- `npm run format` - Format code using Prettier
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot-reload
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start in production mode
- `npm run lint` - Run ESLint
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Generate test coverage report
- `npm run test:e2e` - Run end-to-end tests

## Project Structure

```
src/
├── game/              # Game module
│   ├── dto/          # Data Transfer Objects
│   ├── game.controller.ts
│   ├── game.service.ts
│   ├── game.schema.ts
│   └── game.module.ts
├── app.module.ts      # Main application module
└── main.ts           # Application entry point
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Built With

- NestJS - A progressive Node.js framework
- MongoDB - NoSQL database
- Mongoose - MongoDB object modeling
- Jest - Testing framework
- Swagger - API documentation 

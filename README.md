## Getting Started

### Setting up the environment

1. Install dependencies:
```bash
pnpm install
```

2. Run the development server:
```bash
pnpm dev
```

### Running with Docker

Alternatively, to run the application using Docker, follow these steps:

1. Create a `.env` file based on `.env.example`.

2. Run with docker compose:
```bash
docker compose up
```

### Writing Tests

To add tests to the codebase, create a new file in __tests__ folder. The folder structure for this mimics the codebase and the new test may be placed accordingly. For each component all the props as well as child components may be mocked and their respective tests be created in a subsequent file. The page.test.tsx shows examples of how to mock functions and components.


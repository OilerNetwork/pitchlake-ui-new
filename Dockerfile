# Use Node.js v20 as the base image
FROM node:20-alpine AS builder

ARG NEXT_PUBLIC_VAULT_ADDRESS
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ENVIRONMENT
ARG NEXT_PUBLIC_RPC_URL_MAINNET
ARG NEXT_PUBLIC_RPC_URL_SEPOLIA
ARG NEXT_PUBLIC_RPC_URL_DEVNET
ARG NEXT_PUBLIC_RPC_URL_JUNO_DEVNET
ARG NEXT_PUBLIC_WS_URL
ARG FOSSIL_API_KEY
ARG FOSSIL_DB_URL
ARG NEXT_PUBLIC_FOSSIL_API_URL
ENV NEXT_PUBLIC_VAULT_ADDRESS=${NEXT_PUBLIC_VAULT_ADDRESS}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_ENVIRONMENT=${NEXT_PUBLIC_ENVIRONMENT}
ENV NEXT_PUBLIC_RPC_URL_MAINNET=${NEXT_PUBLIC_RPC_URL_MAINNET}
ENV NEXT_PUBLIC_RPC_URL_SEPOLIA=${NEXT_PUBLIC_RPC_URL_SEPOLIA}
ENV NEXT_PUBLIC_RPC_URL_DEVNET=${NEXT_PUBLIC_RPC_URL_DEVNET}
ENV NEXT_PUBLIC_RPC_URL_JUNO_DEVNET=${NEXT_PUBLIC_RPC_URL_JUNO_DEVNET}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
ENV FOSSIL_API_KEY=${FOSSIL_API_KEY}
ENV NEXT_PUBLIC_FOSSIL_API_URL=${NEXT_PUBLIC_FOSSIL_API_URL}

# Set the working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files first
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN pnpm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy necessary files from builder
COPY --from=builder /app/package.json .
COPY --from=builder /app/pnpm-lock.yaml* .
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Define the command to run the app
CMD pnpm start -p ${PORT}

# Multi-stage build: First build Jekyll site with Ruby
FROM ruby:3.1-slim as jekyll-builder

# Install build dependencies for Jekyll
RUN apt-get update && apt-get install -y \
    build-essential \
    make \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Define PORT argument for Jekyll build
ARG PORT=5100

WORKDIR /app
COPY gt-book/ ./

# Update Jekyll config to use localhost instead of production URL
RUN sed -i "s|gteurl: \"https://aworldmadebytravel\.supdigital\.org/explorer/\"|gteurl: \"http://localhost:${PORT}/explorer/\"|g" _config.yml

RUN gem install bundler jekyll && \
    bundle install && \
    bundle exec jekyll clean && \
    bundle exec jekyll build --baseurl "" --destination ./_site

# Main stage: Node.js for the Express app
FROM node:14-slim

# Install system dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    make \
    g++ \
    git \
    rsync \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install Node.js dependencies
COPY package*.json ./
RUN npm install

# Define PORT argument
ARG PORT=5100

# Copy source code (excluding gt-book since we'll get the built Jekyll content)
COPY . .

# Copy built Jekyll site from the jekyll-builder stage
COPY --from=jekyll-builder /app/_site ./_site

# Replace production URLs with localhost for local development throughout entire codebase
RUN find . -type f \( -name "*.html" -o -name "*.md" -o -name "*.js" -o -name "*.pug" \) -print0 | \
    xargs -0 sed -i "s|https://aworldmadebytravel\.supdigital\.org|http://localhost:${PORT}|g"

# Build the Explorer frontend
RUN npx webpack --mode=production

# Note: The Express app serves Jekyll content directly from _site via app.use('/', express.static('_site'))

# Expose port
EXPOSE $PORT

# Start the application
CMD ["npm", "start"]
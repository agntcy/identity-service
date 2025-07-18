# Financial Assistant UI

A minimal, modern chat interface for the Financial Assistant agent using a simple prompt-based protocol. The UI displays all messages, tool calls, and reasoning steps.

## Quick Start

### Docker Deployment

1. **Build the image**:
   ```bash
   docker build -t financial-assistant-ui .
   ```

2. **Run the container**:
   ```bash
   docker run -d -p 8080:80 --name financial-ui financial-assistant-ui
   ```

3. **Access the UI**:
   Open http://localhost:8080 in your browser

4. **Stop the container**:
   ```bash
   docker stop financial-ui && docker rm financial-ui
   ```

## Configuration

The UI connects to the backend agent at `http://localhost:9093/invoke` by default. You can configure this using environment variables:

### Environment Variables

- **`AGENT_URL`** - Backend agent URL (default: `http://localhost:9093/invoke`)

### Configuration Methods

1. **Using .env file**:
   ```bash
   # Edit .env file
   echo "AGENT_URL=http://your-agent:8080/invoke" > .env
   
   # Build and run with .env
   docker build -t financial-assistant-ui .
   docker run -d -p 8080:80 --env-file .env --name financial-ui financial-assistant-ui
   ```

2. **Using environment variables directly**:
   ```bash
   docker run -d -p 8080:80 -e AGENT_URL=http://your-agent:8080/invoke --name financial-ui financial-assistant-ui
   ```
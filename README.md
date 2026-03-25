# Perceptron Vision MCP Server

[![Install in Cursor](https://img.shields.io/badge/Install_in_Cursor-000?style=for-the-badge&logo=cursor&logoColor=white)](https://cursor.com/en/install-mcp?name=perceptron&config=eyJ0eXBlIjoic3RkaW8iLCJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBwZXJjZXB0cm9uLWFpL21jcC1zZXJ2ZXJAbGF0ZXN0Il0sImVudiI6eyJQRVJDRVBUUk9OX0FQSV9LRVkiOiIifX0=)
&nbsp;
[![Install in VS Code](https://img.shields.io/badge/Install_in_VS_Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white)](https://vscode.dev/redirect/mcp/install?name=perceptron&config=%7B%22type%22%3A%22stdio%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22%40perceptron-ai/mcp-server%40latest%22%5D%2C%22env%22%3A%7B%22PERCEPTRON_API_KEY%22%3A%22%22%7D%7D)
&nbsp;
[![npm](https://img.shields.io/npm/v/%40perceptron-ai%2Fmcp-server?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/@perceptron-ai/mcp-server)

A vision MCP server by [Perceptron](https://perceptron.inc) — high-accuracy vision AI over the [Model Context Protocol](https://modelcontextprotocol.io), powered by fast, efficient vision-language models.

Give any MCP-compatible agent direct access to Perceptron's Isaac model family for visual question answering, captioning, OCR, and object detection.

## Available Tools

| Tool | Description |
|------|-------------|
| `question` | Visual question answering — ask a question about an image and get a structured response |
| `caption` | Image captioning — generate concise or detailed descriptions |
| `ocr` | Text extraction — pull text from images as plain text, markdown, or HTML |
| `detect` | Object detection — locate and classify objects, optionally filtered by class |
| `list_models` | List available Perceptron models and their capabilities |

All tools accept a **URL** (`https://...`), a **local file path** (`/path/to/image.jpg`, `~/photos/image.png`), or a **base64 data URI** (`data:image/jpeg;base64,...`). Local files are automatically uploaded to the Perceptron platform before analysis. Currently supported formats: JPEG, PNG, and WebP.

### Model Selection

The `model` parameter is optional — if omitted, the default Perceptron model is used. Call `list_models` to discover all available models and their capabilities.

## Configuration

### Required

| Variable | Description |
|----------|-------------|
| `PERCEPTRON_API_KEY` | Your Perceptron API key |

Get your API key from the [Perceptron dashboard](https://perceptron.inc).

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PERCEPTRON_BASE_URL` | `https://api.perceptron.inc` | Custom API endpoint |

## Installation

### Claude Code

```bash
claude mcp add perceptron -e PERCEPTRON_API_KEY=your-api-key -- npx -y @perceptron-ai/mcp-server@latest
```

### Claude Desktop

Add to your Claude Desktop configuration file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "perceptron": {
      "command": "npx",
      "args": ["-y", "@perceptron-ai/mcp-server@latest"],
      "env": {
        "PERCEPTRON_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Cursor

Add to your Cursor MCP configuration (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "perceptron": {
      "command": "npx",
      "args": ["-y", "@perceptron-ai/mcp-server@latest"],
      "env": {
        "PERCEPTRON_API_KEY": "your-api-key"
      }
    }
  }
}
```

### VS Code

Add to `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "perceptron": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@perceptron-ai/mcp-server@latest"],
      "env": {
        "PERCEPTRON_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Windsurf

Add to your Windsurf MCP configuration (`~/.codeium/windsurf/mcp_config.json`):

```json
{
  "mcpServers": {
    "perceptron": {
      "command": "npx",
      "args": ["-y", "@perceptron-ai/mcp-server@latest"],
      "env": {
        "PERCEPTRON_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Google Antigravity

Add to your Antigravity MCP configuration (`~/.gemini/antigravity/mcp_config.json`):

```json
{
  "mcpServers": {
    "perceptron": {
      "command": "npx",
      "args": ["-y", "@perceptron-ai/mcp-server@latest"],
      "env": {
        "PERCEPTRON_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Codex

```bash
codex mcp add perceptron --env PERCEPTRON_API_KEY=your-api-key -- npx -y @perceptron-ai/mcp-server@latest
```

### Generic MCP Clients

```bash
PERCEPTRON_API_KEY=your-api-key npx -y @perceptron-ai/mcp-server@latest
```

**Note:** The `@latest` tag ensures you always get the newest models and tools. To pin a specific version, replace `@latest` with a version number from [npm](https://www.npmjs.com/package/@perceptron-ai/mcp-server) (e.g. `@perceptron-ai/mcp-server@0.1.0`).

## How Local Files Work

When you pass a local file path as `image_url`, the server transparently:

1. Reads the file from disk
2. Requests a presigned upload URL from the Perceptron platform
3. Uploads the file
4. Obtains a presigned download URL
5. Passes the download URL to the model for analysis

This means you can analyze images on your machine without manual upload steps.

## Troubleshooting

### "PERCEPTRON_API_KEY environment variable is required"

Set the `PERCEPTRON_API_KEY` environment variable in your MCP client configuration.

### "Unrecognized file extension"

The file extension could not be mapped to a MIME type. Rename the file with a standard extension (e.g. `.jpg`, `.png`, `.webp`).

### Connection errors to the remote server

Verify your API key is valid and that you can reach `https://api.perceptron.inc`. If you need a custom endpoint, set `PERCEPTRON_BASE_URL`.

### File not found errors

Ensure the file path is absolute or starts with `~`. Relative paths are resolved from the server's working directory.

## Development

```bash
# Install dependencies
npm install

# Run in development mode
PERCEPTRON_API_KEY=your-key npm run dev

# Build
npm run build

# Run tests
npm test
```

## License

[Apache License 2.0](LICENSE)

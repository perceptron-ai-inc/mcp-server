# Perceptron AI MCP Server

[Model Context Protocol](https://modelcontextprotocol.io) (MCP) server for the [Perceptron AI](https://perceptron.inc) platform — high-accuracy visual perception powered by fast, efficient vision-language models.

Give any MCP-compatible agent direct access to Perceptron's Isaac model family for visual question answering, captioning, OCR, and object detection.

## Available Tools

| Tool | Description |
|------|-------------|
| `question` | Visual question answering — ask a question about an image and get a structured response |
| `caption` | Image captioning — generate concise or detailed descriptions |
| `ocr` | Text extraction — pull text from images as plain text, markdown, or HTML |
| `detect` | Object detection — locate and classify objects, optionally filtered by class |

All tools accept either a **URL** (`https://...`) or a **local file path** (`/path/to/image.jpg`, `~/photos/image.png`). Local files are automatically uploaded to the Perceptron platform before analysis. Supported formats: JPEG, PNG, WebP.

### Model Discovery

Each tool requires a `model` parameter. Use `list_resources` to discover available Isaac models and their capabilities.

## Configuration

### Required

| Variable | Description |
|----------|-------------|
| `PERCEPTRON_API_KEY` | Your Perceptron AI API key |

Get your API key from the [Perceptron AI dashboard](https://perceptron.inc).

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
      "args": ["-y", "@perceptron-ai/mcp-server"],
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
      "args": ["-y", "@perceptron-ai/mcp-server"],
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
      "args": ["-y", "@perceptron-ai/mcp-server"],
      "env": {
        "PERCEPTRON_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Windsurf

Add to your Windsurf MCP configuration:

```json
{
  "mcpServers": {
    "perceptron": {
      "command": "npx",
      "args": ["-y", "@perceptron-ai/mcp-server"],
      "env": {
        "PERCEPTRON_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Codex

```bash
codex mcp add perceptron -- npx -y @perceptron-ai/mcp-server@latest
```

### Generic MCP Clients

```bash
PERCEPTRON_API_KEY=your-api-key npx -y @perceptron-ai/mcp-server@latest
```

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

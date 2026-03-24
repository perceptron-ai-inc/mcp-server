import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getRemoteClient, resolveImageUrl, extractText, isToolError } from "./api.js";

const generationParams = {
  reasoning: z.boolean().optional().describe("Enable reasoning/chain-of-thought output"),
  temperature: z.number().min(0).optional().describe("Sampling temperature"),
  top_p: z.number().positive().max(1).optional().describe("Nucleus sampling threshold"),
  top_k: z.number().int().positive().optional().describe("Top-k sampling"),
  frequency_penalty: z.number().optional().describe("Frequency penalty"),
  presence_penalty: z.number().optional().describe("Presence penalty"),
  max_tokens: z.number().int().positive().optional().describe("Maximum tokens to generate"),
};

const outputFormatEnum = z.enum(["text", "point", "box", "polygon"]);

/**
 * Resolves the image_url (uploading if local), then calls the named tool on the
 * remote MCP server and returns the result in MCP tool-result format.
 */
async function callWithImage(
  toolName: string,
  params: Record<string, unknown>
): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
  // Resolve local file path → remote URL if needed
  const { image_url, ...rest } = params;
  const resolvedUrl = await resolveImageUrl(image_url as string);

  const client = await getRemoteClient();
  const result = await client.callTool({
    name: toolName,
    arguments: { image_url: resolvedUrl, ...rest },
  });

  return {
    content: [{ type: "text", text: extractText(result) }],
    isError: isToolError(result) || undefined,
  };
}

export function createPerceptronServer(): McpServer {
  const server = new McpServer(
    {
      name: "perceptron-mcp",
      version: "0.1.2",
    },
    {
      instructions: `Perceptron MCP Server — high-accuracy visual perception powered by fast, efficient vision-language models.

When working with tool results, write down any important information you might need later in your response, as the original tool result may be cleared later.

## Discovering models

Call list_models to see available models. The model parameter is optional — if omitted, the default Perceptron model is used.

## Working with images

Tools accept either:
- A URL (https://...) pointing to an image
- A local file path (/path/to/image.jpg, ~/photos/image.png)

Local files are automatically uploaded and made available to the model. Supported formats: JPEG, PNG, WebP.`,
    }
  );

  // --- model resources (proxied from remote server) ---
  server.registerResource(
    "models",
    new ResourceTemplate("perceptron://models/{modelId}", {
      list: async () => {
        const client = await getRemoteClient();
        return await client.listResources();
      },
    }),
    { description: "Available Perceptron AI models", mimeType: "application/json" },
    async (uri) => {
      const client = await getRemoteClient();
      const result = await client.readResource({ uri: uri.href });
      return { contents: result.contents as Array<{ uri: string; text: string; mimeType?: string }> };
    }
  );

  // --- list_models tool (for clients that don't support resources) ---
  server.registerTool(
    "list_models",
    {
      description: "List available Perceptron models and their capabilities.",
      inputSchema: {},
    },
    async () => {
      const client = await getRemoteClient();
      const { resources } = await client.listResources();
      const models = resources.map((r) => ({
        id: r.uri.replace("perceptron://models/", ""),
        name: r.name,
        description: r.description,
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(models, null, 2) }],
      };
    }
  );

  // --- question tool ---
  server.registerTool(
    "question",
    {
      description: "Ask a question about an image. Accepts a URL or local file path.",
      inputSchema: {
        image_url: z.string().describe("Image URL (https://...) or local file path (/path/to/image.jpg)"),
        model: z.string().optional().describe("Model ID (uses the default Perceptron model if omitted)"),
        question: z.string().describe("Question to ask about the image"),
        output_format: outputFormatEnum.optional().describe("Output format: text, point, box, or polygon"),
        ...generationParams,
      },
    },
    async (params) => {
      return callWithImage("question", params);
    }
  );

  // --- caption tool ---
  server.registerTool(
    "caption",
    {
      description: "Generate a caption for an image. Accepts a URL or local file path.",
      inputSchema: {
        image_url: z.string().describe("Image URL (https://...) or local file path (/path/to/image.jpg)"),
        model: z.string().optional().describe("Model ID (uses the default Perceptron model if omitted)"),
        style: z.enum(["concise", "detailed"]).default("concise").describe("Caption style (default: concise)"),
        output_format: outputFormatEnum.optional().describe("Output format: text, point, box, or polygon"),
        ...generationParams,
      },
    },
    async (params) => {
      return callWithImage("caption", params);
    }
  );

  // --- ocr tool ---
  server.registerTool(
    "ocr",
    {
      description: "Extract text from an image using OCR. Accepts a URL or local file path.",
      inputSchema: {
        image_url: z.string().describe("Image URL (https://...) or local file path (/path/to/image.jpg)"),
        model: z.string().optional().describe("Model ID (uses the default Perceptron model if omitted)"),
        mode: z.enum(["plain", "markdown", "html"]).describe("OCR output mode"),
        prompt: z.string().optional().describe("Optional prompt to guide OCR extraction"),
        ...generationParams,
      },
    },
    async (params) => {
      return callWithImage("ocr", params);
    }
  );

  // --- detect tool ---
  server.registerTool(
    "detect",
    {
      description: "Detect objects in an image. Accepts a URL or local file path.",
      inputSchema: {
        image_url: z.string().describe("Image URL (https://...) or local file path (/path/to/image.jpg)"),
        model: z.string().optional().describe("Model ID (uses the default Perceptron model if omitted)"),
        classes: z.array(z.string()).optional().describe("Object classes to detect (omit for open-vocabulary detection)"),
        ...generationParams,
      },
    },
    async (params) => {
      return callWithImage("detect", params);
    }
  );

  return server;
}

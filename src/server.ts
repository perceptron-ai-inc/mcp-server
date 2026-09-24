import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getRemoteClient, resolveMediaUrl, extractText, isToolError } from "./api.js";

const reasoningEffortEnum = z.enum(["none", "minimal", "low", "medium", "high"]);

const generationParams = {
  reasoning: z.boolean().optional().describe("Deprecated: use reasoning_effort"),
  reasoning_effort: reasoningEffortEnum
    .optional()
    .describe("How much the model reasons before answering; any value other than none turns reasoning on"),
  temperature: z.number().min(0).optional().describe("Sampling temperature"),
  top_p: z.number().positive().max(1).optional().describe("Nucleus sampling threshold"),
  top_k: z.number().int().positive().optional().describe("Top-k sampling"),
  frequency_penalty: z.number().optional().describe("Frequency penalty"),
  presence_penalty: z.number().optional().describe("Presence penalty"),
  max_tokens: z.number().int().positive().optional().describe("Maximum tokens to generate"),
};

const outputFormatEnum = z.enum(["point", "box", "polygon", "clip"]);
const modalityEnum = z.enum(["image", "video", "audio"]);
const detectModalityEnum = z.enum(["image", "video"]);

const mediaParams = {
  media_url: z.string().describe("Media URL (https://...) or local file path for an image, video, or audio clip"),
  modality: modalityEnum.describe("Media modality: image, video, or audio"),
};

const detectMediaParams = {
  media_url: z.string().describe("Media URL (https://...) or local file path for an image or video"),
  modality: detectModalityEnum.describe("Media modality: image or video"),
};

const audioInVideoParams = {
  enable_audio_in_video: z
    .boolean()
    .optional()
    .describe("Also process the video's soundtrack. Only valid with modality video"),
};

/** Forward a tool call to the remote server and shape it into MCP tool-result format. */
async function callRemote(
  toolName: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
  const client = await getRemoteClient();
  const result = await client.callTool({ name: toolName, arguments: args });
  return {
    content: [{ type: "text", text: extractText(result) }],
    isError: isToolError(result) || undefined,
  };
}

export function createPerceptronServer(): McpServer {
  const server = new McpServer(
    {
      name: "perceptron-mcp",
      version: "0.3.0",
    },
    {
      instructions: `Perceptron MCP Server — high-accuracy visual perception powered by fast, efficient vision-language models.

When working with tool results, write down any important information you might need later in your response, as the original tool result may be cleared later.

## Discovering models

Call list_models to see available models. The model parameter is optional — if omitted, the default Perceptron model is used.

## Reasoning

Set \`reasoning_effort\` ("none", "minimal", "low", "medium", or "high") to control how much the model reasons before answering; any value other than "none" turns reasoning on. The boolean \`reasoning\` parameter is deprecated in favor of \`reasoning_effort\`.

## Working with images, videos, and audio

The question and caption tools accept image, video, or audio inputs and require an explicit \`modality\` ("image", "video", or "audio"). The detect tool accepts image or video. The ocr tool is image-only.

Video soundtracks are ignored unless \`enable_audio_in_video\` is true alongside \`modality: "video"\` on question or caption. Audio files are analyzed regardless of that flag.

Inputs may be:
- A URL (https://...) pointing to media
- A local file path (/path/to/clip.mp4, ~/photos/image.png, ~/recordings/call.wav)
- A base64 data URI (data:image/jpeg;base64,...)

Local files are automatically uploaded and made available to the model. Supported formats: JPEG, PNG, WebP, MP4, WebM, WAV, MP3, FLAC.`,
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
      annotations: { readOnlyHint: true },
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
      description:
        "Ask a question about an image, video, or audio clip. Accepts a URL or local file path. Set enable_audio_in_video to also process a video's soundtrack.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        ...mediaParams,
        ...audioInVideoParams,
        model: z.string().optional().describe("Model ID (uses the default Perceptron model if omitted)"),
        question: z.string().describe("Question to ask about the media"),
        output_format: outputFormatEnum.optional().describe("Output format: point, box, polygon, or clip"),
        ...generationParams,
      },
    },
    async ({ media_url, ...rest }) => {
      return callRemote("question", { media_url: await resolveMediaUrl(media_url), ...rest });
    }
  );

  // --- caption tool ---
  server.registerTool(
    "caption",
    {
      description:
        "Generate a caption for an image, video, or audio clip. Accepts a URL or local file path. Set enable_audio_in_video to also process a video's soundtrack.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        ...mediaParams,
        ...audioInVideoParams,
        model: z.string().optional().describe("Model ID (uses the default Perceptron model if omitted)"),
        style: z.enum(["concise", "detailed"]).default("concise").describe("Caption style (default: concise)"),
        output_format: outputFormatEnum.optional().describe("Output format: point, box, polygon, or clip"),
        ...generationParams,
      },
    },
    async ({ media_url, ...rest }) => {
      return callRemote("caption", { media_url: await resolveMediaUrl(media_url), ...rest });
    }
  );

  // --- ocr tool ---
  server.registerTool(
    "ocr",
    {
      description: "Extract text from an image using OCR. Accepts a URL or local file path.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        image_url: z.string().describe("Image URL (https://...) or local file path (/path/to/image.jpg)"),
        model: z.string().optional().describe("Model ID (uses the default Perceptron model if omitted)"),
        mode: z.enum(["plain", "markdown", "html"]).describe("OCR output mode"),
        prompt: z.string().optional().describe("Optional prompt to guide OCR extraction"),
        ...generationParams,
      },
    },
    async ({ image_url, ...rest }) => {
      return callRemote("ocr", { image_url: await resolveMediaUrl(image_url), ...rest });
    }
  );

  // --- detect tool ---
  server.registerTool(
    "detect",
    {
      description: "Detect objects in an image or video. Accepts a URL or local file path.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        ...detectMediaParams,
        model: z.string().optional().describe("Model ID (uses the default Perceptron model if omitted)"),
        classes: z.array(z.string()).optional().describe("Object classes to detect (omit for open-vocabulary detection)"),
        ...generationParams,
      },
    },
    async ({ media_url, ...rest }) => {
      return callRemote("detect", { media_url: await resolveMediaUrl(media_url), ...rest });
    }
  );

  return server;
}

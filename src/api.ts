import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import mime from "mime";
import { readFile, stat } from "node:fs/promises";
import { extname } from "node:path";
import type {
  GenerateUploadUrlsResponse,
  GenerateDownloadUrlsResponse,
} from "./types.js";

let remoteClient: Client | null = null;
let remoteTransport: StreamableHTTPClientTransport | null = null;

/**
 * Returns a connected MCP client to the remote Perceptron server.
 * Reuses the connection across calls.
 */
export async function getRemoteClient(): Promise<Client> {
  if (remoteClient) return remoteClient;

  const apiKey = process.env.PERCEPTRON_API_KEY;
  if (!apiKey) {
    throw new Error("PERCEPTRON_API_KEY environment variable is required");
  }

  const baseUrl = process.env.PERCEPTRON_BASE_URL || "https://api.perceptron.inc";
  const mcpUrl = new URL("/mcp", baseUrl);

  remoteTransport = new StreamableHTTPClientTransport(mcpUrl, {
    requestInit: {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    },
  });

  remoteClient = new Client(
    { name: "perceptron-mcp-local", version: "0.1.0" },
    {}
  );

  await remoteClient.connect(remoteTransport);

  // Self-heal on connection loss (laptop sleep, Wi-Fi drop, etc.)
  remoteTransport.onclose = () => {
    console.error("[INFO] Remote MCP connection closed. Resetting client.");
    remoteClient = null;
    remoteTransport = null;
  };

  return remoteClient;
}

/**
 * Closes the remote MCP client connection.
 */
export async function closeRemoteClient(): Promise<void> {
  if (remoteTransport) {
    await remoteTransport.close();
    remoteTransport = null;
    remoteClient = null;
  }
}

/** Extract text strings from a callTool result (handles both current and compat formats). */
export function extractText(result: Awaited<ReturnType<Client["callTool"]>>): string {
  if ("content" in result && Array.isArray(result.content)) {
    return result.content
      .filter((c: { type: string }) => c.type === "text")
      .map((c: { type: string; text?: string }) => (c as { text: string }).text)
      .join("");
  }
  // Compat format: { toolResult: unknown }
  return typeof result.toolResult === "string"
    ? result.toolResult
    : JSON.stringify(result.toolResult);
}

/** Check if a callTool result indicates an error. */
export function isToolError(result: Awaited<ReturnType<Client["callTool"]>>): boolean {
  return "isError" in result && result.isError === true;
}

/**
 * Determines if a string is a local file path (vs a URL or data URI).
 */
export function isLocalPath(imageUrl: string): boolean {
  if (imageUrl.startsWith("data:")) return false;
  if (/^https?:\/\//.test(imageUrl)) return false;
  return true;
}

/**
 * Resolves an image_url to a remote URL. If it's a local file path, uploads it
 * via the remote MCP server's presigned URL tools, then returns the download URL.
 * If it's already a URL, returns as-is.
 */
export async function resolveImageUrl(imageUrl: string): Promise<string> {
  if (!isLocalPath(imageUrl)) {
    return imageUrl;
  }

  const client = await getRemoteClient();

  // Resolve ~ to home directory
  const filePath = imageUrl.startsWith("~")
    ? imageUrl.replace("~", process.env.HOME || "")
    : imageUrl;

  // Read file and determine content type
  const ext = extname(filePath).toLowerCase();
  const contentType = mime.getType(ext);
  if (!contentType) {
    throw new Error(`Unrecognized file extension "${ext}"`);
  }

  const fileBuffer = await readFile(filePath);
  const fileStat = await stat(filePath);
  const fileName = `upload${ext}`;

  // Step 1: Get presigned upload URL from remote MCP server
  const uploadResult = await client.callTool({
    name: "generate_upload_urls",
    arguments: {
      files: [
        {
          file_name: fileName,
          content_type: contentType,
          content_length: fileStat.size,
        },
      ],
    },
  });

  if (isToolError(uploadResult)) {
    throw new Error(`Failed to get upload URL: ${extractText(uploadResult)}`);
  }

  const uploadResponse: GenerateUploadUrlsResponse = JSON.parse(extractText(uploadResult));

  if (!uploadResponse.urls?.length) {
    throw new Error("No upload URLs returned from remote server");
  }

  const { upload_url, object_key } = uploadResponse.urls[0];

  // Step 2: PUT the file to the presigned URL
  const putResponse = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: fileBuffer,
  });

  if (!putResponse.ok) {
    const text = await putResponse.text().catch(() => "");
    throw new Error(`File upload failed with ${putResponse.status}: ${text}`);
  }

  // Step 3: Get presigned download URL from remote MCP server
  const downloadResult = await client.callTool({
    name: "generate_download_urls",
    arguments: { object_keys: [object_key] },
  });

  if (isToolError(downloadResult)) {
    throw new Error(`Failed to get download URL: ${extractText(downloadResult)}`);
  }

  const downloadResponse: GenerateDownloadUrlsResponse = JSON.parse(extractText(downloadResult));

  if (!downloadResponse.urls?.length) {
    throw new Error("No download URLs returned from remote server");
  }

  return downloadResponse.urls[0].download_url;
}

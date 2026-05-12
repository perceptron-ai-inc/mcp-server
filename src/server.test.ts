import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

const remoteCallTool = vi.fn();

vi.mock("./api.js", () => ({
  getRemoteClient: vi.fn(async () => ({
    callTool: remoteCallTool,
    listResources: vi.fn(async () => ({ resources: [] })),
    readResource: vi.fn(),
  })),
  resolveMediaUrl: vi.fn(async (url: string) => url),
  extractText: vi.fn(() => "ok"),
  isToolError: vi.fn(() => false),
  closeRemoteClient: vi.fn(),
}));

const { createPerceptronServer } = await import("./server.js");

describe("createPerceptronServer", () => {
  it("creates a server instance", () => {
    const server = createPerceptronServer();
    expect(server).toBeDefined();
  });
});

describe("clip tool", () => {
  let client: Client;

  beforeEach(async () => {
    remoteCallTool.mockReset().mockResolvedValue({ content: [{ type: "text", text: "ok" }] });
    const server = createPerceptronServer();
    const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: "test", version: "0.0.0" });
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await client.close();
  });

  it("is registered and discoverable via list_tools", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toContain("clip");
  });

  it("forwards to remote 'question' (not 'clip') with modality=video, output_format=clip, reasoning=true", async () => {
    await client.callTool({
      name: "clip",
      arguments: {
        video_url: "https://example.com/game.mp4",
        prompt: "Clip the goal",
      },
    });

    expect(remoteCallTool).toHaveBeenCalledTimes(1);
    expect(remoteCallTool).toHaveBeenCalledWith({
      name: "question",
      arguments: expect.objectContaining({
        media_url: "https://example.com/game.mp4",
        modality: "video",
        question: "Clip the goal",
        output_format: "clip",
        reasoning: true,
      }),
    });
  });

  it("forwards optional model parameter when provided", async () => {
    await client.callTool({
      name: "clip",
      arguments: {
        video_url: "https://example.com/game.mp4",
        prompt: "Clip the goal",
        model: "perceptron-mk1",
      },
    });

    expect(remoteCallTool).toHaveBeenCalledWith({
      name: "question",
      arguments: expect.objectContaining({ model: "perceptron-mk1" }),
    });
  });
});

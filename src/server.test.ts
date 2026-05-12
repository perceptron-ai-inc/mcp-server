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

interface ToolExpectation {
  name: string;
  /** Fields that callers must always be able to set on this tool. */
  expectedInputFields: string[];
}

const TOOL_EXPECTATIONS: ToolExpectation[] = [
  { name: "list_models", expectedInputFields: [] },
  {
    name: "question",
    expectedInputFields: ["media_url", "modality", "question", "model", "output_format", "reasoning"],
  },
  {
    name: "caption",
    expectedInputFields: ["media_url", "modality", "style", "model", "output_format", "reasoning"],
  },
  {
    name: "ocr",
    expectedInputFields: ["image_url", "mode", "prompt", "model", "reasoning"],
  },
  {
    name: "detect",
    expectedInputFields: ["media_url", "modality", "classes", "model", "reasoning"],
  },
  {
    name: "clip",
    expectedInputFields: ["video_url", "prompt", "model"],
  },
];

describe("tool registry surface", () => {
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

  it("registers exactly the expected set of tools", async () => {
    const { tools } = await client.listTools();
    const got = tools.map((t) => t.name).sort();
    const want = TOOL_EXPECTATIONS.map((t) => t.name).sort();
    expect(got).toEqual(want);
  });

  describe.each(TOOL_EXPECTATIONS)("$name tool", ({ name, expectedInputFields }) => {
    it("has a non-empty description", async () => {
      const { tools } = await client.listTools();
      const tool = tools.find((t) => t.name === name);
      expect(tool, `tool '${name}' should be registered`).toBeDefined();
      expect(tool!.description, `tool '${name}' should have a description`).toBeTruthy();
      expect(tool!.description!.length).toBeGreaterThan(20);
    });

    if (expectedInputFields.length > 0) {
      it("exposes the expected input schema fields", async () => {
        const { tools } = await client.listTools();
        const tool = tools.find((t) => t.name === name)!;
        const schema = tool.inputSchema as { properties?: Record<string, unknown> };
        const properties = Object.keys(schema.properties ?? {});
        for (const field of expectedInputFields) {
          expect(properties, `tool '${name}' should expose '${field}' in its input schema`).toContain(field);
        }
      });
    }
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

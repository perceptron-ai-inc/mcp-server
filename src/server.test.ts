import { describe, it, expect } from "vitest";
import { createPerceptronServer } from "./server.js";

describe("createPerceptronServer", () => {
  it("creates a server instance", () => {
    const server = createPerceptronServer();
    expect(server).toBeDefined();
  });
});

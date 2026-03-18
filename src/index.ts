#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createPerceptronServer } from "./server.js";
import { closeRemoteClient } from "./api.js";

const PERCEPTRON_API_KEY = process.env.PERCEPTRON_API_KEY;
if (!PERCEPTRON_API_KEY) {
  console.error("Error: PERCEPTRON_API_KEY environment variable is required");
  process.exit(1);
}

async function main() {
  const server = createPerceptronServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.on("SIGINT", async () => {
    await closeRemoteClient();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});

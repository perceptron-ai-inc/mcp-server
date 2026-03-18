import { describe, it, expect } from "vitest";
import { isLocalPath, extractText, isToolError } from "./api.js";

describe("isLocalPath", () => {
  it("returns false for https URLs", () => {
    expect(isLocalPath("https://example.com/image.jpg")).toBe(false);
  });

  it("returns false for http URLs", () => {
    expect(isLocalPath("http://example.com/image.jpg")).toBe(false);
  });

  it("returns false for data URIs", () => {
    expect(isLocalPath("data:image/png;base64,iVBOR...")).toBe(false);
  });

  it("returns true for absolute paths", () => {
    expect(isLocalPath("/Users/me/photo.jpg")).toBe(true);
  });

  it("returns true for home-relative paths", () => {
    expect(isLocalPath("~/photos/image.png")).toBe(true);
  });

  it("returns true for relative paths", () => {
    expect(isLocalPath("images/test.webp")).toBe(true);
  });
});

describe("extractText", () => {
  it("extracts text from content array", () => {
    const result = {
      content: [{ type: "text" as const, text: "hello world" }],
    };
    expect(extractText(result)).toBe("hello world");
  });

  it("concatenates multiple text items", () => {
    const result = {
      content: [
        { type: "text" as const, text: "hello " },
        { type: "text" as const, text: "world" },
      ],
    };
    expect(extractText(result)).toBe("hello world");
  });

  it("skips non-text content", () => {
    const result = {
      content: [
        { type: "text" as const, text: "hello" },
        { type: "image" as const, data: "...", mimeType: "image/png" },
      ],
    };
    expect(extractText(result)).toBe("hello");
  });

  it("handles compat format with string toolResult", () => {
    const result = { toolResult: "some result" } as unknown as Parameters<typeof extractText>[0];
    expect(extractText(result)).toBe("some result");
  });

  it("handles compat format with object toolResult", () => {
    const result = { toolResult: { key: "value" } } as unknown as Parameters<typeof extractText>[0];
    expect(extractText(result)).toBe('{"key":"value"}');
  });
});

describe("isToolError", () => {
  it("returns true when isError is true", () => {
    const result = { content: [], isError: true };
    expect(isToolError(result)).toBe(true);
  });

  it("returns false when isError is false", () => {
    const result = { content: [], isError: false };
    expect(isToolError(result)).toBe(false);
  });

  it("returns false when isError is absent", () => {
    const result = { content: [] };
    expect(isToolError(result)).toBe(false);
  });
});

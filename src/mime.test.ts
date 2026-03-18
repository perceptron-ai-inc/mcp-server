import { describe, it, expect } from "vitest";
import mime from "mime";

describe("mime.getType", () => {
  it("resolves common image extensions", () => {
    expect(mime.getType("jpg")).toBe("image/jpeg");
    expect(mime.getType("jpeg")).toBe("image/jpeg");
    expect(mime.getType("png")).toBe("image/png");
    expect(mime.getType("webp")).toBe("image/webp");
  });

  it("resolves extensions with a leading dot", () => {
    expect(mime.getType(".jpg")).toBe("image/jpeg");
    expect(mime.getType(".png")).toBe("image/png");
  });

  it("resolves additional image formats", () => {
    expect(mime.getType("tiff")).toBe("image/tiff");
    expect(mime.getType("heic")).toBe("image/heic");
    expect(mime.getType("gif")).toBe("image/gif");
    expect(mime.getType("bmp")).toBe("image/bmp");
  });

  it("returns null for unknown extensions", () => {
    expect(mime.getType("xyz123")).toBeNull();
    expect(mime.getType("")).toBeNull();
  });
});

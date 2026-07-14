import { describe, it, expect } from "vitest";
import { fetchSignalMarkdown } from "../src/services/github";

describe("GitHub Service Test", () => {
  it("should fail when token is invalid or file missing", async () => {
    await expect(fetchSignalMarkdown("ko", "alpha", "20260714")).rejects.toThrow();
  });
});

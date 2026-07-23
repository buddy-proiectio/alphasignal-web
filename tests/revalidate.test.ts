import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "../app/api/revalidate/route";
import { NextRequest } from "next/server";
import crypto from "crypto";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

import { revalidateTag } from "next/cache";

describe("Revalidate Webhook Route Handler", () => {
  const secret = "test_webhook_secret_key";

  beforeEach(() => {
    process.env.GITHUB_WEBHOOK_SECRET = secret;
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.GITHUB_WEBHOOK_SECRET;
  });

  it("should return 401 when signature header is missing", async () => {
    const req = new NextRequest("http://localhost/api/revalidate", {
      method: "POST",
      body: JSON.stringify({ ref: "refs/heads/main" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Invalid signature");
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("should return 401 when signature is invalid", async () => {
    const req = new NextRequest("http://localhost/api/revalidate", {
      method: "POST",
      body: JSON.stringify({ ref: "refs/heads/main" }),
      headers: {
        "x-hub-signature-256": "sha256=invalid_signature",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Invalid signature");
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("should return 200 and revalidate when signature is correct", async () => {
    const payload = JSON.stringify({ ref: "refs/heads/main" });
    const hmac = crypto.createHmac("sha256", secret);
    const digest = "sha256=" + hmac.update(payload).digest("hex");

    const req = new NextRequest("http://localhost/api/revalidate", {
      method: "POST",
      body: payload,
      headers: {
        "x-hub-signature-256": digest,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.revalidated).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith("signal", "default");
  });

  it("should return 500 when secret is not configured", async () => {
    delete process.env.GITHUB_WEBHOOK_SECRET;
    const req = new NextRequest("http://localhost/api/revalidate", {
      method: "POST",
      body: "payload",
      headers: {
        "x-hub-signature-256": "sha256=some_sig",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Webhook secret is not configured");
  });
});

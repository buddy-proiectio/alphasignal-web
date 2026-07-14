import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("x-hub-signature-256") || "";
    const secret = process.env.GITHUB_WEBHOOK_SECRET || "";

    if (!secret) {
      return NextResponse.json(
        { error: "Webhook secret is not configured" },
        { status: 500 },
      );
    }

    const hmac = crypto.createHmac("sha256", secret);
    const digest = "sha256=" + hmac.update(payload).digest("hex");

    const signatureBuffer = Buffer.from(signature, "utf8");
    const digestBuffer = Buffer.from(digest, "utf8");

    if (signatureBuffer.length !== digestBuffer.length) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (!crypto.timingSafeEqual(signatureBuffer, digestBuffer)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Purge caches
    revalidateTag("signal", "default");
    return NextResponse.json({ revalidated: true });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

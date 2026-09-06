import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isRateLimited, getClientIp } from "@/lib/auth/rateLimit";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (isRateLimited(`forgot-password:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  // Always respond the same way whether or not the account exists, so this
  // endpoint can't be used to discover which emails are registered.
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });

    // TODO(integration): wire a transactional email provider and send this
    // link instead of logging it — same pattern as the signup verification
    // link until email infra exists.
    console.info(`[forgot-password] Reset link for ${user.email}: ${process.env.APP_URL}/reset-password?token=${rawToken}`);
  }

  return NextResponse.json({ message: "If that email is registered, a reset link has been sent." });
}

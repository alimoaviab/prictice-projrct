import { NextRequest, NextResponse } from "next/server";
import { DomainManagerService } from "../../../../../shared/services/domain/domain-manager.service";
import { authenticateRequest } from "@edu/shared/auth/middleware";

function parseCookies(cookieHeader: string | null) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split("; ").map((entry) => {
      const i = entry.indexOf("=");
      return i >= 0 ? [entry.slice(0, i), entry.slice(i + 1)] : [entry, ""];
    })
  );
}

export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Domain provisioning mutates platform infrastructure
    // (Cloudflare DNS + ACME). Restrict to authenticated school admins.
    const ctx = authenticateRequest(
      {
        cookies: parseCookies(request.headers.get("cookie")),
        headers: Object.fromEntries(request.headers.entries())
      },
      "school"
    );

    if (ctx.role !== "admin" && ctx.role !== "super_admin") {
      return NextResponse.json(
        { success: false, message: "Admin role required to configure domains." },
        { status: 403 }
      );
    }

    console.log('\n🔵 Domain Setup API called', { school_id: ctx.school_id, actor: ctx.actor_email });
    const body = await request.json();
    console.log('📦 Request body:', body);
    const { domain, serverIP, email } = body;

    // Validate inputs
    if (!domain || !serverIP || !email) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: domain, serverIP, and email are required",
        },
        { status: 400 }
      );
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid domain format. Please enter a valid domain (e.g., example.com)",
        },
        { status: 400 }
      );
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(serverIP)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid IP address format. Please enter a valid IPv4 address",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email format",
        },
        { status: 400 }
      );
    }

    // Check environment variables
    const cloudflareToken = process.env.CLOUDFLARE_API_TOKEN;
    const sslStaging = process.env.SSL_STAGING === "true";

    if (!cloudflareToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Cloudflare API token not configured. Please contact administrator.",
        },
        { status: 500 }
      );
    }

    console.log(`\n🌐 Domain Setup Request:`);
    console.log(`   Domain: ${domain}`);
    console.log(`   Server IP: ${serverIP}`);
    console.log(`   Email: ${email}`);
    console.log(`   SSL Mode: ${sslStaging ? "Staging" : "Production"}\n`);

    // Initialize Domain Manager
    const manager = new DomainManagerService(
      cloudflareToken,
      email,
      sslStaging
    );

    const initialized = await manager.initialize();
    if (!initialized) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to initialize domain manager. Please check Cloudflare API token.",
        },
        { status: 500 }
      );
    }

    // Setup domain
    const success = await manager.setupDomain({
      domain,
      serverIP,
      email,
    });

    if (success) {
      // Check final status
      const status = await manager.checkDomainStatus(domain);

      return NextResponse.json({
        success: true,
        message: `Domain ${domain} has been successfully configured!`,
        details: {
          domain,
          dnsConfigured: status.dnsConfigured,
          sslConfigured: status.sslConfigured,
          sslExpiresAt: status.sslExpiresAt,
          warnings: status.warnings,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Domain setup failed. Please check the logs for details.",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Domain setup error:", error);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    return NextResponse.json(
      {
        success: false,
        message: error.message || "An unexpected error occurred",
        details: {
          error: error.toString(),
          stack: error.stack,
        },
      },
      { status: 500 }
    );
  }
}

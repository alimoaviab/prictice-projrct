import { NextRequest, NextResponse } from "next/server";
import { DomainManagerService } from "../../../../../shared/services/domain/domain-manager.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json(
        {
          success: false,
          message: "Domain parameter is required",
        },
        { status: 400 }
      );
    }

    const cloudflareToken = process.env.CLOUDFLARE_API_TOKEN;
    const sslEmail = process.env.SSL_EMAIL || "admin@example.com";
    const sslStaging = process.env.SSL_STAGING === "true";

    if (!cloudflareToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Cloudflare API token not configured",
        },
        { status: 500 }
      );
    }

    const manager = new DomainManagerService(
      cloudflareToken,
      sslEmail,
      sslStaging
    );

    const initialized = await manager.initialize();
    if (!initialized) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to initialize domain manager",
        },
        { status: 500 }
      );
    }

    const status = await manager.checkDomainStatus(domain);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error("❌ Domain status check error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to check domain status",
      },
      { status: 500 }
    );
  }
}

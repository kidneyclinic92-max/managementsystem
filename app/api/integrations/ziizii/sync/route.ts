import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromToken } from "@/lib/auth";

// POST /api/integrations/ziizii/sync - Manually sync orders from ZiiZii
// This endpoint would poll ZiiZii API for new orders
export async function POST(request: Request) {
  try {
    // Authentication
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    // TODO: Implement ZiiZii API polling
    // This requires:
    // 1. ZiiZii API credentials (username, password, API key)
    // 2. ZiiZii API endpoint for fetching orders
    // 3. API client to make requests
    
    const ziiziiApiUrl = process.env.ZIIZII_API_URL || "https://gsc.ziizii.io/api";
    const ziiziiUsername = process.env.ZIIZII_USERNAME;
    const ziiziiPassword = process.env.ZIIZII_PASSWORD;
    const ziiziiApiKey = process.env.ZIIZII_API_KEY;

    if (!ziiziiApiUrl || !ziiziiApiKey) {
      return NextResponse.json({
        error: "ZiiZii API not configured",
        message: "Please configure ZIIZII_API_URL and ZIIZII_API_KEY in .env.local"
      }, { status: 500 });
    }

    // Fetch orders from ZiiZii API
    // NOTE: This is a placeholder - you'll need to adjust based on actual ZiiZii API
    try {
      const response = await fetch(`${ziiziiApiUrl}/orders`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${ziiziiApiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`ZiiZii API error: ${response.statusText}`);
      }

      const ziiziiOrders = await response.json();
      
      // Process each order
      const results = [];
      for (const ziiziiOrder of ziiziiOrders.orders || ziiziiOrders || []) {
        try {
          // Forward to webhook endpoint for processing
          const webhookResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/ziizii/webhook`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.ZIIZII_API_KEY || "",
              },
              body: JSON.stringify(ziiziiOrder),
            }
          );

          if (webhookResponse.ok) {
            results.push({ order: ziiziiOrder.order_number, status: "success" });
          } else {
            results.push({ order: ziiziiOrder.order_number, status: "failed" });
          }
        } catch (err) {
          results.push({ order: ziiziiOrder.order_number, status: "error", error: err });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Synced ${results.length} orders from ZiiZii`,
        results: results
      });
    } catch (apiError: any) {
      return NextResponse.json({
        error: "Failed to fetch from ZiiZii API",
        message: apiError.message,
        hint: "Please verify ZiiZii API credentials and endpoint in .env.local"
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}



















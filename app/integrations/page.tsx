"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, XCircle, Loader2, Settings, Webhook } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";

export default function IntegrationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    results?: any[];
  } | null>(null);

  const handleSync = async () => {
    if (!isAdmin) return;
    
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch("/api/integrations/ziizii/sync", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Sync failed");
      }

      setSyncResult({
        success: true,
        message: data.message,
        results: data.results,
      });
    } catch (error: any) {
      setSyncResult({
        success: false,
        message: error.message || "Failed to sync orders",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">
          Only administrators can manage integrations.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Manage external system integrations
        </p>
      </div>

      {/* ZiiZii Integration Card */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Webhook className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">ZiiZii Grocery Supply</h2>
              <p className="text-sm text-muted-foreground">
                Sync vendor orders from ZiiZii platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Integration Info */}
          <div className="bg-muted/50 rounded-md p-4">
            <h3 className="text-sm font-semibold mb-2">Integration Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Webhook URL:</span>
                <code className="text-xs bg-background px-2 py-1 rounded">
                  {typeof window !== "undefined" 
                    ? `${window.location.origin}/api/integrations/ziizii/webhook`
                    : "/api/integrations/ziizii/webhook"}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Integration Type:</span>
                <span>Webhook / API Sync</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Sync:</span>
                <span>Never</span>
              </div>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Setup Instructions</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Contact ZiiZii support to enable webhook integration</li>
              <li>Configure webhook URL in ZiiZii settings</li>
              <li>Add API key to .env.local: <code className="bg-blue-100 px-1 rounded">ZIIZII_API_KEY</code></li>
              <li>Test webhook with a sample order</li>
            </ol>
          </div>

          {/* Manual Sync */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Sync Orders Now
                </>
              )}
            </button>
            <a
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-muted transition-colors"
            >
              <Settings size={16} />
              Configure
            </a>
          </div>

          {/* Sync Result */}
          {syncResult && (
            <div
              className={`rounded-md p-4 ${
                syncResult.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {syncResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <p
                    className={`font-semibold ${
                      syncResult.success ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {syncResult.success ? "Sync Successful" : "Sync Failed"}
                  </p>
                  <p
                    className={`text-sm ${
                      syncResult.success ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {syncResult.message}
                  </p>
                  {syncResult.results && (
                    <div className="mt-2 text-xs text-green-600">
                      {syncResult.results.filter((r) => r.status === "success").length} orders
                      synced successfully
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Documentation */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Integration Documentation</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Webhook Integration:</strong> ZiiZii will send
            order data to our webhook endpoint when vendors place orders. Orders will automatically
            appear in your system as purchase orders requiring approval.
          </p>
          <p>
            <strong className="text-foreground">Manual Sync:</strong> Use the "Sync Orders Now"
            button to manually fetch and import orders from ZiiZii API.
          </p>
          <p>
            <strong className="text-foreground">Order Status:</strong> All orders from ZiiZii are
            created as purchase orders with "pending_approval" status. Admins must approve them
            before inventory is updated.
          </p>
        </div>
      </div>
    </div>
  );
}



















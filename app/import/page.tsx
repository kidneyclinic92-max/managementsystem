"use client";

import { useState } from "react";
import { Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";

export default function ImportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [jsonData, setJsonData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    imported?: any[];
    errors?: any[];
  } | null>(null);

  const isAdmin = user?.role === "admin";

  const handleImport = async () => {
    if (!jsonData.trim()) {
      alert("Please paste your JSON data");
      return;
    }

    setIsImporting(true);
    setResult(null);

    try {
      // Parse JSON to validate
      const parsed = JSON.parse(jsonData);
      
      // Handle different JSON formats
      let inventoryData;
      if (parsed.inventory && Array.isArray(parsed.inventory)) {
        inventoryData = parsed.inventory;
      } else if (Array.isArray(parsed)) {
        inventoryData = parsed;
      } else {
        throw new Error("Invalid JSON format. Expected { inventory: [...] } or [...]");
      }

      // Send to API
      const res = await fetch("/api/import-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ inventory: inventoryData }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Import failed");
      }

      setResult({
        success: true,
        message: data.message || "Import successful",
        imported: data.imported,
        errors: data.errors,
      });

      // Clear the form
      setJsonData("");

      // Redirect to inventory page after 2 seconds
      setTimeout(() => {
        router.push("/inventory");
      }, 2000);
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Import failed",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleLoadExample = () => {
    const example = {
      inventory: [
        {
          name: "Laptop Computer",
          sku: "LAP-001",
          barcode: "1234567890123",
          category: "Electronics",
          quantity: 25,
          price: 999.99,
          cost: 750,
          supplier: "TechCorp Inc.",
          location: "Warehouse A - Shelf 1",
          description: "High-performance laptop for business use",
          minStock: 10,
          maxStock: 100,
          ageRestricted: false,
          requiresId: false,
        },
      ],
    };
    setJsonData(JSON.stringify(example, null, 2));
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">
          Only administrators can import data.
        </p>
        <button
          onClick={() => router.push("/inventory")}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go to Inventory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Inventory Data</h1>
        <p className="text-muted-foreground">
          Import your inventory items from JSON format into the database
        </p>
      </div>

      {/* Instructions */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Make sure database tables are created (check <code className="bg-muted px-1 rounded">/api/check-tables</code>)</li>
          <li>Paste your JSON data in the format: <code className="bg-muted px-1 rounded">{"{ inventory: [...] }"}</code></li>
          <li>Click "Import Data" to import all items</li>
          <li>Items with existing SKUs will be updated, new SKUs will be created</li>
        </ol>
      </div>

      {/* JSON Input */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">JSON Data</h2>
          <button
            onClick={handleLoadExample}
            className="text-sm text-primary hover:underline"
          >
            Load Example
          </button>
        </div>
        <textarea
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          placeholder='Paste your JSON data here, e.g.:\n{\n  "inventory": [\n    {\n      "name": "Item Name",\n      "sku": "SKU-001",\n      "category": "Category",\n      "quantity": 10,\n      "price": 99.99,\n      "cost": 50\n    }\n  ]\n}'
          className="w-full h-64 px-3 py-2 rounded-md border border-input bg-background text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* Import Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleImport}
          disabled={isImporting || !jsonData.trim()}
          className="flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isImporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload size={16} />
              Import Data
            </>
          )}
        </button>
        <button
          onClick={() => router.push("/inventory")}
          className="px-4 py-2 rounded-md border border-input bg-background hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg border p-6 shadow-sm ${
            result.success
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h3
                className={`font-semibold mb-2 ${
                  result.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {result.success ? "Import Successful!" : "Import Failed"}
              </h3>
              <p
                className={`text-sm mb-3 ${
                  result.success ? "text-green-700" : "text-red-700"
                }`}
              >
                {result.message}
              </p>
              {result.imported && result.imported.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-green-800 mb-2">
                    Imported Items ({result.imported.length}):
                  </p>
                  <div className="max-h-40 overflow-y-auto">
                    <ul className="list-disc list-inside text-xs text-green-700 space-y-1">
                      {result.imported.map((item, idx) => (
                        <li key={idx}>
                          {item.sku} ({item.action})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    Errors ({result.errors.length}):
                  </p>
                  <div className="max-h-40 overflow-y-auto">
                    <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                      {result.errors.map((error, idx) => (
                        <li key={idx}>
                          {error.sku}: {error.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {result.success && (
                <p className="text-xs text-green-600 mt-3">
                  Redirecting to inventory page...
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { Truck, Search, Package } from "lucide-react";

interface Shipment {
  id: string;
  orderNumber: string;
  supplier?: string;
  status: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders?type=purchase");
      const data = await res.json();
      const orders: any[] = data.orders || [];
      setShipments(
        orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          supplier: o.supplier,
          status: o.status,
          shippingCarrier: o.shippingCarrier,
          trackingNumber: o.trackingNumber,
          trackingUrl: o.trackingUrl,
          shippedAt: o.shippedAt,
          deliveredAt: o.deliveredAt,
          createdAt: o.createdAt,
        }))
      );
    } catch (err) {
      console.error("Error loading shipments", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = shipments
    .filter(
      (s) =>
        s.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        (s.supplier || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.trackingNumber || "").toLowerCase().includes(search.toLowerCase())
    )
    // Sort: shipped/delivered first, then processing/pending
    .sort((a, b) => {
      const rank = (status: string) => {
        if (status === "delivered") return 0;
        if (status === "shipped") return 1;
        if (status === "processing") return 2;
        return 3;
      };
      return rank(a.status) - rank(b.status);
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipments</h1>
          <p className="text-muted-foreground">Track outbound shipments</p>
        </div>
        <button
          onClick={load}
          className="px-3 py-2 text-sm rounded-md border hover:bg-muted transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by order number, supplier, or tracking..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Carrier / Tracking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Shipped
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Delivered
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-10 w-10 text-muted-foreground" />
                      <div>No shipments found</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{s.orderNumber}</td>
                    <td className="px-6 py-4 text-sm">{s.supplier || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {s.shippingCarrier || "—"}
                      {s.trackingNumber && (
                        <div className="text-xs text-muted-foreground">{s.trackingNumber}</div>
                      )}
                      {s.trackingUrl && (
                        <a
                          href={s.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Track
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {s.shippedAt ? new Date(s.shippedAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {s.deliveredAt ? new Date(s.deliveredAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


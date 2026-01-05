"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useInventoryStore } from "@/lib/store";
import Receipt from "@/components/receipt/Receipt";
import { Order } from "@/lib/types";
import { Loader2, AlertCircle } from "lucide-react";

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const { orders, isLoaded } = useInventoryStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState({
    name: "WareHouse.io",
    email: "admin@warehouse.io",
    address: "",
    phone: "",
  });

  useEffect(() => {
    // Load company info from settings
    if (typeof window !== "undefined") {
      const settings = localStorage.getItem("inventory_settings");
      if (settings) {
        try {
          const parsed = JSON.parse(settings);
          setCompanyInfo({
            name: parsed.companyName || "WareHouse.io",
            email: parsed.email || "admin@warehouse.io",
            address: parsed.address || "",
            phone: parsed.phone || "",
          });
        } catch (e) {
          console.error("Error parsing settings:", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!params.id) return;
      
      setIsLoading(true);
      setError(null);
      
      // First try to find in store
      if (isLoaded && orders.length > 0) {
        const foundOrder = orders.find((o) => o.id === params.id);
        if (foundOrder) {
          setOrder(foundOrder);
          setIsLoading(false);
          return;
        }
      }
      
      // If not in store, fetch directly from API
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          const foundOrder = data.orders?.find((o: Order) => o.id === params.id);
          if (foundOrder) {
            setOrder(foundOrder);
          } else {
            setError("Order not found");
          }
        } else {
          setError("Failed to load order");
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [params.id, isLoaded, orders]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading receipt...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Receipt Not Found</h2>
        <p className="text-muted-foreground mb-4">
          {error || "The requested receipt could not be found."}
        </p>
        <button
          onClick={() => router.push("/orders")}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <Receipt
      order={order}
      companyName={companyInfo.name}
      companyEmail={companyInfo.email}
      companyAddress={companyInfo.address}
      companyPhone={companyInfo.phone}
      onClose={() => router.push("/orders")}
    />
  );
}


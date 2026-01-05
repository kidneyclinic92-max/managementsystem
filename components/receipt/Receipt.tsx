"use client";

import { Order } from "@/lib/types";
import { Printer, Download, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ReceiptProps {
  order: Order;
  companyName?: string;
  companyEmail?: string;
  companyAddress?: string;
  companyPhone?: string;
  onClose?: () => void;
}

export default function Receipt({
  order,
  companyName = "WareHouse.io",
  companyEmail = "admin@warehouse.io",
  companyAddress = "",
  companyPhone = "",
  onClose,
}: ReceiptProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // For now, we'll use the browser's print to PDF functionality
    // In production, you might want to use a library like jsPDF or react-pdf
    window.print();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReceiptType = () => {
    return order.type === "sale" ? "Sales Receipt" : "Purchase Receipt";
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-background border-b p-4 flex items-center justify-between shadow-sm">
        <h1 className="text-2xl font-bold">Receipt</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Printer size={16} />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-muted transition-colors"
          >
            <Download size={16} />
            Download PDF
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-md border border-input bg-background hover:bg-muted transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Receipt Content */}
      <div className="max-w-3xl mx-auto p-8 print:p-4">
        <div className="bg-white print:bg-white rounded-lg shadow-lg print:shadow-none p-8 print:p-6">
          {/* Header */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{companyName}</h2>
                {companyAddress && (
                  <p className="text-sm text-gray-600 mb-1">{companyAddress}</p>
                )}
                {companyPhone && (
                  <p className="text-sm text-gray-600 mb-1">Phone: {companyPhone}</p>
                )}
                {companyEmail && (
                  <p className="text-sm text-gray-600">Email: {companyEmail}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  {getReceiptType()}
                </p>
                <p className="text-xs text-gray-500">Receipt #{order.orderNumber}</p>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {order.type === "sale" ? "Bill To" : "From"}
              </h3>
              <p className="text-sm font-medium text-gray-900">
                {order.type === "sale" ? order.customer : order.supplier || "N/A"}
              </p>
              {order.shippingAddress && (
                <p className="text-xs text-gray-600 mt-1">{order.shippingAddress}</p>
              )}
            </div>
            <div className="text-right">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Order Information
              </h3>
              <p className="text-sm text-gray-900">
                <span className="font-medium">Date:</span> {formatDate(order.createdAt)}
              </p>
              <p className="text-sm text-gray-900 mt-1">
                <span className="font-medium">Status:</span>{" "}
                <span className="capitalize">{order.status}</span>
              </p>
              {order.type === "sale" && order.shippedAt && (
                <p className="text-sm text-gray-900 mt-1">
                  <span className="font-medium">Shipped:</span> {formatDate(order.shippedAt)}
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Item
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Qty
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Unit Price
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">{item.itemName}</p>
                      {item.bin && (
                        <p className="text-xs text-gray-500 mt-1">Bin: {item.bin}</p>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-sm text-gray-700">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-gray-700">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-gray-900">
                      ${item.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-sm font-medium text-gray-900">
                  ${order.total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Tax</span>
                <span className="text-sm font-medium text-gray-900">$0.00</span>
              </div>
              <div className="flex justify-between py-3 mt-2">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mb-6 pt-6 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Notes
              </h3>
              <p className="text-sm text-gray-700">{order.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Thank you for your {order.type === "sale" ? "business" : "order"}!
            </p>
            <p className="text-xs text-gray-500 mt-2">
              This is a computer-generated receipt. No signature required.
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-white {
            background: white !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:p-4 {
            padding: 1rem !important;
          }
          .print\\:p-6 {
            padding: 1.5rem !important;
          }
          @page {
            margin: 0.5in;
          }
        }
      `}</style>
    </div>
  );
}


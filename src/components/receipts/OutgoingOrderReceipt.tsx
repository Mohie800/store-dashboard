"use client";

import { forwardRef, useMemo, type CSSProperties } from "react";
import type { CompanySettings } from "@/types/company";
import { formatCurrency, formatDateArabic, formatDateTime } from "@/lib/utils";
import { createCode39DataUrl, useQRCode } from "./helpers";

interface ReceiptItem {
  id?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  item: {
    id: string;
    nameAr: string;
    nameEn?: string | null;
    unit: string;
    sku?: string | null;
  };
}

interface OutgoingOrderReceiptProps {
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    discount: number;
    finalAmount: number;
    status: string;
    notes?: string | null;
    createdAt: string;
    customer: {
      id: string;
      nameAr: string;
      phone?: string | null;
      address?: string | null;
      nameEn?: string | null;
    };
    user: {
      id: string;
      name: string;
    };
    items: ReceiptItem[];
  };
  company?: CompanySettings | null;
}

const containerStyle: CSSProperties = {
  width: "794px",
  padding: "32px",
  backgroundColor: "#ffffff",
  color: "#1f2937",
  direction: "rtl",
  fontFamily: "var(--font-noto-sans-arabic), system-ui, sans-serif",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
};

const headerCellStyle: CSSProperties = {
  backgroundColor: "#f3f4f6",
  padding: "12px",
  textAlign: "center",
  border: "1px solid #e5e7eb",
  fontWeight: 600,
};

const cellStyle: CSSProperties = {
  padding: "10px",
  border: "1px solid #e5e7eb",
  textAlign: "center",
};

const sectionCardStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "16px",
  backgroundColor: "#f9fafb",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

export const OutgoingOrderReceipt = forwardRef<
  HTMLDivElement,
  OutgoingOrderReceiptProps
>(({ order, company }, ref) => {
  const qrValue = useMemo(
    () =>
      JSON.stringify({
        type: "outgoing-order",
        orderNumber: order.orderNumber,
        total: Number(order.finalAmount),
        customer: order.customer.nameAr,
        createdAt: order.createdAt,
      }),
    [
      order.createdAt,
      order.customer.nameAr,
      order.finalAmount,
      order.orderNumber,
    ]
  );

  const qrSrc = useQRCode(qrValue);
  const barcodeSrc = useMemo(
    () => createCode39DataUrl(order.orderNumber),
    [order.orderNumber]
  );

  const subtotal = Number(order.totalAmount);
  const discount = Number(order.discount);
  const total = Number(order.finalAmount);

  return (
    <div ref={ref} style={containerStyle}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "24px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {company?.logo ? (
            <img
              src={company.logo}
              alt={company.nameAr || "شعار الشركة"}
              style={{
                maxWidth: "160px",
                maxHeight: "80px",
                objectFit: "contain",
              }}
            />
          ) : (
            <div style={{ fontSize: "20px", fontWeight: 700 }}>
              {company?.nameAr || "شركة لوجستيك للإمدادات"}
            </div>
          )}
          <div style={{ fontSize: "13px", color: "#4b5563" }}>
            <div>{company?.address}</div>
            <div>
              {company?.phone1 && `هاتف: ${company.phone1}`}
              {company?.phone2 && ` | ${company.phone2}`}
            </div>
            {company?.email && <div>البريد: {company.email}</div>}
            {company?.taxNumber && (
              <div>الرقم الضريبي: {company.taxNumber}</div>
            )}
          </div>
        </div>

        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827" }}>
            إيصال طلبية صادرة
          </div>
          <div style={{ fontSize: "14px", color: "#6b7280", marginTop: "6px" }}>
            {formatDateArabic(order.createdAt)}
          </div>
          <div style={{ marginTop: "12px", fontSize: "14px" }}>
            رقم الطلب: <strong>{order.orderNumber}</strong>
          </div>
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
        }}
      >
        <div style={sectionCardStyle}>
          <div style={{ fontSize: "16px", fontWeight: 600 }}>بيانات العميل</div>
          <div>{order.customer.nameAr}</div>
          {order.customer.phone && <div>هاتف: {order.customer.phone}</div>}
          {order.customer.address && (
            <div>العنوان: {order.customer.address}</div>
          )}
        </div>

        <div style={sectionCardStyle}>
          <div style={{ fontSize: "16px", fontWeight: 600 }}>بيانات الطلب</div>
          <div>تاريخ الإنشاء: {formatDateTime(order.createdAt)}</div>
          <div>الحالة الحالية: {order.status}</div>
          <div>الموظف المسؤول: {order.user.name}</div>
        </div>
      </section>

      <section>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={headerCellStyle}>الصنف</th>
              <th style={headerCellStyle}>الكمية</th>
              <th style={headerCellStyle}>سعر الوحدة</th>
              <th style={headerCellStyle}>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr
                key={
                  item.id ??
                  `${item.item.id}-${item.quantity}-${item.unitPrice}`
                }
              >
                <td style={{ ...cellStyle, textAlign: "right" }}>
                  <div style={{ fontWeight: 600 }}>{item.item.nameAr}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {item.item.sku && <span>رمز: {item.item.sku}</span>}{" "}
                    {item.item.unit && <span> | الوحدة: {item.item.unit}</span>}
                  </div>
                </td>
                <td style={cellStyle}>{item.quantity}</td>
                <td style={cellStyle}>
                  {formatCurrency(Number(item.unitPrice))}
                </td>
                <td style={cellStyle}>
                  {formatCurrency(Number(item.totalPrice))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "8px",
        }}
      >
        <div
          style={{
            width: "320px",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "16px",
            backgroundColor: "#f3f4f6",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>المجموع الفرعي</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>الخصم</span>
            <strong style={{ color: "#dc2626" }}>
              {formatCurrency(discount)}
            </strong>
          </div>
          <div style={{ height: "1px", backgroundColor: "#d1d5db" }} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "18px",
              color: "#16a34a",
            }}
          >
            <span>الإجمالي المستحق</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
        </div>
      </section>

      {order.notes && (
        <section style={sectionCardStyle}>
          <div style={{ fontSize: "16px", fontWeight: 600 }}>ملاحظات</div>
          <div style={{ fontSize: "14px", lineHeight: 1.7 }}>{order.notes}</div>
        </section>
      )}

      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {qrSrc && (
            <div style={{ textAlign: "center" }}>
              <img
                src={qrSrc}
                alt="QR Code"
                style={{ width: "120px", height: "120px" }}
              />
              <div
                style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}
              >
                مسح للاستعلام عن الطلبية
              </div>
            </div>
          )}
          {barcodeSrc && (
            <div style={{ textAlign: "center" }}>
              <img src={barcodeSrc} alt="Barcode" style={{ height: "70px" }} />
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                رمز الطلب
              </div>
            </div>
          )}
        </div>

        <div style={{ minWidth: "200px" }}>
          <div style={{ fontWeight: 600, marginBottom: "8px" }}>
            توقيع الموظف
          </div>
          <div
            style={{
              borderTop: "1px dashed #9ca3af",
              height: "40px",
              marginTop: "24px",
            }}
          />
        </div>
      </section>

      {company?.footerText && (
        <footer
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "#6b7280",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "16px",
          }}
        >
          {company.footerText}
        </footer>
      )}
    </div>
  );
});

OutgoingOrderReceipt.displayName = "OutgoingOrderReceipt";

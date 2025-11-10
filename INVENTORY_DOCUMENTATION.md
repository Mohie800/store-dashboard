# Inventory Management System

## Overview

The Inventory Management system is a comprehensive solution for tracking stock levels, movements, and providing real-time inventory data for the logistics dashboard. It integrates seamlessly with incoming and outgoing orders to automatically update inventory levels.

## Features

### 1. **Real-time Stock Tracking**

- Track current stock levels for all items
- Monitor minimum stock levels and receive alerts
- View items that are out of stock or running low

### 2. **Inventory Movements**

- **IN**: Stock increases (receiving goods)
- **OUT**: Stock decreases (selling goods)
- **ADJUSTMENT**: Manual stock corrections

### 3. **Automatic Integration**

- Automatically updates inventory when incoming orders are marked as "COMPLETED"
- Automatically reduces inventory when outgoing orders are marked as "COMPLETED"
- Prevents overselling by checking stock availability

### 4. **Comprehensive Logging**

- Complete audit trail of all inventory movements
- Links movements to specific orders when applicable
- User attribution for all inventory changes

### 5. **Advanced Filtering & Search**

- Filter by stock status (All, Available, Low Stock, Out of Stock)
- Filter by category
- Search by item name or SKU

## API Endpoints

### GET `/api/inventory/items`

Returns all items with their current stock levels and last movement information.

**Response Example:**

```json
[
  {
    "id": "item_id",
    "nameAr": "اسم المنتج",
    "nameEn": "Product Name",
    "sku": "SKU001",
    "unit": "قطعة",
    "minStock": 10,
    "currentStock": 50,
    "category": {
      "id": "cat_id",
      "nameAr": "فئة المنتج"
    },
    "lastMovement": {
      "type": "IN",
      "quantity": 20,
      "createdAt": "2025-09-30T10:00:00.000Z"
    }
  }
]
```

### GET `/api/inventory/logs`

Returns the recent inventory movement logs (last 50 entries).

**Response Example:**

```json
[
  {
    "id": "log_id",
    "type": "IN",
    "quantity": 20,
    "currentStock": 50,
    "provision": "طلبية واردة رقم IN-000001",
    "notes": "استقبال منتج من الطلبية الواردة",
    "createdAt": "2025-09-30T10:00:00.000Z",
    "item": {
      "nameAr": "اسم المنتج",
      "sku": "SKU001"
    },
    "user": {
      "name": "اسم المستخدم"
    }
  }
]
```

### POST `/api/inventory/adjustment`

Creates a manual inventory adjustment.

**Request Body:**

```json
{
  "itemId": "item_id",
  "type": "ADJUSTMENT", // or "IN" or "OUT"
  "quantity": 100, // For ADJUSTMENT: new total stock, For IN/OUT: quantity to add/remove
  "provision": "سبب التعديل",
  "notes": "ملاحظات إضافية (اختياري)"
}
```

### GET `/api/inventory/summary`

Returns inventory summary statistics.

**Response Example:**

```json
{
  "totalItems": 150,
  "lowStockItems": 5,
  "outOfStockItems": 2,
  "availableItems": 143
}
```

## Database Schema

### InventoryLog Model

```prisma
model InventoryLog {
  id           String        @id @default(cuid())
  type         InventoryType // IN, OUT, ADJUSTMENT
  quantity     Int
  currentStock Int           // Stock level after this movement
  provision    String        // Reason for the movement
  orderId      String?       // Optional link to order
  notes        String?
  createdAt    DateTime      @default(now())

  // Relations
  itemId String
  item   Item   @relation(fields: [itemId], references: [id])
  userId String
  user   User   @relation(fields: [userId], references: [id])
}
```

## Stock Calculation Logic

The current stock for any item is calculated by processing all inventory logs in chronological order:

1. **IN movements**: Add quantity to current stock
2. **OUT movements**: Subtract quantity from current stock
3. **ADJUSTMENT movements**: Set stock to the specified quantity

For performance, the system stores the `currentStock` value in each log entry to avoid recalculating the entire history every time.

## Integration with Orders

### Incoming Orders

When an incoming order status is changed to "COMPLETED":

- Automatically creates inventory logs of type "IN" for each item
- Increases stock levels by the ordered quantities
- Links the inventory movement to the order via `orderId`

### Outgoing Orders

When an outgoing order status is changed to "COMPLETED":

- Automatically creates inventory logs of type "OUT" for each item
- Decreases stock levels by the sold quantities
- Validates that sufficient stock is available before completing the order
- Links the inventory movement to the order via `orderId`

## Stock Status Indicators

- **Available** (Green): Stock > minimum stock level
- **Low Stock** (Orange): Stock ≤ minimum stock level but > 0
- **Out of Stock** (Red): Stock = 0

## User Interface Features

### Main Inventory Page (`/dashboard/inventory`)

1. **Statistics Dashboard**

   - Total items count
   - Low stock items count
   - Out of stock items count

2. **Advanced Filters**

   - Search by name or SKU
   - Filter by category
   - Filter by stock status

3. **Items Table**

   - Shows current stock, minimum stock, and status
   - Quick access to make adjustments
   - Last movement information

4. **Recent Movements Log**

   - Shows the latest inventory movements
   - Includes user information and timestamps
   - Links movements to orders when applicable

5. **Manual Adjustment Modal**
   - Quick stock adjustments
   - Support for IN, OUT, and ADJUSTMENT types
   - Required provision (reason) field
   - Optional notes

## Error Handling

- **Insufficient Stock**: Prevents negative stock levels for OUT movements
- **Invalid Items**: Validates that items exist and are active
- **Permission Checks**: Ensures only authenticated users can make changes
- **Transaction Safety**: Uses database transactions to ensure data consistency

## Security & Audit

- All inventory movements are logged with user attribution
- Complete audit trail is maintained
- Cannot delete completed orders that have inventory movements
- Inventory logs are immutable once created

## Future Enhancements

1. **Batch Operations**: Support for bulk inventory adjustments
2. **Stock Alerts**: Email/SMS notifications for low stock items
3. **Barcode Scanning**: Mobile app integration for quick stock updates
4. **Inventory Forecasting**: Predict future stock needs based on historical data
5. **Multi-location Support**: Track inventory across multiple warehouses
6. **Cost Tracking**: Include cost basis and valuation calculations

## Testing

To test the inventory management system:

1. Create some items and categories
2. Create incoming orders and mark them as COMPLETED - verify stock increases
3. Create outgoing orders and mark them as COMPLETED - verify stock decreases
4. Try manual adjustments through the inventory page
5. Check that all movements appear in the logs with correct user attribution

## Error Recovery

If inventory data becomes inconsistent:

1. **Recalculate Stock**: Run a script to recalculate current stock from all logs
2. **Audit Trail**: Use the complete log history to trace any discrepancies
3. **Manual Adjustment**: Use ADJUSTMENT type to correct any issues

The system is designed to be self-healing and maintain data integrity even in edge cases.

import { prisma } from "./prisma";

interface DepletionResult {
  success: boolean;
  depletedIngredients: Array<{
    name: string;
    depletedAmount: number;
    unit: string;
    remainingStock: number;
    isBelowThreshold: boolean;
  }>;
  alerts: string[];
}

export async function processOrderRecipeBOM(orderId: string): Promise<DepletionResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          menuItem: {
            include: {
              recipeBOMs: {
                include: {
                  inventoryItem: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found for Recipe BOM processing`);
  }

  // Aggregate total raw materials needed for this entire order
  const ingredientDeductions: Record<
    string,
    { id: string; name: string; qty: number; unit: string; currentStock: number; threshold: number }
  > = {};

  for (const item of order.items) {
    const qty = item.quantity;
    
    // Process recipe bill of materials
    for (const bom of item.menuItem.recipeBOMs) {
      const invId = bom.inventoryItemId;
      const deductionAmount = bom.qtyPerItem * qty;

      if (!ingredientDeductions[invId]) {
        ingredientDeductions[invId] = {
          id: invId,
          name: bom.inventoryItem.name,
          qty: 0,
          unit: bom.unit,
          currentStock: bom.inventoryItem.stockQty,
          threshold: bom.inventoryItem.thresholdQty,
        };
      }
      ingredientDeductions[invId].qty += deductionAmount;
    }

    // Check for add-on modifiers that require ingredient deduction
    if (item.selectedModifiersJson) {
      try {
        const modifiers = JSON.parse(item.selectedModifiersJson);
        for (const mod of modifiers) {
          const modName = (mod.name || "").toLowerCase();
          
          // Extra Butter Pav -> deduct 1 Pav and 0.015kg Butter
          if (modName.includes("butter")) {
            // Find Butter in inventory
            const butter = await prisma.inventoryItem.findFirst({
              where: { name: { contains: "Butter" } },
            });
            if (butter) {
              if (!ingredientDeductions[butter.id]) {
                ingredientDeductions[butter.id] = {
                  id: butter.id,
                  name: butter.name,
                  qty: 0,
                  unit: butter.unit,
                  currentStock: butter.stockQty,
                  threshold: butter.thresholdQty,
                };
              }
              ingredientDeductions[butter.id].qty += 0.015 * qty; // 15g
            }
          }

          // Cheese Slice -> deduct 1 Cheese unit
          if (modName.includes("cheese")) {
            const cheese = await prisma.inventoryItem.findFirst({
              where: { name: { contains: "Cheese" } },
            });
            if (cheese) {
              if (!ingredientDeductions[cheese.id]) {
                ingredientDeductions[cheese.id] = {
                  id: cheese.id,
                  name: cheese.name,
                  qty: 0,
                  unit: cheese.unit,
                  currentStock: cheese.stockQty,
                  threshold: cheese.thresholdQty,
                };
              }
              ingredientDeductions[cheese.id].qty += 1 * qty;
            }
          }
        }
      } catch (err) {
        console.error("Error parsing modifiers for BOM", err);
      }
    }
  }

  const alerts: string[] = [];
  const depletedList: DepletionResult["depletedIngredients"] = [];

  // Execute database transaction to deduct stock and record audit logs
  await prisma.$transaction(async (tx) => {
    for (const item of Object.values(ingredientDeductions)) {
      const updated = await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          stockQty: {
            decrement: item.qty,
          },
        },
      });

      const isBelow = updated.stockQty <= updated.thresholdQty;
      depletedList.push({
        name: updated.name,
        depletedAmount: item.qty,
        unit: updated.unit,
        remainingStock: updated.stockQty,
        isBelowThreshold: isBelow,
      });

      if (isBelow) {
        alerts.push(
          `⚠️ LOW STOCK ALERT: ${updated.name} has only ${updated.stockQty.toFixed(2)} ${updated.unit} left! (Threshold: ${updated.thresholdQty} ${updated.unit})`
        );
      }
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        action: "INVENTORY_DEPLETED",
        entityType: "ORDER",
        entityId: order.id,
        detailsJson: JSON.stringify({
          orderNumber: order.orderNumber,
          deductions: depletedList,
          alerts,
        }),
      },
    });
  });

  return {
    success: true,
    depletedIngredients: depletedList,
    alerts,
  };
}

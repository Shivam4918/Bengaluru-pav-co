import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rawMaterialSchema, restockSchema, sanitizeInput } from "@/lib/validations";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Helper: Require Admin Authorization for modification
async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyAuthToken(token);
  if (!payload || payload.role !== "ADMIN") return null;
  return payload;
}

/**
 * GET /api/inventory
 * Retrieves all raw materials, stock levels, safety thresholds, and linked Recipe BOMs
 */
export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      include: {
        recipeBOMs: {
          include: {
            menuItem: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const menuItems = await prisma.menuItem.findMany({
      select: { id: true, title: true, slug: true, price: true },
      orderBy: { title: "asc" },
    });

    const lowStockCount = items.filter((item) => item.stockQty <= item.thresholdQty).length;

    return NextResponse.json({
      items,
      menuItems,
      lowStockCount,
      totalIngredients: items.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

/**
 * POST /api/inventory
 * Creates a brand new raw material / inventory ingredient and optionally links to Recipe BOMs
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = rawMaterialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { name, category, stockQty, unit, thresholdQty, costPerUnit, recipeLinks } = parsed.data;

    const item = await prisma.inventoryItem.create({
      data: {
        name: sanitizeInput(name),
        category,
        stockQty,
        unit: unit.toUpperCase(),
        thresholdQty,
        costPerUnit,
      },
    });

    // If recipe BOM links are provided, create them
    if (recipeLinks && recipeLinks.length > 0) {
      for (const link of recipeLinks) {
        if (link.menuItemId && link.qtyPerItem > 0) {
          await prisma.recipeBOM.create({
            data: {
              menuItemId: link.menuItemId,
              inventoryItemId: item.id,
              qtyPerItem: link.qtyPerItem,
              unit: link.unit || item.unit,
            },
          }).catch(() => {});
        }
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "INVENTORY_CREATED",
        entityType: "INVENTORY",
        entityId: item.id,
        detailsJson: JSON.stringify({
          name: item.name,
          category: item.category,
          stockQty: item.stockQty,
          unit: item.unit,
          createdBy: admin.email,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error("Create inventory error:", error);
    return NextResponse.json({ error: "Failed to create raw material" }, { status: 500 });
  }
}

/**
 * PUT /api/inventory
 * Updates an existing raw material's details, thresholds, costs, and recipe links
 */
export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Inventory item ID is required." }, { status: 400 });
    }

    const parsed = rawMaterialSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Raw material not found." }, { status: 404 });
    }

    const { name, category, stockQty, unit, thresholdQty, costPerUnit, recipeLinks } = parsed.data;

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: sanitizeInput(name),
        category,
        stockQty,
        unit: unit.toUpperCase(),
        thresholdQty,
        costPerUnit,
      },
    });

    // If recipeLinks array is supplied, sync RecipeBOM
    if (recipeLinks) {
      await prisma.recipeBOM.deleteMany({
        where: { inventoryItemId: id },
      });

      for (const link of recipeLinks) {
        if (link.menuItemId && link.qtyPerItem > 0) {
          await prisma.recipeBOM.create({
            data: {
              menuItemId: link.menuItemId,
              inventoryItemId: id,
              qtyPerItem: link.qtyPerItem,
              unit: link.unit || updated.unit,
            },
          }).catch(() => {});
        }
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "INVENTORY_UPDATED",
        entityType: "INVENTORY",
        entityId: id,
        detailsJson: JSON.stringify({
          updatedBy: admin.email,
          previous: existing,
          new: updated,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("Update inventory error:", error);
    return NextResponse.json({ error: "Failed to update raw material" }, { status: 500 });
  }
}

/**
 * PATCH /api/inventory
 * Quick Restock or stock manual adjustment
 */
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = restockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { ingredientId, adjustmentQty, reason } = parsed.data;

    const existing = await prisma.inventoryItem.findUnique({
      where: { id: ingredientId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Inventory item not found." }, { status: 404 });
    }

    const newStock = existing.stockQty + adjustmentQty;
    if (newStock < 0) {
      return NextResponse.json(
        { error: "Insufficient stock. Cannot reduce inventory below zero." },
        { status: 400 }
      );
    }

    const updated = await prisma.inventoryItem.update({
      where: { id: ingredientId },
      data: { stockQty: newStock },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "INVENTORY_RESTOCKED",
        entityType: "INVENTORY",
        entityId: ingredientId,
        detailsJson: JSON.stringify({
          ingredient: existing.name,
          addedQty: adjustmentQty,
          previousStock: existing.stockQty,
          newStock,
          reason,
          adjustedBy: admin.email,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      item: updated,
      message: `Restocked ${adjustmentQty} ${existing.unit} of ${existing.name}. New stock: ${newStock} ${existing.unit}.`,
    });
  } catch (error: any) {
    console.error("Restock error:", error);
    return NextResponse.json({ error: "Failed to adjust inventory" }, { status: 500 });
  }
}

/**
 * DELETE /api/inventory
 * Removes a raw material from the store database
 */
export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Inventory item ID is required." }, { status: 400 });
    }

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Raw material not found." }, { status: 404 });
    }

    // Delete associated Recipe BOM entries first to preserve referential integrity
    await prisma.recipeBOM.deleteMany({
      where: { inventoryItemId: id },
    });

    // Delete raw material
    await prisma.inventoryItem.delete({
      where: { id },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "INVENTORY_DELETED",
        entityType: "INVENTORY",
        entityId: id,
        detailsJson: JSON.stringify({
          deletedName: existing.name,
          deletedCategory: existing.category,
          deletedBy: admin.email,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Raw material "${existing.name}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error("Delete inventory error:", error);
    return NextResponse.json({ error: "Failed to delete raw material" }, { status: 500 });
  }
}

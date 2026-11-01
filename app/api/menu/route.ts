import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/menu
 * Returns all active categories, menu items, and their modifiers directly from the database
 */
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    });

    const items = await prisma.menuItem.findMany({
      where: { isAvailable: true },
      include: {
        modifiers: true,
        category: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      categories,
      items: items.map((item) => ({
        id: item.id,
        categoryId: item.category?.slug || item.categoryId,
        title: item.title,
        slug: item.slug,
        description: item.description,
        price: item.price,
        prepTimeMin: item.prepTimeMin,
        isVeg: item.isVeg,
        isAvailable: item.isAvailable,
        isBestseller: item.isBestseller,
        spiceLevel: item.spiceLevel,
        imageUrl: item.imageUrl,
        modifiers: item.modifiers.map((m) => ({
          id: m.id,
          name: m.name,
          groupName: m.groupName,
          extraPrice: m.extraPrice,
          isRequired: m.isRequired,
        })),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch menu" }, { status: 500 });
  }
}


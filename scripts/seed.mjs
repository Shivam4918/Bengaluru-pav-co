import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Bengaluru Pav Co. production database...");

  // Clear existing items to allow clean re-seed
  await prisma.recipeBOM.deleteMany();
  await prisma.modifier.deleteMany();
  await prisma.itemVariant.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.user.deleteMany();
  await prisma.storeSetting.deleteMany();

  // 1. Store Master Setting
  await prisma.storeSetting.create({
    data: {
      id: "primary",
      storeName: "Bengaluru Pav Co. (Bengaluru Koramangala Hub)",
      isStoreOpen: true,
      surgeThrottleActive: false,
      maxActiveOrders: 35,
      avgPrepTimeMin: 7,
      currentTokenSequence: 101,
      bannerNotice: "🔥 Kadai is sizzling! Fresh golden Batata Vadas prepared in pure groundnut & sunflower oil.",
    },
  });

  // 2. Core Operational Staff & Admin Users
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync("Prajapati1121@2003#$@21", salt);
  const kitchenPasswordHash = bcrypt.hashSync("KitchenChef@2026", salt);
  const cashierPasswordHash = bcrypt.hashSync("CounterCashier@2026", salt);

  const adminUser = await prisma.user.create({
    data: {
      name: "Shivam (Store Admin)",
      email: "shivam4918@gmail.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      loyaltyPoints: 0,
    },
  });

  const kitchenUser = await prisma.user.create({
    data: {
      name: "Ramesh (Head Fry Chef)",
      email: "kitchen@mumbaipav.co",
      passwordHash: kitchenPasswordHash,
      role: "KITCHEN_STAFF",
      loyaltyPoints: 0,
    },
  });

  const cashierUser = await prisma.user.create({
    data: {
      name: "Pooja (Lead Cashier)",
      email: "cashier@mumbaipav.co",
      passwordHash: cashierPasswordHash,
      role: "CASHIER",
      loyaltyPoints: 0,
    },
  });

  // 3. Raw Materials & Inventory Items
  const invBatata = await prisma.inventoryItem.create({
    data: {
      name: "Batata (Farm Potatoes)",
      category: "VEGETABLES",
      stockQty: 85.0,
      unit: "KG",
      thresholdQty: 20.0,
      costPerUnit: 32.0,
    },
  });

  const invPav = await prisma.inventoryItem.create({
    data: {
      name: "Fresh Laadi Pav (Pack of 6)",
      category: "BAKERY",
      stockQty: 240.0,
      unit: "PACKETS",
      thresholdQty: 40.0,
      costPerUnit: 35.0,
    },
  });

  const invBesan = await prisma.inventoryItem.create({
    data: {
      name: "Besan (Gram Flour)",
      category: "DRY_GROCERY",
      stockQty: 60.0,
      unit: "KG",
      thresholdQty: 15.0,
      costPerUnit: 90.0,
    },
  });

  const invButter = await prisma.inventoryItem.create({
    data: {
      name: "Amul Butter Block",
      category: "DAIRY",
      stockQty: 28.0,
      unit: "KG",
      thresholdQty: 6.0,
      costPerUnit: 540.0,
    },
  });

  const invCheese = await prisma.inventoryItem.create({
    data: {
      name: "Amul Processed Cheese Slices",
      category: "DAIRY",
      stockQty: 140.0,
      unit: "PIECES",
      thresholdQty: 30.0,
      costPerUnit: 14.0,
    },
  });

  const invChillies = await prisma.inventoryItem.create({
    data: {
      name: "Kolhapur Green Chillies (Lavangi)",
      category: "VEGETABLES",
      stockQty: 14.0,
      unit: "KG",
      thresholdQty: 3.5,
      costPerUnit: 80.0,
    },
  });

  const invOil = await prisma.inventoryItem.create({
    data: {
      name: "Frying Oil (Refined Sunflower)",
      category: "DRY_GROCERY",
      stockQty: 65.0,
      unit: "LITRES",
      thresholdQty: 18.0,
      costPerUnit: 125.0,
    },
  });

  const invTea = await prisma.inventoryItem.create({
    data: {
      name: "Assam CTC Tea & Kadak Spices",
      category: "SPICES",
      stockQty: 12.0,
      unit: "KG",
      thresholdQty: 2.5,
      costPerUnit: 380.0,
    },
  });

  // 4. Categories
  const catVadaPav = await prisma.category.create({
    data: {
      title: "Signature Vada Pav",
      slug: "vada-pav",
      sortOrder: 1,
    },
  });

  const catCombos = await prisma.category.create({
    data: {
      title: "Street Combos & Platters",
      slug: "combos",
      sortOrder: 2,
    },
  });

  const catBeverages = await prisma.category.create({
    data: {
      title: "Chai & Coolers",
      slug: "beverages",
      sortOrder: 3,
    },
  });

  const catSides = await prisma.category.create({
    data: {
      title: "Sides & Extra Thecha",
      slug: "sides",
      sortOrder: 4,
    },
  });

  // 5. Menu Items
  // A. Classic Vada Pav
  const itemClassic = await prisma.menuItem.create({
    data: {
      categoryId: catVadaPav.id,
      title: "Classic Mumbai Batata Vada Pav",
      slug: "classic-mumbai-vada-pav",
      description: "Golden spiced potato dumpling in freshly baked soft pav, laced with tangy tamarind, mint-coriander chutney, and fiery dry garlic thecha.",
      price: 49.0,
      prepTimeMin: 5,
      isVeg: true,
      isAvailable: true,
      isBestseller: true,
      spiceLevel: "MEDIUM",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
    },
  });

  // B. Cheese Burst Vada Pav
  const itemCheese = await prisma.menuItem.create({
    data: {
      categoryId: catVadaPav.id,
      title: "Cheese Burst Vada Pav",
      slug: "cheese-burst-vada-pav",
      description: "Crispy batata vada layered with molten melted Amul cheese and pan-toasted butter pav. Absolute indulgence!",
      price: 79.0,
      prepTimeMin: 6,
      isVeg: true,
      isAvailable: true,
      isBestseller: true,
      spiceLevel: "MILD",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
    },
  });

  // C. Ulta Vada Pav
  const itemUlta = await prisma.menuItem.create({
    data: {
      categoryId: catVadaPav.id,
      title: "Ulta Vada Pav (Upside Down)",
      slug: "ulta-vada-pav",
      description: "Soft pav stuffed from inside with spiced potato filling, dipped in spiced chickpea batter, and deep-fried till golden crisp.",
      price: 69.0,
      prepTimeMin: 7,
      isVeg: true,
      isAvailable: true,
      isBestseller: false,
      spiceLevel: "THECHA_HOT",
      imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80",
    },
  });

  // D. Schezwan Thecha Pav
  const itemSchezwan = await prisma.menuItem.create({
    data: {
      categoryId: catVadaPav.id,
      title: "Kolhapuri Thecha Vada Pav",
      slug: "kolhapuri-thecha-vada-pav",
      description: "For spice warriors! Crushed green chilli garlic thecha slathered inside a steaming hot batata vada.",
      price: 59.0,
      prepTimeMin: 5,
      isVeg: true,
      isAvailable: true,
      isBestseller: false,
      spiceLevel: "THECHA_HOT",
      imageUrl: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80",
    },
  });

  // E. Mumbai Express Combo
  const itemCombo = await prisma.menuItem.create({
    data: {
      categoryId: catCombos.id,
      title: "Mumbai Express Combo",
      slug: "mumbai-express-combo",
      description: "2 Signature Classic Batata Vada Pavs + 1 Hot Masala Cutting Chai + Fried Salted Mirchi. Perfect evening snack!",
      price: 119.0,
      prepTimeMin: 6,
      isVeg: true,
      isAvailable: true,
      isBestseller: true,
      spiceLevel: "MEDIUM",
      imageUrl: "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80",
    },
  });

  // F. Masala Chai
  const itemChai = await prisma.menuItem.create({
    data: {
      categoryId: catBeverages.id,
      title: "Kadak Mumbai Cutting Chai",
      slug: "kadak-mumbai-cutting-chai",
      description: "Slow-brewed Assam CTC tea infused with fresh crushed ginger, cardamom, lemongrass, and cloves.",
      price: 25.0,
      prepTimeMin: 3,
      isVeg: true,
      isAvailable: true,
      isBestseller: true,
      spiceLevel: "MILD",
      imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
    },
  });

  // G. Alphonso Mango Lassi
  const itemLassi = await prisma.menuItem.create({
    data: {
      categoryId: catBeverages.id,
      title: "Ratnagiri Mango Lassi",
      slug: "ratnagiri-mango-lassi",
      description: "Thick creamy yogurt churned with pure Ratnagiri Alphonso mango pulp and saffron strands.",
      price: 65.0,
      prepTimeMin: 3,
      isVeg: true,
      isAvailable: true,
      isBestseller: false,
      spiceLevel: "MILD",
      imageUrl: "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80",
    },
  });

  // H. Fried Salted Mirchi Fry
  const itemMirchi = await prisma.menuItem.create({
    data: {
      categoryId: catSides.id,
      title: "Salted Fried Green Chillies (Mirchi Fry)",
      slug: "salted-fried-mirchi-fry",
      description: "Crisp-fried green chillies tossed in rock salt and amchur powder. The non-negotiable pav partner!",
      price: 20.0,
      prepTimeMin: 2,
      isVeg: true,
      isAvailable: true,
      isBestseller: false,
      spiceLevel: "THECHA_HOT",
      imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
    },
  });

  // 6. Modifiers (Reusable add-ons across items)
  const modifiersData = [
    { name: "Extra Dry Garlic Thecha Chutney", groupName: "CHUTNEY", extraPrice: 10.0 },
    { name: "Amul Melted Cheese Slice", groupName: "CHEESE", extraPrice: 20.0 },
    { name: "Extra Butter Grilled Pav", groupName: "PAV", extraPrice: 15.0 },
    { name: "Extra Fresh Laadi Pav Pair (2 pcs)", groupName: "PAV", extraPrice: 15.0 },
    { name: "Fried Salted Mirchi Extra", groupName: "SPICE", extraPrice: 10.0 },
  ];

  for (const item of [itemClassic, itemCheese, itemUlta, itemSchezwan, itemCombo]) {
    for (const mod of modifiersData) {
      await prisma.modifier.create({
        data: {
          menuItemId: item.id,
          name: mod.name,
          groupName: mod.groupName,
          extraPrice: mod.extraPrice,
        },
      });
    }
  }

  // 7. Recipe BOM (Bill of Materials) Mapping
  // Classic Vada Pav BOM: 1 Pav, 0.08 kg Potato, 0.02 kg Besan, 0.010 kg Butter, 0.015 L Oil
  await prisma.recipeBOM.createMany({
    data: [
      { menuItemId: itemClassic.id, inventoryItemId: invPav.id, qtyPerItem: 0.166, unit: "PACKETS" }, // 1 pav from pack of 6
      { menuItemId: itemClassic.id, inventoryItemId: invBatata.id, qtyPerItem: 0.08, unit: "KG" },
      { menuItemId: itemClassic.id, inventoryItemId: invBesan.id, qtyPerItem: 0.02, unit: "KG" },
      { menuItemId: itemClassic.id, inventoryItemId: invButter.id, qtyPerItem: 0.01, unit: "KG" }, // 10g butter
      { menuItemId: itemClassic.id, inventoryItemId: invOil.id, qtyPerItem: 0.015, unit: "LITRES" },
      { menuItemId: itemClassic.id, inventoryItemId: invChillies.id, qtyPerItem: 0.005, unit: "KG" },

      // Cheese Burst BOM
      { menuItemId: itemCheese.id, inventoryItemId: invPav.id, qtyPerItem: 0.166, unit: "PACKETS" },
      { menuItemId: itemCheese.id, inventoryItemId: invBatata.id, qtyPerItem: 0.08, unit: "KG" },
      { menuItemId: itemCheese.id, inventoryItemId: invCheese.id, qtyPerItem: 1.0, unit: "PIECES" },
      { menuItemId: itemCheese.id, inventoryItemId: invButter.id, qtyPerItem: 0.02, unit: "KG" }, // 20g butter

      // Ulta Vada Pav BOM
      { menuItemId: itemUlta.id, inventoryItemId: invPav.id, qtyPerItem: 0.166, unit: "PACKETS" },
      { menuItemId: itemUlta.id, inventoryItemId: invBatata.id, qtyPerItem: 0.10, unit: "KG" },
      { menuItemId: itemUlta.id, inventoryItemId: invBesan.id, qtyPerItem: 0.035, unit: "KG" },
      { menuItemId: itemUlta.id, inventoryItemId: invOil.id, qtyPerItem: 0.025, unit: "LITRES" },

      // Chai BOM
      { menuItemId: itemChai.id, inventoryItemId: invTea.id, qtyPerItem: 0.012, unit: "KG" },
    ],
  });

  // 8. Sample Pre-loaded Orders for KDS and Live Analytics
  const sampleOrder1 = await prisma.order.create({
    data: {
      orderNumber: "MPC-20261021-0101",
      tokenNo: 101,
      orderType: "TAKEAWAY",
      status: "PREPARING",
      paymentStatus: "PAID",
      paymentMethod: "RAZORPAY_UPI",
      subtotal: 147.0,
      gstAmount: 7.35,
      totalAmount: 154.35,
      pickupSlot: "Immediate Pickup",
      customerName: "Pooja Hegde",
      customerPhone: "9876500001",
      customerEmail: "pooja@example.com",
      idempotencyKey: "idemp_sample_101",
      prepStartedAt: new Date(Date.now() - 4 * 60 * 1000), // 4 mins ago
      items: {
        create: [
          {
            menuItemId: itemClassic.id,
            itemTitle: itemClassic.title,
            unitPrice: itemClassic.price,
            quantity: 3,
            totalPrice: 147.0,
            selectedModifiersJson: JSON.stringify([{ name: "Thecha Hot", extraPrice: 0 }]),
          },
        ],
      },
    },
  });

  const sampleOrder2 = await prisma.order.create({
    data: {
      orderNumber: "MPC-20261021-0102",
      tokenNo: 102,
      orderType: "DINE_IN",
      status: "CONFIRMED",
      paymentStatus: "PAID",
      paymentMethod: "COUNTER_UPI",
      subtotal: 198.0,
      gstAmount: 9.9,
      totalAmount: 207.9,
      tableNo: "Table 4",
      customerName: "Vikram Shenoy",
      customerPhone: "9876500002",
      idempotencyKey: "idemp_sample_102",
      createdAt: new Date(Date.now() - 1 * 60 * 1000), // 1 min ago
      items: {
        create: [
          {
            menuItemId: itemCheese.id,
            itemTitle: itemCheese.title,
            unitPrice: itemCheese.price,
            quantity: 2,
            totalPrice: 158.0,
            selectedModifiersJson: JSON.stringify([{ name: "Extra Butter Grilled Pav", extraPrice: 15 }]),
          },
          {
            menuItemId: itemChai.id,
            itemTitle: itemChai.title,
            unitPrice: itemChai.price,
            quantity: 2,
            totalPrice: 50.0,
          },
        ],
      },
    },
  });

  const sampleOrder3 = await prisma.order.create({
    data: {
      orderNumber: "MPC-20261021-0103",
      tokenNo: 103,
      orderType: "DELIVERY",
      status: "READY_FOR_PICKUP",
      paymentStatus: "PAID",
      paymentMethod: "RAZORPAY_CARD",
      subtotal: 238.0,
      gstAmount: 11.9,
      deliveryFee: 25.0,
      totalAmount: 274.9,
      deliveryAddress: "Flat 204, Brigade Citadel, Koramangala 5th Block",
      deliveryPincode: "560034",
      customerName: "Deepak Rao",
      customerPhone: "9876500003",
      idempotencyKey: "idemp_sample_103",
      prepStartedAt: new Date(Date.now() - 10 * 60 * 1000),
      readyAt: new Date(Date.now() - 2 * 60 * 1000),
      items: {
        create: [
          {
            menuItemId: itemCombo.id,
            itemTitle: itemCombo.title,
            unitPrice: itemCombo.price,
            quantity: 2,
            totalPrice: 238.0,
          },
        ],
      },
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log(`- Created Categories: 4`);
  console.log(`- Created Menu Items: 8 with Modifiers & Recipe BOM`);
  console.log(`- Created Inventory Items: 8`);
  console.log(`- Created 3 Active Live Orders for KDS & Tracking`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

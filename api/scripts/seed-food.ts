import { TableClient } from "@azure/data-tables";

const LANG_TO_LOCALE: Record<string, string> = { en: "en-US", sv: "sv-SE" };
const seedLanguage = process.env.SEED_LANGUAGE || "en";
const locale = LANG_TO_LOCALE[seedLanguage] || "en-US";

const connectionString =
  process.env.AZURE_STORAGE_CONNECTION_STRING || "UseDevelopmentStorage=true";
const tableName = "FoodItems";

async function main() {
  const { FOOD_ITEMS } = seedLanguage === "sv"
    ? await import("./food-data-sv")
    : await import("./food-data-en");

  const client = TableClient.fromConnectionString(connectionString, tableName);

  try {
    await client.createTable();
  } catch (error: any) {
    if (error.statusCode !== 409) throw error;
  }

  const existing = new Set<string>();
  for await (const entity of client.listEntities({
    queryOptions: { filter: "PartitionKey eq 'item'" },
  })) {
    if (entity.nameLower) existing.add(String(entity.nameLower));
  }

  let created = 0;
  for (const item of FOOD_ITEMS) {
    const nameLower = item.name.toLocaleLowerCase(locale);
    if (existing.has(nameLower)) continue;

    await client.createEntity({
      partitionKey: "item",
      rowKey: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: item.name,
      nameLower,
      category: item.category,
      unit: item.unit,
      createdAt: new Date().toISOString(),
    });
    existing.add(nameLower);
    created++;
  }

  console.log(
    `[${seedLanguage}] Seeded ${created} new food item(s); ${FOOD_ITEMS.length - created} already existed.`
  );
}

main().catch((err) => {
  console.error("Failed to seed food items:", err);
  process.exit(1);
});

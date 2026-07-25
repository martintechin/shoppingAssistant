import { TableClient } from "@azure/data-tables";
import { FOOD_ITEMS } from "./food-data";

const connectionString =
  process.env.AZURE_STORAGE_CONNECTION_STRING || "UseDevelopmentStorage=true";
const tableName = "FoodItems";

async function main() {
  const client = TableClient.fromConnectionString(connectionString, tableName);

  try {
    await client.createTable();
  } catch (error: any) {
    if (error.statusCode !== 409) throw error;
  }

  // Idempotent: match on lowercase name and only insert what's missing, so
  // re-running never overwrites user edits or lastBought timestamps.
  const existing = new Set<string>();
  for await (const entity of client.listEntities({
    queryOptions: { filter: "PartitionKey eq 'item'" },
  })) {
    if (entity.nameLower) existing.add(String(entity.nameLower));
  }

  let created = 0;
  for (const item of FOOD_ITEMS) {
    const nameLower = item.name.toLocaleLowerCase("sv-SE");
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
    `Seeded ${created} new food item(s); ${FOOD_ITEMS.length - created} already existed.`
  );
}

main().catch((err) => {
  console.error("Failed to seed food items:", err);
  process.exit(1);
});

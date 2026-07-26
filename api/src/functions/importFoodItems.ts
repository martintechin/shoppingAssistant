import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRequest } from "../auth.js";
import { escapeOData } from "../odata.js";
import { ensureTableExists, generateRowKey, getTableClient } from "../tableClient.js";
import { APP_LOCALE } from "../locale.js";

const tableName = "FoodItems";

interface ImportItem {
  id?: string;
  name: string;
  category: string;
  unit: string;
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

function validateImportItem(item: any): item is ImportItem {
  return (
    item &&
    typeof item.name === "string" &&
    item.name.trim().length > 0 &&
    item.name.trim().length <= 100 &&
    typeof item.category === "string" &&
    item.category.trim().length > 0 &&
    item.category.trim().length <= 50 &&
    typeof item.unit === "string" &&
    item.unit.length > 0 &&
    item.unit.length <= 10 &&
    (item.id === undefined || item.id === "" || typeof item.id === "string")
  );
}

export async function importFoodItems(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const auth = await verifyRequest(request, context);
  if (!auth.authenticated) {
    return { status: 401, jsonBody: { error: "Unauthorized" } };
  }

  try {
    let data: any;
    try {
      data = JSON.parse(await request.text());
    } catch {
      return { status: 400, jsonBody: { error: "Invalid JSON in request body" } };
    }

    if (!data || !Array.isArray(data.items)) {
      return { status: 400, jsonBody: { error: "Expected { items: [...] }" } };
    }

    if (data.items.length > 1000) {
      return { status: 400, jsonBody: { error: "Maximum 1000 items per import" } };
    }

    const client = getTableClient(tableName);
    await ensureTableExists(client);

    const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

    for (let i = 0; i < data.items.length; i++) {
      const raw = data.items[i];
      if (!validateImportItem(raw)) {
        result.errors.push(`Row ${i + 1}: invalid data`);
        result.skipped++;
        continue;
      }

      const name = raw.name.trim();
      const nameLower = name.toLocaleLowerCase(APP_LOCALE);
      const category = raw.category.trim();
      const unit = raw.unit.trim();
      const id = raw.id?.trim() || "";

      try {
        if (id) {
          // Try to update existing item by id
          let existing: any;
          try {
            existing = await client.getEntity("item", id);
          } catch (error: any) {
            if (error.statusCode === 404) {
              result.errors.push(`Row ${i + 1}: item with id "${id}" not found, skipped`);
              result.skipped++;
              continue;
            }
            throw error;
          }

          // Check name collision if name changed
          if (nameLower !== String(existing.nameLower ?? "")) {
            let collision = false;
            for await (const entity of client.listEntities({
              queryOptions: {
                filter: `PartitionKey eq 'item' and nameLower eq '${escapeOData(nameLower)}'`,
              },
            })) {
              if (entity.rowKey !== id) {
                result.errors.push(`Row ${i + 1}: name "${name}" conflicts with existing item`);
                result.skipped++;
                collision = true;
                break;
              }
            }
            if (collision) continue;
          }

          await client.updateEntity(
            { partitionKey: "item", rowKey: id, name, nameLower, category, unit } as any,
            "Merge"
          );
          result.updated++;
        } else {
          // New item — check for duplicate name
          let duplicate = false;
          for await (const entity of client.listEntities({
            queryOptions: {
              filter: `PartitionKey eq 'item' and nameLower eq '${escapeOData(nameLower)}'`,
            },
          })) {
            result.errors.push(`Row ${i + 1}: "${name}" already exists, skipped`);
            result.skipped++;
            duplicate = true;
            break;
          }
          if (duplicate) continue;

          const rowKey = generateRowKey();
          await client.createEntity({
            partitionKey: "item",
            rowKey,
            name,
            nameLower,
            category,
            unit,
            createdAt: new Date().toISOString(),
          });
          result.created++;
        }
      } catch (error: any) {
        context.error(`Error importing row ${i + 1}:`, error);
        result.errors.push(`Row ${i + 1}: server error`);
        result.skipped++;
      }
    }

    return { status: 200, jsonBody: { success: true, ...result } };
  } catch (error: any) {
    context.error("Error importing food items:", error);
    return { status: 500, jsonBody: { error: "Internal server error" } };
  }
}

app.http("importFoodItems", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: importFoodItems,
});

/**
 * In-memory stand-in for ../tableClient.js used by the vitest suites:
 *   vi.mock("../tableClient.js", async () => await import("../testUtils/mockTableClient.js"));
 * Supports the OData filter shapes the handlers actually use
 * (`Field eq 'string'` / `Field eq true|false` joined with `and`).
 * This directory is excluded from the tsc build.
 */

type Entity = Record<string, any>;

const tables = new Map<string, Map<string, Entity>>();
let rowKeyCounter = 1;

function keyOf(pk: string, rk: string): string {
  return `${pk}|${rk}`;
}

function getTable(name: string): Map<string, Entity> {
  let table = tables.get(name);
  if (!table) {
    table = new Map();
    tables.set(name, table);
  }
  return table;
}

function notFound(): Error {
  return Object.assign(new Error("ResourceNotFound"), { statusCode: 404 });
}

function matchesFilter(entity: Entity, filter?: string): boolean {
  if (!filter) return true;
  return filter.split(" and ").every((clause) => {
    const match = clause.trim().match(/^(\w+) eq (?:'((?:[^']|'')*)'|(true|false))$/);
    if (!match) throw new Error(`Unsupported filter clause in mock: ${clause}`);
    const [, field, str, bool] = match;
    const expected = str !== undefined ? str.replace(/''/g, "'") : bool === "true";
    const actual =
      field === "PartitionKey"
        ? entity.partitionKey
        : field === "RowKey"
          ? entity.rowKey
          : entity[field];
    return actual === expected;
  });
}

export function getTableClient(name: string) {
  return {
    async getEntity(partitionKey: string, rowKey: string): Promise<Entity> {
      const entity = getTable(name).get(keyOf(partitionKey, rowKey));
      if (!entity) throw notFound();
      return { ...entity };
    },
    async createEntity(entity: Entity): Promise<void> {
      getTable(name).set(keyOf(entity.partitionKey, entity.rowKey), { ...entity });
    },
    async updateEntity(entity: Entity, _mode?: string): Promise<void> {
      const key = keyOf(entity.partitionKey, entity.rowKey);
      const existing = getTable(name).get(key);
      if (!existing) throw notFound();
      getTable(name).set(key, { ...existing, ...entity });
    },
    async deleteEntity(partitionKey: string, rowKey: string): Promise<void> {
      const key = keyOf(partitionKey, rowKey);
      if (!getTable(name).has(key)) throw notFound();
      getTable(name).delete(key);
    },
    listEntities(options?: { queryOptions?: { filter?: string } }) {
      const filter = options?.queryOptions?.filter;
      const entities = [...getTable(name).values()].filter((e) => matchesFilter(e, filter));
      return {
        [Symbol.asyncIterator]: async function* () {
          for (const entity of entities) {
            yield { ...entity };
          }
        },
      };
    },
    async submitTransaction(actions: Array<[string, Entity]>): Promise<void> {
      if (actions.length > 100) {
        throw new Error("Transaction exceeds the 100 operation limit");
      }
      for (const [action, entity] of actions) {
        if (action === "delete") {
          getTable(name).delete(keyOf(entity.partitionKey, entity.rowKey));
        }
      }
    },
  };
}

export async function ensureTableExists(): Promise<void> {}

export function generateRowKey(): string {
  return `test-rowkey-${rowKeyCounter++}`;
}

// ── Test helpers (not part of the real tableClient API) ──

export function __seed(table: string, entities: Entity[]): void {
  for (const entity of entities) {
    getTable(table).set(keyOf(entity.partitionKey, entity.rowKey), { ...entity });
  }
}

export function __get(table: string, partitionKey: string, rowKey: string): Entity | undefined {
  return getTable(table).get(keyOf(partitionKey, rowKey));
}

export function __all(table: string): Entity[] {
  return [...getTable(table).values()];
}

export function __reset(): void {
  tables.clear();
  rowKeyCounter = 1;
}

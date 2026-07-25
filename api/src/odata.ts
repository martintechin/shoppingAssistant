/**
 * Escape a value for safe interpolation into an Azure Table Storage OData
 * filter string. Single quotes are the string delimiter in OData, so they must
 * be doubled to be treated as literals. This is defense-in-depth: callers should
 * still prefer values that are not directly client-controlled.
 */
export function escapeOData(value: string): string {
  return value.replace(/'/g, "''");
}

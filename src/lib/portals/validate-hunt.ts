import { portalConfigSchema } from "./format";
import hunt from "./hunt.json";
const r = portalConfigSchema.safeParse(hunt);
if (r.success) {
  console.log("VALID — id:", r.data.id, "| fields:", r.data.fields.map(f => f.name).join(","));
} else {
  console.log("INVALID:", JSON.stringify(r.error?.issues ?? r, null, 1).slice(0, 900));
}

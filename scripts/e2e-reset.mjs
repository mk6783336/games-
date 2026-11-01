import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.env.PGLITE_DIR ?? ".data/e2e");
fs.rmSync(dir, { recursive: true, force: true });
console.log(`[e2e] cleared ${path.relative(process.cwd(), dir)}`);

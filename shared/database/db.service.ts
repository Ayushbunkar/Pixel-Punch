import { promises as fs } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data", "submissions");
const SAFE_ID_REGEX = /^[a-zA-Z0-9-]{10,50}$/;

// Detect if we're on a read-only filesystem (e.g. Vercel serverless)
let isReadOnly: boolean | null = null;
async function checkWritable(): Promise<boolean> {
  if (isReadOnly !== null) return !isReadOnly;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const testFile = join(DATA_DIR, ".write-test");
    await fs.writeFile(testFile, "test");
    await fs.unlink(testFile);
    isReadOnly = false;
    return true;
  } catch {
    isReadOnly = true;
    return false;
  }
}

/**
 * Saves submission data to a JSON file.
 * Silently skips if the filesystem is read-only (e.g. Vercel).
 */
export async function saveSubmission(id: string, data: any): Promise<void> {
  if (!SAFE_ID_REGEX.test(id)) {
    throw new Error("Invalid database ID format.");
  }
  const writable = await checkWritable();
  if (!writable) {
    // Read-only filesystem (Vercel serverless) — skip file write silently
    return;
  }
  const filePath = join(DATA_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Retrieves submission data from a JSON file.
 * Returns null if filesystem is read-only or file doesn't exist.
 */
export async function getSubmission(id: string): Promise<any | null> {
  if (!SAFE_ID_REGEX.test(id)) {
    console.warn(`[db.service] Blocked path traversal attempt with ID: ${id}`);
    return null;
  }
  if (isReadOnly) return null; // Skip file read on read-only filesystem

  const filePath = join(DATA_DIR, `${id}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

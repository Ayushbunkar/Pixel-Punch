import { promises as fs } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data", "submissions");
const SAFE_ID_REGEX = /^[a-zA-Z0-9-]{10,50}$/;

// Ensure the data directory exists
async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    // Directory already exists or cannot be created
  }
}

/**
 * Saves submission data to a JSON file.
 */
export async function saveSubmission(id: string, data: any): Promise<void> {
  if (!SAFE_ID_REGEX.test(id)) {
    throw new Error("Invalid database ID format.");
  }
  await ensureDir();
  const filePath = join(DATA_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Retrieves submission data from a JSON file.
 */
export async function getSubmission(id: string): Promise<any | null> {
  if (!SAFE_ID_REGEX.test(id)) {
    console.warn(`[db.service] Blocked path traversal attempt with ID: ${id}`);
    return null;
  }
  await ensureDir();
  const filePath = join(DATA_DIR, `${id}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

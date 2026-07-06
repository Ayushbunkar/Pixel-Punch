import { parseOffice } from "officeparser";
import { getStorageService } from "../services/storage/storage-provider.service";

interface DocumentInput {
  name: string;
  type: string;
  path: string;
}

/**
 * Extracts plain text from an uploaded document based on its extension.
 * Supports .txt, .md, .pdf, .doc, and .docx files.
 */
export async function extractTextFromDoc(doc: DocumentInput): Promise<string> {
  const ext = doc.name.split(".").pop()?.toLowerCase();
  const storageService = getStorageService();
  let buffer: Buffer;

  try {
    buffer = await storageService.downloadFile(doc.path);
  } catch (err) {
    console.error(`[extractor] Failed to download file ${doc.path}:`, err);
    throw new Error(`Failed to download file: ${doc.name}`);
  }

  // For plain text formats (TXT, MD) we can decode directly
  if (ext === "txt" || ext === "md") {
    try {
      return buffer.toString("utf-8");
    } catch (err) {
      console.error(`[extractor] Failed to decode text/md file ${doc.name}:`, err);
      throw new Error(`Failed to decode text file: ${doc.name}`);
    }
  }

  // For complex formats (PDF, DOC, DOCX) we run officeparser
  try {
    const ast = await parseOffice(buffer);
    return ast.toText() || "";
  } catch (err) {
    console.error(`[extractor] officeparser failed on ${doc.name}:`, err);
    throw new Error(`Failed to parse binary document: ${doc.name}. Make sure it is a valid PDF or Word document.`);
  }
}

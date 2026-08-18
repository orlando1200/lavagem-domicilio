export interface StoredFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

export interface StorageAdapter {
  save(file: StoredFileInput): Promise<{ url: string }>;
}

export const STORAGE_ADAPTER = Symbol('STORAGE_ADAPTER');

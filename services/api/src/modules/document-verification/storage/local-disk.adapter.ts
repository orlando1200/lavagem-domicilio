import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { StorageAdapter, StoredFileInput } from './storage.interface';

const UPLOADS_DIR = join(process.cwd(), 'uploads', 'documents');

/**
 * Armazenamento em disco local — modo simulado. Em producao real isso
 * deveria ser S3 (as env vars `AWS_*`/`S3_BUCKET_NAME` ja existem
 * reservadas em `.env.example`, nunca lidas hoje). Trocar por um adapter
 * real de S3 e so implementar essa mesma interface, sem tocar no
 * controller/service que a consome.
 */
@Injectable()
export class LocalDiskAdapter implements StorageAdapter {
  private readonly logger = new Logger(LocalDiskAdapter.name);

  async save(file: StoredFileInput): Promise<{ url: string }> {
    if (!existsSync(UPLOADS_DIR)) {
      mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const fileName = `${randomUUID()}${extname(file.originalName)}`;
    await writeFile(join(UPLOADS_DIR, fileName), file.buffer);

    this.logger.log(`[storage mock] Arquivo salvo em disco local: ${fileName}`);

    return { url: `/uploads/documents/${fileName}` };
  }
}

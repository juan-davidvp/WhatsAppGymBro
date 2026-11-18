import { crc32, deflateRawSync } from 'node:zlib';

/**
 * ZIP mínimo para `/exportar` (T-090): archivos comprimidos con DEFLATE usando
 * solo `node:zlib`, sin dependencias nuevas (constitución XI).
 */

export interface ZipEntry {
  readonly name: string;
  readonly content: Uint8Array;
}

const LOCAL_SIGNATURE = 0x04034b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const END_SIGNATURE = 0x06054b50;
const LOCAL_HEADER_SIZE = 30;
const CENTRAL_HEADER_SIZE = 46;
const END_RECORD_SIZE = 22;
const ZIP_VERSION = 20;
const UTF8_NAMES_FLAG = 0x0800;
const DEFLATE_METHOD = 8;
const DOS_EPOCH_YEAR = 1980;

/** Fecha y hora en el formato de MS-DOS que usa ZIP. */
function dosDateTime(at: Date): { date: number; time: number } {
  const year = Math.max(at.getUTCFullYear(), DOS_EPOCH_YEAR) - DOS_EPOCH_YEAR;
  return {
    date: (year << 9) | ((at.getUTCMonth() + 1) << 5) | at.getUTCDate(),
    time: (at.getUTCHours() << 11) | (at.getUTCMinutes() << 5) | (at.getUTCSeconds() >> 1),
  };
}

export function createZip(entries: readonly ZipEntry[], at: Date): Uint8Array {
  const { date, time } = dosDateTime(at);
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const data = deflateRawSync(entry.content);
    const checksum = crc32(entry.content);

    const local = Buffer.alloc(LOCAL_HEADER_SIZE);
    local.writeUInt32LE(LOCAL_SIGNATURE, 0);
    local.writeUInt16LE(ZIP_VERSION, 4);
    local.writeUInt16LE(UTF8_NAMES_FLAG, 6);
    local.writeUInt16LE(DEFLATE_METHOD, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(entry.content.length, 22);
    local.writeUInt16LE(name.length, 26);
    parts.push(local, name, data);

    const header = Buffer.alloc(CENTRAL_HEADER_SIZE);
    header.writeUInt32LE(CENTRAL_SIGNATURE, 0);
    header.writeUInt16LE(ZIP_VERSION, 4);
    header.writeUInt16LE(ZIP_VERSION, 6);
    header.writeUInt16LE(UTF8_NAMES_FLAG, 8);
    header.writeUInt16LE(DEFLATE_METHOD, 10);
    header.writeUInt16LE(time, 12);
    header.writeUInt16LE(date, 14);
    header.writeUInt32LE(checksum, 16);
    header.writeUInt32LE(data.length, 20);
    header.writeUInt32LE(entry.content.length, 24);
    header.writeUInt16LE(name.length, 28);
    header.writeUInt32LE(offset, 42);
    central.push(header, name);

    offset += local.length + name.length + data.length;
  }

  const directory = Buffer.concat(central);
  const end = Buffer.alloc(END_RECORD_SIZE);
  end.writeUInt32LE(END_SIGNATURE, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, directory, end]);
}

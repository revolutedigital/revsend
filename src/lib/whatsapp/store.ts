import { WASocket } from "@whiskeysockets/baileys";

// Store global para manter as conexões ativas
const globalForWhatsApp = globalThis as unknown as {
  whatsappConnections: Map<string, WASocket>;
  qrCodes: Map<string, string>;
};

if (!globalForWhatsApp.whatsappConnections) {
  globalForWhatsApp.whatsappConnections = new Map();
}

if (!globalForWhatsApp.qrCodes) {
  globalForWhatsApp.qrCodes = new Map();
}

export const connections = globalForWhatsApp.whatsappConnections;
export const qrCodes = globalForWhatsApp.qrCodes;

export function getConnection(numberId: string): WASocket | undefined {
  return connections.get(numberId);
}

export function setConnection(numberId: string, socket: WASocket): void {
  connections.set(numberId, socket);
}

export function removeConnection(numberId: string): void {
  connections.delete(numberId);
}

export function getQRCode(numberId: string): string | undefined {
  return qrCodes.get(numberId);
}

export function setQRCode(numberId: string, qr: string): void {
  qrCodes.set(numberId, qr);
}

export function removeQRCode(numberId: string): void {
  qrCodes.delete(numberId);
}

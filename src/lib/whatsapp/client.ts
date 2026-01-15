import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  ConnectionState,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import * as QRCode from "qrcode";
import pino from "pino";
import { db } from "@/lib/db";
import {
  connections,
  setConnection,
  removeConnection,
  setQRCode,
  removeQRCode,
} from "./store";
import path from "path";
import fs from "fs";

const logger = pino({ level: "silent" });

const SESSIONS_DIR = path.join(process.cwd(), "sessions");

// Garantir que a pasta de sessões existe
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

export async function initializeWhatsApp(
  numberId: string,
  userId: string
): Promise<{ socket: WASocket | null; qrCode: string | null }> {
  const sessionPath = path.join(SESSIONS_DIR, numberId);

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const socket = makeWASocket({
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: ["RevSend", "Chrome", "1.0.0"],
    });

    // Gerenciar eventos de conexão
    socket.ev.on("connection.update", async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        // Gerar QR Code como base64
        const qrBase64 = await QRCode.toDataURL(qr);
        setQRCode(numberId, qrBase64);

        // Atualizar status no banco
        await db.whatsappNumber.update({
          where: { id: numberId },
          data: { status: "waiting_qr" },
        });
      }

      if (connection === "close") {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        removeQRCode(numberId);

        if (shouldReconnect) {
          // Tentar reconectar
          await initializeWhatsApp(numberId, userId);
        } else {
          // Usuário deslogou
          removeConnection(numberId);
          await db.whatsappNumber.update({
            where: { id: numberId },
            data: { status: "disconnected" },
          });

          // Limpar arquivos de sessão
          if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true });
          }
        }
      } else if (connection === "open") {
        removeQRCode(numberId);
        setConnection(numberId, socket);

        // Obter informações do número
        const phoneNumber = socket.user?.id?.split(":")[0] || "";

        await db.whatsappNumber.update({
          where: { id: numberId },
          data: {
            status: "connected",
            phoneNumber,
          },
        });
      }
    });

    // Salvar credenciais
    socket.ev.on("creds.update", saveCreds);

    return { socket, qrCode: null };
  } catch (error) {
    console.error("Erro ao inicializar WhatsApp:", error);
    return { socket: null, qrCode: null };
  }
}

export async function disconnectWhatsApp(numberId: string): Promise<void> {
  const socket = connections.get(numberId);

  if (socket) {
    await socket.logout();
    removeConnection(numberId);
  }

  removeQRCode(numberId);

  // Limpar sessão
  const sessionPath = path.join(SESSIONS_DIR, numberId);
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true });
  }

  await db.whatsappNumber.update({
    where: { id: numberId },
    data: { status: "disconnected" },
  });
}

export interface MediaOptions {
  type: "image" | "audio" | "video";
  url: string;
  caption?: string;
}

export async function sendMessage(
  numberId: string,
  phoneNumber: string,
  message: string,
  media?: MediaOptions
): Promise<{ success: boolean; error?: string }> {
  const socket = connections.get(numberId);

  if (!socket) {
    return { success: false, error: "WhatsApp não conectado" };
  }

  try {
    // Formatar número para o formato do WhatsApp
    const jid = `${phoneNumber}@s.whatsapp.net`;

    // Verificar se o número existe no WhatsApp
    const results = await socket.onWhatsApp(jid);
    const result = results?.[0];

    if (!result?.exists) {
      return { success: false, error: "Número não encontrado no WhatsApp" };
    }

    // Enviar mensagem com ou sem mídia
    if (media) {
      const mediaPath = path.join(process.cwd(), "public", media.url);

      if (!fs.existsSync(mediaPath)) {
        return { success: false, error: "Arquivo de mídia não encontrado" };
      }

      const mediaBuffer = fs.readFileSync(mediaPath);

      switch (media.type) {
        case "image":
          await socket.sendMessage(result.jid, {
            image: mediaBuffer,
            caption: media.caption || message,
          });
          break;
        case "audio":
          await socket.sendMessage(result.jid, {
            audio: mediaBuffer,
            mimetype: "audio/mpeg",
            ptt: true, // Enviar como áudio de voz (PTT)
          });
          // Se tiver texto, enviar separadamente
          if (message && message.trim()) {
            await socket.sendMessage(result.jid, { text: message });
          }
          break;
        case "video":
          await socket.sendMessage(result.jid, {
            video: mediaBuffer,
            caption: media.caption || message,
          });
          break;
      }
    } else {
      // Enviar apenas texto
      await socket.sendMessage(result.jid, { text: message });
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return { success: false, error: "Erro ao enviar mensagem" };
  }
}

export function isConnected(numberId: string): boolean {
  return connections.has(numberId);
}

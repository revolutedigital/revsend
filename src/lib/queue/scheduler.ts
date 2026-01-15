import { Queue, Worker, Job } from "bullmq";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";
import { startCampaignDispatch } from "./dispatcher";

interface ScheduleJob {
  campaignId: string;
}

const queueOptions = {
  connection: redis,
};

// Fila de campanhas agendadas
export const scheduleQueue = new Queue<ScheduleJob>("campaign-scheduler", queueOptions);

// Função para agendar uma campanha
export async function scheduleCampaign(
  campaignId: string,
  scheduledAt: Date
): Promise<void> {
  const delay = scheduledAt.getTime() - Date.now();

  if (delay <= 0) {
    // Se a data já passou, iniciar imediatamente
    await startCampaignDispatch(campaignId);
    return;
  }

  // Atualizar status da campanha
  await db.campaign.update({
    where: { id: campaignId },
    data: {
      status: "scheduled",
      scheduledAt,
    },
  });

  // Adicionar job à fila com delay
  await scheduleQueue.add(
    "start-campaign",
    { campaignId },
    {
      delay,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
}

// Função para cancelar agendamento
export async function cancelScheduledCampaign(campaignId: string): Promise<void> {
  // Remover jobs pendentes
  const jobs = await scheduleQueue.getJobs(["delayed", "waiting"]);
  for (const job of jobs) {
    if (job.data.campaignId === campaignId) {
      await job.remove();
    }
  }

  // Atualizar status
  await db.campaign.update({
    where: { id: campaignId },
    data: {
      status: "draft",
      scheduledAt: null,
    },
  });
}

// Worker para processar campanhas agendadas
export function createSchedulerWorker(): Worker<ScheduleJob> {
  return new Worker<ScheduleJob>(
    "campaign-scheduler",
    async (job: Job<ScheduleJob>) => {
      const { campaignId } = job.data;

      // Verificar se a campanha ainda existe e está agendada
      const campaign = await db.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign || campaign.status !== "scheduled") {
        return { skipped: true, reason: "Campaign not found or not scheduled" };
      }

      // Iniciar o disparo
      await startCampaignDispatch(campaignId);

      return { success: true, campaignId };
    },
    queueOptions
  );
}

// Função para verificar campanhas agendadas pendentes (rodar ao iniciar o servidor)
export async function checkPendingScheduledCampaigns(): Promise<void> {
  const pendingCampaigns = await db.campaign.findMany({
    where: {
      status: "scheduled",
      scheduledAt: {
        lte: new Date(), // Campanhas cujo horário já passou
      },
    },
  });

  for (const campaign of pendingCampaigns) {
    console.log(`Iniciando campanha agendada atrasada: ${campaign.name}`);
    await startCampaignDispatch(campaign.id);
  }
}

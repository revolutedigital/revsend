/**
 * Lead Scoring with AI/Sentiment Analysis
 *
 * Scores leads based on:
 * - Reply sentiment (positive/negative/neutral)
 * - Response time (faster = more engaged)
 * - Engagement frequency (number of replies)
 * - Keywords indicating interest or disinterest
 */

import { db } from './db'

// Lead status based on score
export type LeadStatus = 'novo' | 'quente' | 'morno' | 'frio' | 'convertido' | 'perdido'

// Scoring configuration
interface ScoringWeights {
  sentiment: number      // Weight for sentiment analysis (0-1)
  responseTime: number   // Weight for response time (0-1)
  engagement: number     // Weight for engagement frequency (0-1)
  keywords: number       // Weight for keyword analysis (0-1)
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  sentiment: 0.35,
  responseTime: 0.25,
  engagement: 0.25,
  keywords: 0.15,
}

// Positive keywords indicating interest (Portuguese/English)
const POSITIVE_KEYWORDS = [
  // Portuguese
  'interessado', 'interessada', 'quero', 'sim', 'vamos', 'pode',
  'me liga', 'me chama', 'enviar', 'quanto custa', 'preço', 'proposta',
  'agendar', 'reunião', 'conversar', 'mais informações', 'detalhes',
  'gostei', 'ótimo', 'excelente', 'perfeito', 'bom', 'legal',
  // English
  'interested', 'yes', 'want', 'price', 'proposal', 'meeting',
  'schedule', 'more information', 'details', 'great', 'excellent',
]

// Negative keywords indicating disinterest
const NEGATIVE_KEYWORDS = [
  // Portuguese
  'não', 'nunca', 'parar', 'sair', 'cancelar', 'remove',
  'não quero', 'não tenho interesse', 'sem interesse', 'não preciso',
  'outro momento', 'agora não', 'ocupado', 'não posso',
  // English
  'no', 'never', 'stop', 'unsubscribe', 'not interested', 'busy',
]

// Positive emojis
const POSITIVE_EMOJIS = ['😀', '😃', '😄', '😁', '😊', '🙂', '😉', '👍', '👏', '❤', '💪', '🎉', '✅']
const NEGATIVE_EMOJIS = ['😡', '😠', '😤', '😞', '😢', '👎', '❌']

/**
 * Analyze sentiment of a message (simple rule-based)
 * Returns score from -1 (very negative) to 1 (very positive)
 */
export function analyzeSentiment(message: string): number {
  const lower = message.toLowerCase()

  let score = 0
  let positiveCount = 0
  let negativeCount = 0

  for (const keyword of POSITIVE_KEYWORDS) {
    if (lower.includes(keyword.toLowerCase())) {
      positiveCount++
    }
  }

  for (const keyword of NEGATIVE_KEYWORDS) {
    if (lower.includes(keyword.toLowerCase())) {
      negativeCount++
    }
  }

  // Calculate sentiment score
  if (positiveCount > 0 || negativeCount > 0) {
    score = (positiveCount - negativeCount) / (positiveCount + negativeCount)
  }

  // Additional heuristics
  // Exclamation marks often indicate enthusiasm
  const exclamations = (message.match(/!/g) || []).length
  if (exclamations > 0 && positiveCount > negativeCount) {
    score = Math.min(1, score + 0.1 * exclamations)
  }

  // Question marks indicate engagement
  const questions = (message.match(/\?/g) || []).length
  if (questions > 0) {
    score = Math.min(1, score + 0.05 * questions)
  }

  // Emojis indicating sentiment
  let positiveEmojiCount = 0
  let negativeEmojiCount = 0

  for (const emoji of POSITIVE_EMOJIS) {
    if (message.includes(emoji)) positiveEmojiCount++
  }
  for (const emoji of NEGATIVE_EMOJIS) {
    if (message.includes(emoji)) negativeEmojiCount++
  }

  score += 0.1 * (positiveEmojiCount - negativeEmojiCount)

  return Math.max(-1, Math.min(1, score))
}

/**
 * Calculate response time score
 * Faster responses = higher score
 */
function calculateResponseTimeScore(responseTimeMinutes: number): number {
  if (responseTimeMinutes <= 5) return 1      // Immediate response
  if (responseTimeMinutes <= 30) return 0.9   // Very quick
  if (responseTimeMinutes <= 60) return 0.8   // Quick
  if (responseTimeMinutes <= 180) return 0.6  // Moderate
  if (responseTimeMinutes <= 720) return 0.4  // Slow (same day)
  if (responseTimeMinutes <= 1440) return 0.2 // Very slow (next day)
  return 0.1                                   // Extremely slow
}

/**
 * Calculate engagement score based on reply count
 */
function calculateEngagementScore(replyCount: number): number {
  if (replyCount === 0) return 0
  if (replyCount === 1) return 0.3
  if (replyCount <= 3) return 0.5
  if (replyCount <= 5) return 0.7
  if (replyCount <= 10) return 0.9
  return 1 // Very engaged
}

/**
 * Calculate keyword score from a message
 */
function calculateKeywordScore(message: string): number {
  const lower = message.toLowerCase()

  let positiveCount = 0
  let negativeCount = 0

  for (const keyword of POSITIVE_KEYWORDS) {
    if (lower.includes(keyword.toLowerCase())) {
      positiveCount++
    }
  }

  for (const keyword of NEGATIVE_KEYWORDS) {
    if (lower.includes(keyword.toLowerCase())) {
      negativeCount++
    }
  }

  if (positiveCount === 0 && negativeCount === 0) return 0.5 // Neutral

  return positiveCount / (positiveCount + negativeCount)
}

/**
 * Determine lead status based on score
 */
export function getLeadStatus(score: number): LeadStatus {
  if (score >= 80) return 'quente'
  if (score >= 60) return 'morno'
  if (score >= 30) return 'frio'
  return 'novo'
}

/**
 * Score a contact based on their interaction history
 */
export async function scoreContact(
  contactId: string,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): Promise<{ score: number; status: LeadStatus; metadata: Record<string, unknown> }> {
  // Get contact with related data
  const contact = await db.contact.findUnique({
    where: { id: contactId },
    include: {
      list: true,
    },
  })

  if (!contact) {
    throw new Error('Contato não encontrado')
  }

  // Get all replies from this contact
  const replies = await db.reply.findMany({
    where: {
      contactId: contact.id,
      campaign: {
        organizationId: contact.list.organizationId,
      },
    },
    orderBy: { receivedAt: 'asc' },
    include: {
      campaign: {
        select: {
          name: true,
        },
      },
    },
  })

  // Get sent messages to this contact
  const sentMessages = await db.sentMessage.findMany({
    where: {
      contactId,
      status: 'sent',
    },
    orderBy: { sentAt: 'asc' },
  })

  // Calculate scores
  let sentimentScore = 0.5 // Default neutral
  let responseTimeScore = 0
  let engagementScore = 0
  let keywordScore = 0.5 // Default neutral

  if (replies.length > 0) {
    // Average sentiment across all replies
    const sentiments = replies.map((r) => analyzeSentiment(r.content || ''))
    sentimentScore = (sentiments.reduce((a, b) => a + b, 0) / sentiments.length + 1) / 2 // Normalize to 0-1

    // Average response time (from last sent message to first reply)
    if (sentMessages.length > 0 && replies[0].receivedAt) {
      const lastSent = sentMessages[sentMessages.length - 1].sentAt
      if (lastSent) {
        const responseTime = (replies[0].receivedAt.getTime() - lastSent.getTime()) / 60000 // minutes
        responseTimeScore = calculateResponseTimeScore(responseTime)
      }
    }

    // Engagement score
    engagementScore = calculateEngagementScore(replies.length)

    // Keyword score from all replies
    const keywordScores = replies.map((r) => calculateKeywordScore(r.content || ''))
    keywordScore = keywordScores.reduce((a, b) => a + b, 0) / keywordScores.length
  }

  // Calculate weighted final score (0-100)
  const rawScore =
    sentimentScore * weights.sentiment +
    responseTimeScore * weights.responseTime +
    engagementScore * weights.engagement +
    keywordScore * weights.keywords

  // Normalize to 0-100
  const score = Math.round(rawScore * 100)
  const status = getLeadStatus(score)

  const metadata: Record<string, unknown> = {
    sentimentScore: Math.round(sentimentScore * 100),
    responseTimeScore: Math.round(responseTimeScore * 100),
    engagementScore: Math.round(engagementScore * 100),
    keywordScore: Math.round(keywordScore * 100),
    repliesCount: replies.length,
    lastReplyAt: replies.length > 0 ? replies[replies.length - 1].receivedAt?.toISOString() : null,
    weights: {
      sentiment: weights.sentiment,
      responseTime: weights.responseTime,
      engagement: weights.engagement,
      keywords: weights.keywords,
    },
  }

  // Update contact with new score
  await db.contact.update({
    where: { id: contactId },
    data: {
      leadScore: score,
      leadStatus: status,
      scoredAt: new Date(),
      scoreMetadata: JSON.parse(JSON.stringify(metadata)),
    },
  })

  return { score, status, metadata }
}

/**
 * Score a contact based on a single new reply
 * Faster than full scoring, good for real-time updates
 */
export async function scoreFromReply(
  contactId: string,
  replyText: string
): Promise<{ score: number; status: LeadStatus }> {
  const contact = await db.contact.findUnique({
    where: { id: contactId },
  })

  if (!contact) {
    throw new Error('Contato não encontrado')
  }

  // Get current score or default
  let currentScore = contact.leadScore || 50

  // Analyze reply sentiment
  const sentiment = analyzeSentiment(replyText)
  const keywordScore = calculateKeywordScore(replyText)

  // Adjust score based on reply
  // Positive reply: increase score
  // Negative reply: decrease score
  const adjustment = Math.round((sentiment * 10) + ((keywordScore - 0.5) * 10))
  currentScore = Math.max(0, Math.min(100, currentScore + adjustment))

  // Engagement bonus: any reply increases score slightly
  currentScore = Math.min(100, currentScore + 2)

  const status = getLeadStatus(currentScore)

  // Update contact
  await db.contact.update({
    where: { id: contactId },
    data: {
      leadScore: currentScore,
      leadStatus: status,
      scoredAt: new Date(),
    },
  })

  return { score: currentScore, status }
}

/**
 * Get scoring statistics for an organization
 */
export async function getScoringStats(organizationId: string) {
  // Get all contacts with scores
  const contacts = await db.contact.findMany({
    where: {
      list: { organizationId },
      leadScore: { not: null },
    },
    select: {
      leadScore: true,
      leadStatus: true,
    },
  })

  const statusCounts: Record<string, number> = {
    quente: 0,
    morno: 0,
    frio: 0,
    novo: 0,
    convertido: 0,
    perdido: 0,
  }

  let totalScore = 0

  for (const contact of contacts) {
    if (contact.leadStatus && contact.leadStatus in statusCounts) {
      statusCounts[contact.leadStatus]++
    }
    totalScore += contact.leadScore || 0
  }

  return {
    totalScored: contacts.length,
    averageScore: contacts.length > 0 ? Math.round(totalScore / contacts.length) : 0,
    statusDistribution: statusCounts,
  }
}

/**
 * Bulk score all unscored contacts in an organization
 */
export async function bulkScoreContacts(organizationId: string): Promise<number> {
  const unscoredContacts = await db.contact.findMany({
    where: {
      list: { organizationId },
      OR: [
        { leadScore: null },
        { scoredAt: null },
      ],
    },
    select: { id: true },
    take: 100, // Limit to prevent timeout
  })

  for (const contact of unscoredContacts) {
    try {
      await scoreContact(contact.id)
    } catch (error) {
      console.error(`Failed to score contact ${contact.id}:`, error)
    }
  }

  return unscoredContacts.length
}

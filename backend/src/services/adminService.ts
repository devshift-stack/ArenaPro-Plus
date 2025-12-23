// ════════════════════════════════════════════════════════════════════════════
// ADMIN SERVICE
// Modell-Freigabe, User-Management, System-Konfiguration
// ════════════════════════════════════════════════════════════════════════════

import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { cacheDelete } from '../utils/redis.js';

// ════════════════════════════════════════════════════════════════════════════
// ALL AVAILABLE MODELS
// ════════════════════════════════════════════════════════════════════════════

export const ALL_MODELS = [
  // ══════════════════════════════════════════════════════════════════════════
  // FREE TIER - Günstige Modelle für alle User
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: 'Schnell und günstig für einfache Aufgaben',
    capabilities: ['chat', 'summarization', 'simple-tasks'],
    contextWindow: 200000,
    costPerInputToken: 0.00000025,
    costPerOutputToken: 0.00000125,
    tier: 'FREE',
    isDefault: true,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Schnelles und günstiges GPT-4-Modell',
    capabilities: ['reasoning', 'coding', 'vision'],
    contextWindow: 128000,
    costPerInputToken: 0.00000015,
    costPerOutputToken: 0.0000006,
    tier: 'FREE',
    isDefault: true,
  },
  {
    id: 'google/gemini-flash-1.5',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    description: 'Schnelles Google-Modell',
    capabilities: ['chat', 'reasoning', 'fast'],
    contextWindow: 1000000,
    costPerInputToken: 0.000000075,
    costPerOutputToken: 0.0000003,
    tier: 'FREE',
    isDefault: true,
  },
  {
    id: 'mistralai/mistral-small-24b-instruct-2501',
    name: 'Mistral Small',
    provider: 'Mistral',
    description: 'Effizientes Mistral-Modell',
    capabilities: ['chat', 'reasoning'],
    contextWindow: 32000,
    costPerInputToken: 0.0000001,
    costPerOutputToken: 0.0000003,
    tier: 'FREE',
    isDefault: true,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // STANDARD TIER - Muss vom Admin freigeschaltet werden
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Bestes Preis-Leistungs-Verhältnis von Anthropic',
    capabilities: ['reasoning', 'coding', 'analysis'],
    contextWindow: 200000,
    costPerInputToken: 0.000003,
    costPerOutputToken: 0.000015,
    tier: 'STANDARD',
    isDefault: false,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Schnelles und günstiges GPT-4-Modell',
    capabilities: ['reasoning', 'coding', 'vision'],
    contextWindow: 128000,
    costPerInputToken: 0.00000015,
    costPerOutputToken: 0.0000006,
    tier: 'STANDARD',
    isDefault: false,
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    description: 'Starkes Open-Source Modell',
    capabilities: ['reasoning', 'coding'],
    contextWindow: 131072,
    costPerInputToken: 0.00000052,
    costPerOutputToken: 0.00000075,
    tier: 'STANDARD',
    isDefault: false,
  },
  {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral',
    description: 'Europäisches Frontier-Modell',
    capabilities: ['reasoning', 'multilingual'],
    contextWindow: 128000,
    costPerInputToken: 0.000002,
    costPerOutputToken: 0.000006,
    tier: 'STANDARD',
    isDefault: false,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PREMIUM TIER - Nur für Premium-User nach Admin-Freigabe
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    description: 'Leistungsstärkstes Claude-Modell',
    capabilities: ['reasoning', 'coding', 'analysis', 'creative'],
    contextWindow: 200000,
    costPerInputToken: 0.000015,
    costPerOutputToken: 0.000075,
    tier: 'PREMIUM',
    isDefault: false,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Leistungsstarkes OpenAI-Modell',
    capabilities: ['reasoning', 'coding', 'vision', 'analysis'],
    contextWindow: 128000,
    costPerInputToken: 0.0000025,
    costPerOutputToken: 0.00001,
    tier: 'PREMIUM',
    isDefault: false,
  },
  {
    id: 'meta-llama/llama-3.1-405b-instruct',
    name: 'Llama 3.1 405B',
    provider: 'Meta',
    description: 'Größtes Open-Source Modell',
    capabilities: ['reasoning', 'coding', 'analysis'],
    contextWindow: 131072,
    costPerInputToken: 0.0000027,
    costPerOutputToken: 0.0000027,
    tier: 'PREMIUM',
    isDefault: false,
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    description: 'Großes Kontextfenster, multimodal',
    capabilities: ['reasoning', 'analysis', 'long-context'],
    contextWindow: 2000000,
    costPerInputToken: 0.00000125,
    costPerOutputToken: 0.000005,
    tier: 'PREMIUM',
    isDefault: false,
  },
];

// ════════════════════════════════════════════════════════════════════════════
// ADMIN SERVICE CLASS
// ════════════════════════════════════════════════════════════════════════════

export class AdminService {
  // ══════════════════════════════════════════════════════════════════════════
  // GET AVAILABLE MODELS FOR USER
  // ══════════════════════════════════════════════════════════════════════════

  static async getAvailableModelsForUser(userId: string): Promise<typeof ALL_MODELS> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        modelAccess: true,
      },
    });

    if (!user) {
      // Nur Free-Tier Modelle
      return ALL_MODELS.filter(m => m.tier === 'FREE');
    }

    // Admin hat Zugriff auf alle Modelle
    if (user.role === 'ADMIN') {
      return ALL_MODELS;
    }

    // Freigegebene Modell-IDs
    const allowedModelIds = user.modelAccess?.allowedModels || [];
    const userTier = user.modelAccess?.tier || 'FREE';

    return ALL_MODELS.filter(model => {
      // Free-Tier immer verfügbar
      if (model.tier === 'FREE') return true;
      
      // Explizit freigegebene Modelle
      if (allowedModelIds.includes(model.id)) return true;
      
      // Tier-basierte Freigabe
      if (userTier === 'PREMIUM') return true;
      if (userTier === 'STANDARD' && model.tier !== 'PREMIUM') return true;
      
      return false;
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GRANT MODEL ACCESS
  // ══════════════════════════════════════════════════════════════════════════

  static async grantModelAccess(
    adminId: string,
    targetUserId: string,
    modelIds: string[]
  ): Promise<void> {
    // Verify admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (admin?.role !== 'ADMIN') {
      throw new Error('Nur Admins können Modelle freigeben');
    }

    // Update oder erstelle ModelAccess
    await prisma.modelAccess.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        allowedModels: modelIds,
        grantedBy: adminId,
        grantedAt: new Date(),
      },
      update: {
        allowedModels: modelIds,
        grantedBy: adminId,
        grantedAt: new Date(),
      },
    });

    logger.info(`Admin ${adminId} granted model access to user ${targetUserId}: ${modelIds.join(', ')}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SET USER TIER
  // ══════════════════════════════════════════════════════════════════════════

  static async setUserTier(
    adminId: string,
    targetUserId: string,
    tier: 'FREE' | 'STANDARD' | 'PREMIUM'
  ): Promise<void> {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (admin?.role !== 'ADMIN') {
      throw new Error('Nur Admins können Tiers setzen');
    }

    await prisma.modelAccess.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        tier,
        grantedBy: adminId,
        grantedAt: new Date(),
      },
      update: {
        tier,
        grantedBy: adminId,
        grantedAt: new Date(),
      },
    });

    logger.info(`Admin ${adminId} set tier ${tier} for user ${targetUserId}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // REVOKE MODEL ACCESS
  // ══════════════════════════════════════════════════════════════════════════

  static async revokeModelAccess(
    adminId: string,
    targetUserId: string,
    modelIds: string[]
  ): Promise<void> {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (admin?.role !== 'ADMIN') {
      throw new Error('Nur Admins können Modell-Zugriff entziehen');
    }

    const access = await prisma.modelAccess.findUnique({
      where: { userId: targetUserId },
    });

    if (access) {
      const newAllowedModels = (access.allowedModels as string[]).filter(
        id => !modelIds.includes(id)
      );

      await prisma.modelAccess.update({
        where: { userId: targetUserId },
        data: {
          allowedModels: newAllowedModels,
        },
      });
    }

    logger.info(`Admin ${adminId} revoked model access from user ${targetUserId}: ${modelIds.join(', ')}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CREATE ADMIN USER
  // ══════════════════════════════════════════════════════════════════════════

  static async createAdminUser(
    email: string,
    password: string,
    name: string,
    createdByAdminId?: string
  ): Promise<{ id: string; email: string }> {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
      },
    });

    // Admin hat automatisch Zugriff auf alle Modelle
    await prisma.modelAccess.create({
      data: {
        userId: admin.id,
        tier: 'PREMIUM',
        allowedModels: ALL_MODELS.map(m => m.id),
        grantedBy: createdByAdminId || admin.id,
        grantedAt: new Date(),
      },
    });

    logger.info(`Admin user created: ${email}`);

    return { id: admin.id, email: admin.email };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PROMOTE USER TO ADMIN
  // ══════════════════════════════════════════════════════════════════════════

  static async promoteToAdmin(
    adminId: string,
    targetUserId: string
  ): Promise<void> {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (admin?.role !== 'ADMIN') {
      throw new Error('Nur Admins können andere User befördern');
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: 'ADMIN' },
    });

    // Volle Modell-Rechte
    await prisma.modelAccess.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        tier: 'PREMIUM',
        allowedModels: ALL_MODELS.map(m => m.id),
        grantedBy: adminId,
        grantedAt: new Date(),
      },
      update: {
        tier: 'PREMIUM',
        allowedModels: ALL_MODELS.map(m => m.id),
        grantedBy: adminId,
        grantedAt: new Date(),
      },
    });

    logger.info(`User ${targetUserId} promoted to admin by ${adminId}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GET ALL USERS WITH ACCESS INFO
  // ══════════════════════════════════════════════════════════════════════════

  static async getAllUsersWithAccess(): Promise<any[]> {
    const users = await prisma.user.findMany({
      include: {
        modelAccess: true,
        _count: {
          select: {
            chats: true,
            messages: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tier: user.modelAccess?.tier || 'FREE',
      allowedModels: user.modelAccess?.allowedModels || [],
      chatCount: user._count.chats,
      messageCount: user._count.messages,
      createdAt: user.createdAt,
    }));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // APPROVE PROPOSED RULE
  // ══════════════════════════════════════════════════════════════════════════

  static async approveRule(
    adminId: string,
    ruleId: string
  ): Promise<void> {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (admin?.role !== 'ADMIN') {
      throw new Error('Nur Admins können Regeln genehmigen');
    }

    const proposedRule = await prisma.proposedRule.findUnique({
      where: { id: ruleId },
    });

    if (!proposedRule) {
      throw new Error('Regel nicht gefunden');
    }

    // Erstelle aktive Regel
    await prisma.activeRule.create({
      data: {
        title: proposedRule.title,
        description: proposedRule.description,
        instruction: proposedRule.instruction,
        category: proposedRule.category,
        severity: proposedRule.severity,
        examples: proposedRule.examples as any,
        approvedById: adminId,
        isActive: true,
      },
    });

    // Update Status
    await prisma.proposedRule.update({
      where: { id: ruleId },
      data: { status: 'APPROVED' },
    });

    // Invalidiere Cache
    await cacheDelete('active_rules_prompt');

    logger.info(`Rule ${ruleId} approved by admin ${adminId}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // REJECT PROPOSED RULE
  // ══════════════════════════════════════════════════════════════════════════

  static async rejectRule(
    adminId: string,
    ruleId: string,
    reason: string
  ): Promise<void> {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (admin?.role !== 'ADMIN') {
      throw new Error('Nur Admins können Regeln ablehnen');
    }

    await prisma.proposedRule.update({
      where: { id: ruleId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });

    logger.info(`Rule ${ruleId} rejected by admin ${adminId}: ${reason}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GET SYSTEM STATISTICS
  // ══════════════════════════════════════════════════════════════════════════

  static async getSystemStats(): Promise<{
    totalUsers: number;
    adminCount: number;
    totalChats: number;
    totalMessages: number;
    activeRules: number;
    pendingRules: number;
    modelUsage: { modelId: string; count: number }[];
    usersByTier: { tier: string; count: number }[];
  }> {
    const [
      totalUsers,
      adminCount,
      totalChats,
      totalMessages,
      activeRules,
      pendingRules,
      modelUsage,
      usersByTier,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.chat.count(),
      prisma.message.count(),
      prisma.activeRule.count({ where: { isActive: true } }),
      prisma.proposedRule.count({ where: { status: 'PENDING' } }),
      prisma.message.groupBy({
        by: ['modelId'],
        _count: true,
        where: { modelId: { not: null } },
        orderBy: { _count: { modelId: 'desc' } },
        take: 10,
      }),
      prisma.modelAccess.groupBy({
        by: ['tier'],
        _count: true,
      }),
    ]);

    return {
      totalUsers,
      adminCount,
      totalChats,
      totalMessages,
      activeRules,
      pendingRules,
      modelUsage: modelUsage.map(m => ({
        modelId: m.modelId || 'unknown',
        count: m._count,
      })),
      usersByTier: usersByTier.map(t => ({
        tier: t.tier,
        count: t._count,
      })),
    };
  }
}

export default AdminService;

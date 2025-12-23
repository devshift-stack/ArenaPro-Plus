// ════════════════════════════════════════════════════════════════════════════
// SETUP SCRIPT - Erstellt den ersten Admin-User
// Ausführen mit: npx tsx src/scripts/setup-admin.ts
// ════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const prisma = new PrismaClient();

// ALL MODELS (gleich wie in adminService.ts)
const ALL_MODEL_IDS = [
  'anthropic/claude-3-haiku',
  'google/gemini-pro-1.5',
  'deepseek/deepseek-coder',
  'mistral/mistral-7b',
  'anthropic/claude-3-sonnet',
  'openai/gpt-4o',
  'meta/llama-3.1-70b',
  'mistral/mistral-large',
  'anthropic/claude-3-opus',
  'openai/gpt-4-turbo',
  'meta/llama-3.1-405b',
  'anthropic/claude-3.5-sonnet',
];

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('   AI ARENA - Admin Setup');
  console.log('════════════════════════════════════════════════════════════════\n');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin) {
    console.log('⚠️  Ein Admin existiert bereits:');
    console.log(`   Email: ${existingAdmin.email}`);
    console.log(`   Name: ${existingAdmin.name}`);
    
    const proceed = await prompt('\nNeuen Admin erstellen? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log('Abgebrochen.');
      process.exit(0);
    }
  }

  // Get admin details
  console.log('\nBitte gib die Admin-Daten ein:\n');
  
  const email = await prompt('Email: ');
  const name = await prompt('Name: ');
  const password = await prompt('Passwort (min. 8 Zeichen): ');

  if (password.length < 8) {
    console.error('❌ Passwort muss mindestens 8 Zeichen haben.');
    process.exit(1);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create admin
  const admin = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // Grant full model access
  await prisma.modelAccess.create({
    data: {
      userId: admin.id,
      tier: 'PREMIUM',
      allowedModels: ALL_MODEL_IDS,
      grantedBy: admin.id,
    },
  });

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('   ✅ Admin erfolgreich erstellt!');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`\n   ID:    ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Name:  ${admin.name}`);
  console.log(`   Rolle: ADMIN`);
  console.log(`   Tier:  PREMIUM (alle Modelle freigeschaltet)`);
  console.log('\n   Du kannst dich jetzt einloggen!');
  console.log('════════════════════════════════════════════════════════════════\n');
}

main()
  .catch((error) => {
    console.error('❌ Fehler:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

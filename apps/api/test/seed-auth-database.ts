import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const target = process.env.AUTH_TEST_DATABASE_URL;
if (!target) throw new Error('AUTH_TEST_DATABASE_URL is required');
const url = new URL(target);
if (url.hostname !== '127.0.0.1' || !url.pathname.endsWith('_auth_test'))
  throw new Error('Refusing to seed a non-local or non-test database');
process.env.DATABASE_URL = target;
const db = new PrismaClient();

async function seed() {
  const id = 424242;
  const existing = await db.user.findUnique({ where: { id } });
  if (existing && existing.email !== 'legacy@gmail.com')
    throw new Error('The reserved test user ID is already occupied');
  const hash = await bcrypt.hash('legacy-only-test-password', 10);
  await db.user.upsert({
    where: { id },
    update: {},
    create: {
      id,
      email: 'legacy@gmail.com',
      hash,
      hashRt: 'legacy-unused-refresh-digest',
    },
  });
  await db.category.upsert({
    where: { id },
    update: {},
    create: { id, name: 'Legacy fixture', type: 'EXPENSE' },
  });
  await db.account.upsert({
    where: { id },
    update: {},
    create: { id, name: 'Legacy account', userId: id, balance: '123.45' },
  });
  await db.account.upsert({
    where: { id: id + 1 },
    update: {},
    create: {
      id: id + 1,
      name: 'Legacy cash',
      userId: id,
      type: 'CASH',
      balance: '25',
    },
  });
  await db.transaction.upsert({
    where: { id },
    update: {},
    create: {
      id,
      type: 'EXPENSE',
      amount: 7.25,
      userId: id,
      accountId: id,
      categoryId: id,
    },
  });
  await db.transfer.upsert({
    where: { id },
    update: {},
    create: {
      id,
      userId: id,
      fromAccountId: id,
      toAccountId: id + 1,
      debitAmount: '10',
      creditAmount: '10',
    },
  });
  await db.upcomingPayment.upsert({
    where: { id },
    update: {},
    create: {
      id,
      userId: id,
      categoryId: id,
      title: 'Legacy rent',
      amount: '15',
      currency: 'NZD',
      frequency: 'MONTHLY',
      nextDueDate: new Date(),
    },
  });
  console.log(
    'Disposable auth database fixtures are ready; existing fixture rows were not overwritten.',
  );
}
async function main(): Promise<void> {
  try {
    await seed();
  } catch {
    console.error(
      'Auth test fixture setup failed. Check the disposable database and reserved fixture IDs.',
    );
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}
void main();

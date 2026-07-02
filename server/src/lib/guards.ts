import { prisma } from './prisma';
import { HttpError } from './http';
import { messages } from './messages';

/** 400 unless the category exists and belongs to the user. */
export async function assertCategory(userId: string, categoryId: string): Promise<void> {
  const cat = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!cat) throw new HttpError(400, 'BAD_CATEGORY', messages.transactions.unknownCategory);
}

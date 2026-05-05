import { Prisma, PrismaClient } from "../generated/prisma";

export type TPrismaClient = PrismaClient | Prisma.TransactionClient;

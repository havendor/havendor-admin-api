import { PrismaPg } from "@prisma/adapter-pg";

import { appConfig } from "../config/index.js";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = appConfig.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };

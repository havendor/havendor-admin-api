import { PrismaPg } from "@prisma/adapter-pg";

import { APP_CONFIG } from "../config/index.js";
import { PrismaClient } from "../generated/prisma/index.js";

const connectionString = APP_CONFIG.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };

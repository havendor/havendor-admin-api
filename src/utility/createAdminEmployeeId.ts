import { TPrismaClient } from "../type";

export const createAdminEmployeeId = async (prisma: TPrismaClient) => {
  const lastAdmin = await prisma.admin.findFirst({
    orderBy: {
      employee_id: "desc",
    },
    select: {
      employee_id: true,
    },
  });

  if (!lastAdmin?.employee_id) {
    return "0001";
  }

  const nextId = parseInt(lastAdmin.employee_id) + 1;
  const padding = 4 - String(nextId).length;

  return "0".repeat(padding) + nextId;
};

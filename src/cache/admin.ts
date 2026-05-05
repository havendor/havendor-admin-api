import { RedisClient } from "@havendor/server-core";
import { TAdminCache } from "../modules/admin/admin/admin.type";

const getAdmin = async (id: string): Promise<TAdminCache | null> => {
  const user = await RedisClient.get<TAdminCache>(`admin:${id}`);
  if (!user) return null;
  return user;
};

const setAdmin = async (id: string, user: TAdminCache) => {
  await RedisClient.setEx(`admin:${id}`, 10 * 60, user);
};

const deleteAdmin = async (id: string) => {
  await RedisClient.del(`admin:${id}`);
};

export const cacheAdmin = {
  getAdmin,
  setAdmin,
  deleteAdmin,
};

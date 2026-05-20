/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pagination } from "@havendor/server-core";
import { TMeta, TPaginationQuery } from "@havendor/types";
import { Prisma } from "../generated/prisma/client";

type TDBQueryWithPagination = {
  model: Prisma.SelectSubset<any, any>;
  query: TPaginationQuery;
  select: any;
  where: any;
  allowedSorts?: string[];
};

export const dbQueryWithPagination = async <Result>({
  model,
  query,
  select,
  where,
  allowedSorts,
}: TDBQueryWithPagination): Promise<{ data: Result[]; meta: TMeta }> => {
  const { limit, skip, sort_by, sort_order, page } = Pagination(
    query,
    allowedSorts || Object.keys(select),
  );

  const filters = {
    ...where,
  };

  const [data, total_records] = await Promise.all([
    model.findMany({
      where: filters,
      orderBy: {
        [sort_by]: sort_order,
      },
      skip,
      take: limit,
      select,
    }),

    model.count({
      where: filters,
    }),
  ]);

  const total_pages = Math.ceil(total_records / limit);

  const meta: TMeta = {
    current_page: page,
    per_page: limit,
    total_pages,
    total_records,
    has_previous: page > 1,
    has_next: page < total_pages,
    sort_by,
    sort_order,
  };

  return {
    data,
    meta,
  };
};

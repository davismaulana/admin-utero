"use client";
import api from "@/lib/api";
import type { ListResponse } from "./users";

export type MerchantRow = {
  id: string;
  userId: string;
  fullname: string;
  companyName: string;
  ktp: string;
  npwp: string;
  ktpAddress: string;
  officeAddress: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    email: string;
    phone?: string | null;
    level: string;
    profilePicture?: string | null;
  } | null;
  billboards?: any[];
};

export async function listMerchants(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  includeUser?: boolean;
  includeBillboards?: boolean;
  sortBy?: "createdAt" | "updatedAt" | "companyName" | "fullname";
  sortDir?: "asc" | "desc";
}) {
  const res = await api.get<ListResponse<MerchantRow>>("/merchant", {
    params: {
      ...params,
      includeUser: params.includeUser ? "true" : "false",
      includeBillboards: params.includeBillboards ? "true" : "false",
    },
  });
  return res.data;
}

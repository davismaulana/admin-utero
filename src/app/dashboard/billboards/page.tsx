"use client";

import * as React from "react";
import { deleteBillboard, listBillboards, type BillboardRow } from "@/services/billboards";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Avatar, Box, Button, Chip, IconButton, Snackbar, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridSortModel } from "@mui/x-data-grid";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { BillboardDetailDialog } from "@/components/dashboard/billboards/billboard-detail-dialog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
const fmtDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });
const currencyFmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const getVFValue = (p: unknown) => (p && typeof p === "object" && "value" in (p as any) ? (p as any).value : p);

function resolveImgUrl(u?: string) {
  if (!u) return undefined;
  if (/^(https?:|blob:|data:)/i.test(u)) return u;
  try { return new URL(u.replace(/^\/+/, ""), API_BASE + "/").href; } catch { return undefined; }
}

export default function BillboardsPage() {
  const [rows, setRows] = React.useState<BillboardRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [rowCount, setRowCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [sortModel, setSortModel] = React.useState<GridSortModel>([{ field: "createdAt", sort: "desc" }]);
  const [toast, setToast] = React.useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<BillboardRow | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    const res = await listBillboards({
      page: page + 1,
      pageSize,
      search: search || undefined,
    });
    setRows(res.data);
    const total = res.meta?.total ?? res.data.length;
    setRowCount(total);
    setTotalCount(total);
    setLoading(false);
  }, [page, pageSize, search]);

  React.useEffect(() => { fetchData().catch(console.error); }, [fetchData]);

  const columns: GridColDef<BillboardRow>[] = [
    {
      field: "image",
      headerName: "Image",
      width: 90,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => {
        const src = resolveImgUrl(row.image?.[0]?.url);
        const letter = (row.location?.[0] ?? "B").toUpperCase();
        return (
          <Avatar
            variant="rounded"
            src={src}
            sx={{ width: 48, height: 48 }}
            imgProps={{ crossOrigin: "anonymous", referrerPolicy: "no-referrer" }}
          >
            {letter}
          </Avatar>
        );
      },
    },
    { field: "location", headerName: "Location", flex: 1, minWidth: 200 },
    { field: "size", headerName: "Size", minWidth: 100 },
    { field: "orientation", headerName: "Orientation", minWidth: 120 },
    { field: "display", headerName: "Display", minWidth: 120 },
    { field: "status", headerName: "Status", minWidth: 110 },
    { field: "mode", headerName: "Mode", minWidth: 90 },
    {
      field: "rentPrice", headerName: "Rent", minWidth: 120, headerAlign: "right", align: "right",
      valueFormatter: (p) => {
        const v = getVFValue(p); if (v == null || v === "") return "";
        const n = Number(v); return Number.isFinite(n) ? currencyFmt.format(n) : String(v);
      },
    },
    {
      field: "sellPrice", headerName: "Sell", minWidth: 120, headerAlign: "right", align: "right",
      valueFormatter: (p) => {
        const v = getVFValue(p); if (v == null || v === "") return "";
        const n = Number(v); return Number.isFinite(n) ? currencyFmt.format(n) : String(v);
      },
    },
    {
      field: "servicePrice", headerName: "Service", minWidth: 120, headerAlign: "right", align: "right",
      valueFormatter: (p) => {
        const v = getVFValue(p); if (v == null || v === "") return "";
        const n = Number(v); return Number.isFinite(n) ? currencyFmt.format(n) : String(v);
      },
    },
    {
      field: "createdAt",
      headerName: "Created",
      minWidth: 180,
      valueFormatter: (p) => {
        const d = new Date(String(p));
        return isNaN(d.getTime()) ? "" : fmtDate.format(d);
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => { setDetailId(params.row.id); setDetailOpen(true); }}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => { setToDelete(params.row); setConfirmOpen(true); }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h5">Billboards</Typography>
          <Chip label={`Total: ${totalCount.toLocaleString()}`} size="small" variant="outlined" />
        </Stack>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            placeholder="Search location/description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { setPage(0); fetchData(); }
            }}
          />
          <Button variant="contained" onClick={() => { setPage(0); fetchData(); }}>
            Search
          </Button>
        </Stack>
      </Stack>

      <div style={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(r) => r.id}
          loading={loading}
          pagination
          paginationMode="server"
          rowCount={rowCount}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(m) => { setPage(m.page); setPageSize(m.pageSize); }}
          sortingMode="client"
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          pageSizeOptions={[5, 10, 20, 50]}
          disableRowSelectionOnClick
        />
      </div>

      <BillboardDetailDialog open={detailOpen} billboardId={detailId} onClose={() => setDetailOpen(false)} />

      {/* Delete */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (!toDelete || deleting) return;
          try {
            setDeleting(true);
            await deleteBillboard(toDelete.id);
            setToast("Billboard deleted");
            setConfirmOpen(false);
            setToDelete(null);
            await fetchData();
          } catch (err: any) {
            setToast(err?.message || "Failed to delete billboard");
          } finally {
            setDeleting(false);
          }
        }}
        title="Delete billboard"
        content={`Delete ${toDelete?.location ?? "this billboard"}? This cannot be undone.`}
      />

      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast(null)} message={toast ?? ""} />
    </Box>
  );
}

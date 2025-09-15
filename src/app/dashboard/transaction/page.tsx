"use client";

import * as React from "react";
// import {
//   listTransactionsAll,
//   updateTransactionStatus,
//   deleteTransaction,
//   type TransactionRow,
//   type TransactionStatus,
// } from "@/services/transactions";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef, GridSortModel } from "@mui/x-data-grid";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { deleteTransaction, listTransactionsAll, TransactionRow, TransactionStatus, updateTransactionStatus } from "@/services/transaction";

const fmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

const currencyFmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

// Safely extract the value regardless of how MUI calls valueFormatter
const getVFValue = (p: unknown) =>
  p && typeof p === "object" && "value" in (p as any) ? (p as any).value : p;

const STATUS_OPTIONS: TransactionStatus[] = [
  "PENDING",
  "PAID",
  "EXPIRED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
];

// simple mapping for Chip color (keep it flexible)
const STATUS_COLOR: Record<string, any> = {
  PENDING: "warning",
  PAID: "info",
  EXPIRED: "default",
  REJECTED: "error",
  CANCELLED: "default",
  COMPLETED: "success",
};

export default function TransactionsPage() {
  const [rows, setRows] = React.useState<TransactionRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [rowCount, setRowCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<TransactionStatus | "">("");
  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    { field: "createdAt", sort: "desc" },
  ]);
  const [toast, setToast] = React.useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<TransactionRow | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    const sortBy = (sortModel[0]?.field as string) || "createdAt";
    const sortDir = (sortModel[0]?.sort ?? "desc") as "asc" | "desc";
    const res = await listTransactionsAll({
      page: page + 1,
      pageSize,
      search: search || undefined,
      status: status || undefined,
      sortBy,
      sortDir,
    });
    setRows(res.data);
    setRowCount(res.meta.total);
    setTotalCount(res.meta.total);
    setLoading(false);
  }, [page, pageSize, search, status, sortModel]);

  React.useEffect(() => {
    fetchData().catch(console.error);
  }, [fetchData]);

  const columns: GridColDef<TransactionRow>[] = [
    { field: "id", headerName: "ID", minWidth: 220, flex: 1 },
    {
      field: "buyerId",
      headerName: "Buyer",
      minWidth: 160,
      flex: 0.8,
      valueGetter: (p) => p.row.buyer?.username || p.row.buyer?.email || p.value,
    },
    {
      field: "merchantId",
      headerName: "Merchant",
      minWidth: 160,
      flex: 0.8,
      valueGetter: (p) => p.row.merchant?.storeName || p.value,
    },
    {
      field: "billboardId",
      headerName: "Billboard",
      minWidth: 160,
      flex: 0.8,
      valueGetter: (p) => p.row.billboard?.location || p.value,
    },
    {
      field: "designId",
      headerName: "Design",
      minWidth: 140,
      flex: 0.7,
      valueGetter: (p) => p.row.design?.name || p.value || "-",
    },
    {
      field: "totalPrice",
      headerName: "Total",
      minWidth: 140,
      headerAlign: "right",
      align: "right",
      valueFormatter: (p) => {
        const v = getVFValue(p);
        if (v == null || v === "") return "";
        const n = Number(v);
        return Number.isFinite(n) ? currencyFmt.format(n) : String(v);
      },
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 130,
      renderCell: ({ value }) => (
        <Chip size="small" label={String(value)} color={STATUS_COLOR[String(value)]} />
      ),
    },
    {
      field: "startDate",
      headerName: "Start",
      minWidth: 170,
      valueFormatter: (p) => {
        const d = new Date(String(p));
        return isNaN(d.getTime()) ? "" : fmt.format(d);
      },
    },
    {
      field: "endDate",
      headerName: "End",
      minWidth: 170,
      valueFormatter: (p) => {
        if (!p) return "";
        const d = new Date(String(p));
        return isNaN(d.getTime()) ? "" : fmt.format(d);
      },
    },
    {
      field: "createdAt",
      headerName: "Created",
      minWidth: 170,
      valueFormatter: (p) => {
        const d = new Date(String(p));
        return isNaN(d.getTime()) ? "" : fmt.format(d);
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => alert(JSON.stringify(params.row, null, 2))}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* quick status change (admin) */}
          <Tooltip title="Set status">
            <IconButton
              size="small"
              onClick={async () => {
                const next = prompt(
                  "Set status (PENDING|PAID|EXPIRED|REJECTED|CANCELLED|COMPLETED):",
                  params.row.status
                );
                if (!next) return;
                try {
                  await updateTransactionStatus(params.row.id, next as TransactionStatus);
                  setToast("Status updated");
                  await fetchData();
                } catch (e: any) {
                  setToast(e?.message ?? "Failed to update status");
                }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                setToDelete(params.row);
                setConfirmOpen(true);
              }}
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
          <Typography variant="h5">Transactions</Typography>
          <Chip label={`Total: ${totalCount.toLocaleString()}`} size="small" variant="outlined" />
        </Stack>

        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            placeholder="Search buyer/merchant/billboard"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(0);
                fetchData();
              }
            }}
          />

          <Select
            size="small"
            displayEmpty
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as any);
              setPage(0);
            }}
            renderValue={(v) => (v ? String(v) : "All statuses")}
          >
            <MenuItem value="">All statuses</MenuItem>
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>

          <Button
            variant="contained"
            onClick={() => {
              setPage(0);
              fetchData();
            }}
          >
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
          onPaginationModelChange={(m) => {
            setPage(m.page);
            setPageSize(m.pageSize);
          }}
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          pageSizeOptions={[5, 10, 20, 50]}
          disableRowSelectionOnClick
        />
      </div>

      {/* Delete */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (toDelete) {
            await deleteTransaction(toDelete.id);
            setToast("Transaction deleted");
            setConfirmOpen(false);
            setToDelete(null);
            await fetchData();
          }
        }}
        title="Delete transaction"
        content={`Delete ${toDelete?.id ?? "this transaction"}? This cannot be undone.`}
      />

      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast(null)} message={toast ?? ""} />
    </Box>
  );
}

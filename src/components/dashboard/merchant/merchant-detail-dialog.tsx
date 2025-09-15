"use client";

import * as React from "react";
import {
  Avatar, Button, Chip, Dialog, DialogContent, DialogTitle, Divider,
  Grid, IconButton, Paper, Skeleton, Stack, Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { getMerchantDetail, type MerchantDetail } from "@/services/merchants";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

function resolveImgUrl(u?: string | null) {
  if (!u) return undefined;
  if (/^(https?:|blob:|data:)/i.test(u)) return u;
  try { return new URL(String(u).replace(/^\/+/, ""), API_BASE + "/").href; } catch { return undefined; }
}

const fmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

function maskNumber(n?: string | null, keep = 4) {
  if (!n) return "";
  const s = String(n).replace(/\s+/g, "");
  if (s.length <= keep) return s;
  return s.slice(0, -keep).replace(/./g, "•") + s.slice(-keep);
}

export type MerchantDetailDialogProps = {
  open: boolean;
  merchantId: string | null;
  onClose: () => void;
};

export function MerchantDetailDialog({ open, merchantId, onClose }: MerchantDetailDialogProps) {
  const [data, setData] = React.useState<MerchantDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !merchantId) return;
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const d = await getMerchantDetail(merchantId);
        if (!ignore) { setData(d); setError(null); }
      } catch (e: any) {
        if (!ignore) setError(e?.message ?? "Failed to load merchant");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [open, merchantId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pr: 6 }}>
        Merchant detail
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <SkeletonBlock />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : data ? (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Header data={data} />
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Field label="Fullname" value={data.fullname} />
              <Field label="Company" value={data.companyName} />
              <Field label="KTP" value={maskNumber(data.ktp)} />
              <Field label="NPWP" value={maskNumber(data.npwp)} />
              <Field label="KTP Address" value={data.ktpAddress} />
              <Field label="Office Address" value={data.officeAddress} />
              <Field label="Created" value={fmt.format(new Date(data.createdAt))} />
              <Field label="Updated" value={fmt.format(new Date(data.updatedAt))} />
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Billboards ({data.billboards.length})
            </Typography>

            {data.billboards.length === 0 ? (
              <Typography color="text.secondary">No billboards yet.</Typography>
            ) : (
              <Grid container spacing={1}>
                {data.billboards.map((b) => (
                  <Grid item xs={12} md={6} key={b.id}>
                    <Paper variant="outlined" sx={{ p: 1.25 }}>
                      <Typography variant="subtitle2">{b.location || "(no location)"}</Typography>
                      <Typography variant="body2" color="text.secondary">Size: {b.size || "-"}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Created: {fmt.format(new Date(b.createdAt))}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        ) : null}
      </DialogContent>
    </Dialog>
  );

  function Header({ data }: { data: MerchantDetail }) {
    const avatarLetter = (data.fullname?.[0] ?? data.companyName?.[0] ?? "M").toUpperCase();
    const userAvatar = resolveImgUrl(data.user?.profilePicture);
    return (
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
        <Avatar src={userAvatar} sx={{ width: 72, height: 72 }}>{avatarLetter}</Avatar>
        <Stack spacing={0.5} sx={{ width: "100%" }}>
          <Typography variant="h6">{data.fullname}</Typography>
          <Typography variant="body2" color="text.secondary">{data.companyName}</Typography>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip size="small" label={`User: ${data.user.username}`} />
            <Chip size="small" label={data.user.email} />
            {data.user.phone && <Chip size="small" label={data.user.phone} />}
            <Chip size="small" label={`Level: ${data.user.level}`} />
          </Stack>
        </Stack>
      </Stack>
    );
  }
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <Grid item xs={12} md={6}>
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body1">{value || "-"}</Typography>
      </Stack>
    </Grid>
  );
}

function SkeletonBlock() {
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Skeleton variant="circular" width={72} height={72} />
        <Stack spacing={1} sx={{ flex: 1 }}>
          <Skeleton variant="text" width={220} height={30} />
          <Skeleton variant="text" width={180} />
          <Skeleton variant="rounded" width={320} height={28} />
        </Stack>
      </Stack>
      <Divider />
      <Grid container spacing={2}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Grid item xs={12} md={6} key={i}>
            <Skeleton variant="rounded" height={48} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

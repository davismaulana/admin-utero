"use client";

import * as React from "react";
import { getBillboardDetail, type BillboardDetail } from "@/services/billboards";
import BadgeIcon from "@mui/icons-material/Badge";
import CloseIcon from "@mui/icons-material/Close";
import DirectionsIcon from "@mui/icons-material/Directions";
import FactoryIcon from "@mui/icons-material/Factory";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import MonitorIcon from "@mui/icons-material/Monitor";
import PlaceIcon from "@mui/icons-material/Place";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import StraightenIcon from "@mui/icons-material/Straighten";
import UpdateIcon from "@mui/icons-material/Update";
import {
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  ImageList,
  ImageListItem,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
const fmtDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });
const currencyFmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

function resolveImgUrl(u?: string | null) {
  if (!u) return undefined;
  if (/^(https?:|blob:|data:)/i.test(u)) return u;
  try { return new URL(String(u).replace(/^\/+/, ""), API_BASE + "/").href; } catch { return undefined; }
}

export type BillboardDetailDialogProps = {
  open: boolean;
  billboardId: string | null;
  onClose: () => void;
};

export function BillboardDetailDialog({ open, billboardId, onClose }: BillboardDetailDialogProps) {
  const [data, setData] = React.useState<BillboardDetail | null>(null);
  const [avg, setAvg] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !billboardId) return;
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const res = await getBillboardDetail(billboardId); // returns { status, message, data, averageRating }
        if (!ignore) {
          setData(res.data);
          setAvg(res.averageRating ?? 0);
          setError(null);
        }
      } catch (e: any) {
        if (!ignore) setError(e?.message ?? "Failed to load billboard");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [open, billboardId]);

  const heroImg = data?.image?.[0]?.url;
  const titleLetter = (data?.location?.[0] ?? "B").toUpperCase();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pr: 6 }}>
        Billboard detail
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
          <Stack spacing={2}>
            {/* Header / summary */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                <Avatar
                  variant="rounded"
                  src={resolveImgUrl(heroImg)}
                  imgProps={{ crossOrigin: "anonymous", referrerPolicy: "no-referrer" }}
                  sx={{ width: 72, height: 72 }}
                >
                  {titleLetter}
                </Avatar>

                <Stack spacing={1} sx={{ flex: 1, width: "100%" }}>
                  <Typography variant="h6">{data.location || "(no location)"}</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip icon={<StraightenIcon />} size="small" label={`Size: ${data.size || "-"}`} />
                    {data.orientation && <Chip icon={<DirectionsIcon />} size="small" label={`Orientation: ${data.orientation}`} />}
                    {data.display && <Chip icon={<MonitorIcon />} size="small" label={`Display: ${data.display}`} />}
                    {data.lighting && <Chip icon={<FlashOnIcon />} size="small" label={`Lighting: ${data.lighting}`} />}
                    {data.mode && <Chip size="small" label={`Mode: ${data.mode}`} />}
                    <Chip size="small" label={`Status: ${data.status || "-"}`} color={statusColor(data.status)} />
                    {data.tax && <Chip icon={<LocalOfferIcon />} size="small" label={`Tax: ${data.tax}`} />}
                    {data.landOwnership && <Chip icon={<BadgeIcon />} size="small" label={`Land Owner: ${data.landOwnership}`} />}
                    {/* Optional: average rating */}
                    {!!avg && <Chip size="small" label={`Rating: ${avg.toFixed(1)}`} />}
                  </Stack>
                </Stack>

                {/* Quick prices */}
                <Stack spacing={0.5} alignItems={{ xs: "flex-start", sm: "flex-end" }} sx={{ minWidth: 200 }}>
                  <LabelText icon={<PriceCheckIcon fontSize="small" />} label="Rent" value={money(data.rentPrice)} />
                  <LabelText label="Sell" value={money(data.sellPrice)} />
                  <LabelText label="Service" value={money(data.servicePrice)} />
                </Stack>
              </Stack>
            </Paper>

            {/* Core meta */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {/* Names with fallbacks */}
                <Field label="Category" value={data.category?.name ?? data.categoryId ?? "-"} />
                <Field label="City" value={data.city?.name ?? data.cityName ?? data.cityId ?? "-"} />
                <Field label="Province" value={data.city?.province?.name ?? data.provinceName ?? data.provinceId ?? "-"} />

                <Field label="Created" value={safeDate(data.createdAt)} />
                <Field icon={<UpdateIcon fontSize="small" />} label="Updated" value={safeDate(data.updatedAt)} />
                <Field
                  icon={<FactoryIcon fontSize="small" />}
                  label="Owner"
                  value={data.owner ? `${data.owner.fullname} • ${data.owner.companyName}` : "-"}
                />

                {data.description && (
                  <Grid item xs={12}>
                    <Stack spacing={0.5}>
                      <Typography variant="caption" color="text.secondary">Description</Typography>
                      <Typography variant="body2">{data.description}</Typography>
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Gallery */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Images ({data.image?.length ?? 0})
              </Typography>
              {!data.image?.length ? (
                <Typography color="text.secondary">No images uploaded.</Typography>
              ) : (
                <ImageList cols={3} gap={8}>
                  {data.image.map((img) => {
                    const src = resolveImgUrl(img.url);
                    return (
                      <ImageListItem key={img.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" loading="lazy" style={{ borderRadius: 8 }} />
                        {img.createdAt && (
                          <Typography variant="caption" color="text.secondary">
                            {fmtDate.format(new Date(img.createdAt))}
                          </Typography>
                        )}
                      </ImageListItem>
                    );
                  })}
                </ImageList>
              )}
            </Paper>
          </Stack>
        ) : null}
      </DialogContent>
    </Dialog>
  );

  function money(v?: string | number | null) {
    if (v == null || v === "") return "-";
    const n = typeof v === "number" ? v : Number(v.toString().replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? currencyFmt.format(n) : "-";
  }
  function safeDate(s?: string | null) {
    if (!s) return "-";
    const d = new Date(String(s));
    return isNaN(d.getTime()) ? "-" : fmtDate.format(d);
  }
  function statusColor(s?: string | null) {
    switch (s) {
      case "Available": return "success";
      case "NotAvailable": return "warning";
      default: return "default";
    }
  }
}

function LabelText({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {icon && <Box sx={{ color: "text.secondary" }}>{icon}</Box>}
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{value ?? "-"}</Typography>
    </Stack>
  );
}

function Field({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: React.ReactNode }) {
  return (
    <Grid item xs={12} md={6}>
      <Stack spacing={0.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          {icon && <Box sx={{ color: "text.secondary" }}>{icon}</Box>}
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Stack>
        <Typography variant="body1">{value || "-"}</Typography>
      </Stack>
    </Grid>
  );
}

function SkeletonBlock() {
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Skeleton variant="rounded" width={72} height={72} />
        <Stack spacing={1} sx={{ flex: 1 }}>
          <Skeleton variant="text" width={220} height={30} />
          <Skeleton variant="text" width={180} />
          <Skeleton variant="rounded" width={320} height={28} />
        </Stack>
        <Stack spacing={1} sx={{ minWidth: 200 }}>
          <Skeleton variant="text" width={140} />
          <Skeleton variant="text" width={140} />
          <Skeleton variant="text" width={140} />
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
      <Divider />
      <Skeleton variant="rounded" height={200} />
    </Stack>
  );
}

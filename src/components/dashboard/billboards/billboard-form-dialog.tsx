// src/components/dashboard/billboards/billboard-form-dialog.tsx
"use client";

import * as React from "react";
import { z as zod } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormHelperText, InputLabel, OutlinedInput, Stack, TextField, Typography,
  ImageList, ImageListItem
} from "@mui/material";

const schema = zod.object({
  categoryId: zod.string().min(1, "Category is required"),
  location: zod.string().min(1, "Location is required"),
  description: zod.string().min(1, "Description is required"),
  cityId: zod.string().min(1, "City is required"),
  provinceId: zod.string().min(1, "Province is required"),
  status: zod.string().min(1, "Status is required"),
  mode: zod.string().min(1, "Mode is required"),
  size: zod.string().min(1, "Size is required"),
  orientation: zod.string().min(1, "Orientation is required"),
  display: zod.string().min(1, "Display is required"),
  lighting: zod.string().min(1, "Lighting is required"),
  tax: zod.string().min(1, "Tax is required"),
  landOwner: zod.string().optional(),
  rentPrice: zod.union([zod.string(), zod.number()]).optional(),
  sellPrice: zod.union([zod.string(), zod.number()]).optional(),
  servicePrice: zod.union([zod.string(), zod.number()]).optional(),
  images: zod.any().optional(),
});
type FormValues = zod.infer<typeof schema>;

export type BillboardFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<FormValues>;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (values: FormValues) => Promise<void>;
};

export function BillboardFormDialog({
  open, mode, initial, serverError, onClose, onSubmit
}: BillboardFormDialogProps) {
  const { control, handleSubmit, reset, formState: { errors, isSubmitting }, setError, watch, setValue } =
    useForm<FormValues>({
      defaultValues: {
        categoryId: initial?.categoryId ?? "",
        location: initial?.location ?? "",
        description: initial?.description ?? "",
        cityId: initial?.cityId ?? "",
        provinceId: initial?.provinceId ?? "",
        status: initial?.status ?? "Available",
        mode: initial?.mode ?? "Buy",
        size: initial?.size ?? "",
        orientation: initial?.orientation ?? "",
        display: initial?.display ?? "",
        lighting: initial?.lighting ?? "",
        tax: initial?.tax ?? "PPN",
        landOwner: initial?.landOwner ?? "",
        rentPrice: initial?.rentPrice ?? "",
        sellPrice: initial?.sellPrice ?? "",
        servicePrice: initial?.servicePrice ?? "",
        images: undefined,
      },
      resolver: zodResolver(schema),
    });

  React.useEffect(() => {
    reset({
      categoryId: initial?.categoryId ?? "",
      location: initial?.location ?? "",
      description: initial?.description ?? "",
      cityId: initial?.cityId ?? "",
      provinceId: initial?.provinceId ?? "",
      status: initial?.status ?? "Available",
      mode: initial?.mode ?? "Buy",
      size: initial?.size ?? "",
      orientation: initial?.orientation ?? "",
      display: initial?.display ?? "",
      lighting: initial?.lighting ?? "",
      tax: initial?.tax ?? "PPN",
      landOwner: initial?.landOwner ?? "",
      rentPrice: initial?.rentPrice ?? "",
      sellPrice: initial?.sellPrice ?? "",
      servicePrice: initial?.servicePrice ?? "",
      images: undefined,
    });
  }, [initial, reset]);

  const files = watch("images") as File[] | undefined;
  const [previews, setPreviews] = React.useState<string[]>([]);
  React.useEffect(() => {
    if (!files?.length) return setPreviews([]);
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{mode === "create" ? "Add billboard" : "Edit billboard"}</DialogTitle>

      <form onSubmit={handleSubmit(async (vals) => {
        try { await onSubmit(vals); }
        catch (e: any) { setError("root", { type: "server", message: e?.message || "Failed to save" }); }
      })}>
        <DialogContent>
          <Stack spacing={2}>
            {/* top row */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Controller name="categoryId" control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.categoryId} fullWidth>
                    <InputLabel>Category ID</InputLabel>
                    <OutlinedInput {...field} label="Category ID" />
                    <FormHelperText>{errors.categoryId?.message}</FormHelperText>
                  </FormControl>
                )}
              />
              <Controller name="location" control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.location} fullWidth>
                    <InputLabel>Location</InputLabel>
                    <OutlinedInput {...field} label="Location" />
                    <FormHelperText>{errors.location?.message}</FormHelperText>
                  </FormControl>
                )}
              />
            </Stack>

            <Controller name="description" control={control}
              render={({ field }) => (
                <TextField {...field} label="Description" multiline minRows={3}
                  error={!!errors.description} helperText={errors.description?.message} />
              )}
            />

            {/* details */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Controller name="cityId" control={control} render={({ field }) => (
                <TextField {...field} label="City ID" error={!!errors.cityId} helperText={errors.cityId?.message} fullWidth />
              )}/>
              <Controller name="provinceId" control={control} render={({ field }) => (
                <TextField {...field} label="Province ID" error={!!errors.provinceId} helperText={errors.provinceId?.message} fullWidth />
              )}/>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Controller name="status" control={control} render={({ field }) => (
                <TextField {...field} label="Status" error={!!errors.status} helperText={errors.status?.message} fullWidth />
              )}/>
              <Controller name="mode" control={control} render={({ field }) => (
                <TextField {...field} label="Mode" error={!!errors.mode} helperText={errors.mode?.message} fullWidth />
              )}/>
              <Controller name="size" control={control} render={({ field }) => (
                <TextField {...field} label="Size" error={!!errors.size} helperText={errors.size?.message} fullWidth />
              )}/>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Controller name="orientation" control={control} render={({ field }) => (
                <TextField {...field} label="Orientation" error={!!errors.orientation} helperText={errors.orientation?.message} fullWidth />
              )}/>
              <Controller name="display" control={control} render={({ field }) => (
                <TextField {...field} label="Display" error={!!errors.display} helperText={errors.display?.message} fullWidth />
              )}/>
              <Controller name="lighting" control={control} render={({ field }) => (
                <TextField {...field} label="Lighting" error={!!errors.lighting} helperText={errors.lighting?.message} fullWidth />
              )}/>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Controller name="tax" control={control} render={({ field }) => (
                <TextField {...field} label="Tax" error={!!errors.tax} helperText={errors.tax?.message} fullWidth />
              )}/>
              <Controller name="landOwner" control={control} render={({ field }) => (
                <TextField {...field} label="Land owner" fullWidth />
              )}/>
            </Stack>

            {/* prices */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Controller name="rentPrice" control={control} render={({ field }) => (
                <TextField {...field} label="Rent price" type="number" fullWidth />
              )}/>
              <Controller name="sellPrice" control={control} render={({ field }) => (
                <TextField {...field} label="Sell price" type="number" fullWidth />
              )}/>
              <Controller name="servicePrice" control={control} render={({ field }) => (
                <TextField {...field} label="Service price" type="number" fullWidth />
              )}/>
            </Stack>

            {/* images */}
            <Stack spacing={1}>
              <Typography variant="subtitle2">Images</Typography>
              <input type="file" multiple accept="image/*"
                onChange={(e) => setValue("images", Array.from(e.target.files ?? []) as any, { shouldValidate: false })}/>
              {!!previews.length && (
                <ImageList cols={3} gap={8}>
                  {previews.map((src, i) => (
                    <ImageListItem key={i}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`preview-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                    </ImageListItem>
                  ))}
                </ImageList>
              )}
            </Stack>

            {serverError && <Alert color="error">{serverError}</Alert>}
            {/* root error from setError */}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {mode === "create" ? "Create" : "Save changes"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

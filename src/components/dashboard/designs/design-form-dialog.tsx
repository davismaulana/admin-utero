// src/components/dashboard/designs/design-form-dialog.tsx
"use client";

import * as React from "react";
import { z as zod } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  OutlinedInput,
  Stack,
  TextField,
  Typography,
  ImageList,
  ImageListItem,
} from "@mui/material";

const schema = zod.object({
  name: zod.string().trim().min(1, "Name is required"),
  description: zod.string().trim().min(1, "Description is required"),
  price: zod.union([
    zod.string().trim().min(1, "Price is required"),
    zod.number(),
  ]),
  images: zod
    .any()
    .optional(), // we handle files manually; on create you can enforce at least 1 if needed
});

type FormValues = zod.infer<typeof schema>;

export type DesignFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<FormValues>;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (values: { name: string; description: string; price: string | number; images?: File[] }) => Promise<void>;
};

export function DesignFormDialog({
  open,
  mode,
  initial,
  serverError,
  onClose,
  onSubmit,
}: DesignFormDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
    watch,
    setValue,
  } = useForm<FormValues>({
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      price: initial?.price ?? "",
      images: undefined,
    },
    resolver: zodResolver(schema),
  });

  React.useEffect(() => {
    reset({
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      price: initial?.price ?? "",
      images: undefined,
    });
  }, [initial, reset]);

  const [previews, setPreviews] = React.useState<string[]>([]);

  const files = watch("images") as File[] | undefined;

  React.useEffect(() => {
    if (!files || files.length === 0) {
      setPreviews([]);
      return;
    }
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === "create" ? "Add design" : "Edit design"}</DialogTitle>

      <form
        onSubmit={handleSubmit(async (vals) => {
          try {
            const payload = {
              name: vals.name.trim(),
              description: vals.description.trim(),
              price: typeof vals.price === "number" ? vals.price : vals.price.trim(),
              images: (vals.images as File[] | undefined) ?? undefined,
            };
            await onSubmit(payload);
          } catch (e: any) {
            setError("root", { type: "server", message: e?.message || "Failed to save" });
          }
        })}
      >
        <DialogContent>
          <Stack spacing={2}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <FormControl error={!!errors.name} fullWidth>
                  <InputLabel>Name</InputLabel>
                  <OutlinedInput {...field} label="Name" />
                  {errors.name && <FormHelperText>{errors.name.message}</FormHelperText>}
                </FormControl>
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  multiline
                  minRows={3}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              )}
            />

            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <FormControl error={!!errors.price} fullWidth>
                  <InputLabel>Price</InputLabel>
                  <OutlinedInput
                    {...field}
                    label="Price"
                    type="number"
                    inputProps={{ min: 0, step: "0.01" }}
                  />
                  {errors.price && <FormHelperText>{String(errors.price.message)}</FormHelperText>}
                </FormControl>
              )}
            />

            {/* Images (multiple) */}
            <Controller
              name="images"
              control={control}
              render={() => (
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Images</Typography>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const f = Array.from(e.target.files ?? []);
                      setValue("images", f as any, { shouldValidate: false });
                    }}
                  />
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
              )}
            />

            {serverError && <Alert color="error">{serverError}</Alert>}
            {errors.root && <Alert color="error">{errors.root.message}</Alert>}
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

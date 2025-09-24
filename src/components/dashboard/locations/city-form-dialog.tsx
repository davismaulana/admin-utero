"use client";

import * as React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack, MenuItem, FormControl, InputLabel, Select, CircularProgress
} from "@mui/material";
import type { CityRow, ProvinceRow } from "@/services/locations";

export type CityFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  provinces: ProvinceRow[];
  initial?: Partial<CityRow> | null;
  onClose: () => void;
  onSubmit: (payload: { name: string; provinceId: string }) => Promise<void>;
  submitting?: boolean;
  error?: string | null;
};

export function CityFormDialog({
  open, mode, provinces, initial, onClose, onSubmit, submitting, error
}: CityFormDialogProps) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [provinceId, setProvinceId] = React.useState(initial?.provinceId ?? "");

  React.useEffect(() => {
    setName(initial?.name ?? "");
    setProvinceId(initial?.provinceId ?? "");
  }, [initial, open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === "create" ? "Create City" : "Edit City"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="City name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
          <FormControl fullWidth required>
            <InputLabel id="province-label">Province</InputLabel>
            <Select
              labelId="province-label"
              label="Province"
              value={provinceId}
              onChange={(e) => setProvinceId(e.target.value as string)}
            >
              {provinces.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {error ? <span style={{ color: "#d32f2f" }}>{error}</span> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={!!submitting}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!name.trim() || !provinceId || !!submitting}
          onClick={async () => { await onSubmit({ name: name.trim(), provinceId }); }}
          startIcon={submitting ? <CircularProgress size={16} /> : undefined}
        >
          {mode === "create" ? "Create" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

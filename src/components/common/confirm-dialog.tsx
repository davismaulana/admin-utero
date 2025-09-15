"use client";
import * as React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

export function ConfirmDialog({
  open, onClose, onConfirm, title, content,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  content?: React.ReactNode;
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title ?? "Confirm delete"}</DialogTitle>
      <DialogContent>
        <Typography>{content ?? "Are you sure you want to delete this item?"}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

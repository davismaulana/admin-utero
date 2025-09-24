"use client";

import * as React from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  ImageList,
  ImageListItem,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

type ImageRow = {
  id: string;
  url: string;
  type?: string | null;
  billboardId?: string | null;
  designId?: string | null;
  createdAt: string;
};

// utility to resolve relative URLs
function resolveImgUrl(u: string) {
  if (/^(https?:|data:|blob:)/i.test(u)) return u;
  return `${API_BASE}/${u.replace(/^\/+/, "")}`;
}

export default function ImagesPage() {
  const [rows, setRows] = React.useState<ImageRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [toast, setToast] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState<ImageRow | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/image`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, // adjust auth handling
      }).then((r) => r.json());

      if (res.status) {
        setRows(res.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_BASE}/image/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setToast("Image deleted");
      setConfirm(null);
      await fetchData();
    } catch (e) {
      setToast("Failed to delete image");
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Image Gallery
      </Typography>

      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ height: 300 }}>
          <CircularProgress />
        </Stack>
      ) : rows.length === 0 ? (
        <Typography color="text.secondary">No images found.</Typography>
      ) : (
        <ImageList variant="masonry" cols={3} gap={8}>
          {rows.map((img) => (
            <ImageListItem key={img.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImgUrl(img.url)}
                alt=""
                loading="lazy"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                style={{
                  borderRadius: 8,
                  display: "block",
                  width: "100%",
                }}
              />
              <IconButton
                size="small"
                color="error"
                sx={{ position: "absolute", top: 4, right: 4, bgcolor: "white" }}
                onClick={() => setConfirm(img)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ImageListItem>
          ))}
        </ImageList>
      )}

      {/* Confirm dialog */}
      <Dialog open={!!confirm} onClose={() => setConfirm(null)}>
        <DialogTitle>Delete Image</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this image?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => confirm && handleDelete(confirm.id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={2500}
        onClose={() => setToast(null)}
        message={toast ?? ""}
      />
    </Box>
  );
}

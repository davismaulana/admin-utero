import * as React from 'react';

interface PopoverController<T> {
  anchorRef: React.MutableRefObject<T | null>;
  handleOpen: () => void;
  handleClose: () => void;
  handleToggle: () => void;
  open: boolean;
}

export function usePopover<T extends HTMLElement = HTMLElement>() {
  const anchorRef = React.useRef<T | null>(null);
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return { anchorRef, open, handleOpen, handleClose };
}
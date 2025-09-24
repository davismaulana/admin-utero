"use client";

import * as React from "react";
import { TransactionStatus } from "@/services/transaction";
import {
	Autocomplete,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Stack,
	TextField,
} from "@mui/material";

import { statusColor } from "./transaction-detail-dialog";

export function TransactionStatusDialog({
	open,
	value,
	options,
	saving,
	onClose,
	onSave,
}: {
	open: boolean;
	value: TransactionStatus | null;
	options: TransactionStatus[];
	saving?: boolean;
	onClose: () => void;
	onSave: (next: TransactionStatus) => void | Promise<void>;
}) {
	const [selected, setSelected] = React.useState<TransactionStatus | null>(value ?? null);
	React.useEffect(() => setSelected(value ?? null), [value, open]);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullWidth
			maxWidth="xs"
			scroll="paper" // <— enables internal scroll
		>
			<DialogTitle>Edit transaction status</DialogTitle>

			<DialogContent dividers sx={{ p: 2 }}>
				<Stack spacing={1.5}>
					{/* Searchable, scrollable listbox */}
					<Autocomplete<TransactionStatus, false, false, false>
						value={selected}
						onChange={(_e, v) => setSelected(v)}
						// disableClearable
						options={options}
						renderInput={(params) => <TextField {...params} label="Status" placeholder="Search…" size="small" />}
						ListboxProps={{
							style: { maxHeight: 320, overflow: "auto" }, // <— the scroll!
						}}
						renderOption={(props, opt) => (
							<li {...props} key={opt}>
								<Chip size="small" color={statusColor(opt) as any} label={opt} />
							</li>
						)}
					/>
				</Stack>
			</DialogContent>

			<DialogActions sx={{ p: 2 }}>
				<Button onClick={onClose} disabled={!!saving}>
					Cancel
				</Button>
				<Button variant="contained" disabled={!selected || !!saving} onClick={() => selected && onSave(selected)}>
					Save
				</Button>
			</DialogActions>
		</Dialog>
	);
}

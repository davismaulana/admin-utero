"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
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
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { z as zod } from "zod";

const schema = zod.object({
	name: zod.string().trim().min(1, "Name is required"),
});
type FormValues = zod.infer<typeof schema>;

export type CategoryFormDialogProps = {
	open: boolean;
	onClose: () => void;
	onSubmit: (values: FormValues) => Promise<void>;
	mode: "create" | "edit";
	initial?: Partial<FormValues>;
	serverError?: string | null;
};

export function CategoryFormDialog({ open, onClose, onSubmit, mode, initial, serverError }: CategoryFormDialogProps) {
	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
		setError,
	} = useForm<FormValues>({
		defaultValues: { name: initial?.name ?? "" },
		resolver: zodResolver(schema),
	});

	React.useEffect(() => {
		reset({ name: initial?.name ?? "" });
	}, [initial, reset]);

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
			<DialogTitle>{mode === "create" ? "Add category" : "Edit category"}</DialogTitle>

			<form
				onSubmit={handleSubmit(async (vals) => {
					try {
						await onSubmit(vals);
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

						{serverError && <Alert color="error">{serverError}</Alert>}
					</Stack>
				</DialogContent>

				<DialogActions>
					<Button onClick={onClose} disabled={isSubmitting}>
						Cancel
					</Button>
					<Button type="submit" variant="contained" disabled={isSubmitting}>
						{mode === "create" ? "Create" : "Save changes"}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}

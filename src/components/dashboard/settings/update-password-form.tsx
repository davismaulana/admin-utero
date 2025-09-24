"use client";

import * as React from "react";
import { updateMyPassword } from "@/services/users";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
	Alert,
	Button,
	Card,
	CardActions,
	CardContent,
	CardHeader,
	Divider,
	FormControl,
	IconButton,
	InputAdornment,
	InputLabel,
	OutlinedInput,
	Snackbar,
	Stack,
} from "@mui/material";

export function UpdatePasswordForm(): React.JSX.Element {
	const [password, setPassword] = React.useState("");
	const [confirmPassword, setConfirmPassword] = React.useState("");
	const [showPassword, setShowPassword] = React.useState(false);
	const [showConfirm, setShowConfirm] = React.useState(false);
	const [submitting, setSubmitting] = React.useState(false);
	const [toast, setToast] = React.useState<{ msg: string; severity: "success" | "error" } | null>(null);

	const canSubmit = password.length >= 6 && password === confirmPassword && !submitting;

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!canSubmit) return;
		try {
			setSubmitting(true);
			await updateMyPassword({ password, confirmPassword });
			setToast({ msg: "Password updated", severity: "success" });
			setPassword("");
			setConfirmPassword("");
		} catch (err: any) {
			setToast(err?.message || "Failed to update password");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<>
			<form onSubmit={onSubmit}>
				<Card>
					<CardHeader subheader="Update password" title="Password" />
					<Divider />
					<CardContent>
						<Stack spacing={3} sx={{ maxWidth: "sm" }}>
							<FormControl fullWidth>
								<InputLabel htmlFor="new-password">Password</InputLabel>
								<OutlinedInput
									id="new-password"
									label="Password"
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									endAdornment={
										<InputAdornment position="end">
											<IconButton
												aria-label="toggle password visibility"
												onClick={() => setShowPassword((s) => !s)}
												edge="end"
											>
												{showPassword ? <VisibilityOff /> : <Visibility />}
											</IconButton>
										</InputAdornment>
									}
								/>
							</FormControl>

							<FormControl fullWidth>
								<InputLabel htmlFor="confirm-password">Confirm password</InputLabel>
								<OutlinedInput
									id="confirm-password"
									label="Confirm password"
									type={showConfirm ? "text" : "password"}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									endAdornment={
										<InputAdornment position="end">
											<IconButton
												aria-label="toggle confirm password visibility"
												onClick={() => setShowConfirm((s) => !s)}
												edge="end"
											>
												{showConfirm ? <VisibilityOff /> : <Visibility />}
											</IconButton>
										</InputAdornment>
									}
								/>
							</FormControl>
						</Stack>
					</CardContent>
					<Divider />
					<CardActions sx={{ justifyContent: "flex-end" }}>
						<Button type="submit" variant="contained" disabled={!canSubmit}>
							{submitting ? "Updating…" : "Update"}
						</Button>
					</CardActions>
				</Card>
				<Snackbar
					open={!!toast}
					autoHideDuration={2600}
					onClose={() => setToast(null)}
					anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
				>
					{toast ? (
						<Alert onClose={() => setToast(null)} severity={toast.severity} variant="filled" sx={{ width: "100%" }}>
							{toast.msg}
						</Alert>
					) : undefined}
				</Snackbar>
			</form>
		</>
	);
}

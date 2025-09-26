"use client";

import * as React from "react";
import RouterLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import Link from "@mui/material/Link";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Eye as EyeIcon, EyeSlash as EyeSlashIcon } from "@phosphor-icons/react";
import { Controller, useForm } from "react-hook-form";
import { z as zod } from "zod";

import { paths } from "@/paths";
import { useUser } from "@/hooks/use-user";
import { authClient } from "@/components/auth/client";

// Accept either email OR phone
const emailOrPhone = zod
	.string()
	.min(1, { message: "Email or phone is required" })
	.refine((v) => {
		const isEmail = /^\S+@\S+\.\S+$/.test(v);
		const isPhone = /^\+?[0-9]{8,15}$/.test(v.replace(/\s|-/g, ""));
		return isEmail || isPhone;
	}, "Enter a valid email or phone number");

const schema = zod.object({
	identifier: emailOrPhone,
	password: zod.string().min(1, { message: "Password is required" }),
});

type Values = zod.infer<typeof schema>;

const defaultValues: Values = { identifier: "", password: "" };

export function SignInForm(): React.JSX.Element {
	const router = useRouter();
	const search = useSearchParams();
	const nextParam = React.useMemo(() => search.get("next") || "/dashboard", [search]);

	// we only use checkSession; we do NOT gate rendering on isLoading here
	const { checkSession } = useUser();

	const [showPassword, setShowPassword] = React.useState(false);
	const [isPending, setIsPending] = React.useState(false);

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

	const onSubmit = React.useCallback(
		async (values: Values): Promise<void> => {
			setIsPending(true);
			try {
				// COOKIE-BASED LOGIN: server sets httpOnly cookie
				const { error } = await authClient.signInWithPassword({
					identifier: values.identifier,
					password: values.password,
				});

				if (error) {
					setError("root", { type: "server", message: error });
					return;
				}

				// refresh user context, then go to "next" (or dashboard)
				await checkSession?.();
				router.replace(nextParam);
			} catch (err: any) {
				const msg = err?.response?.data?.message || err?.message || "Invalid credentials";
				setError("root", { type: "server", message: msg });
			} finally {
				setIsPending(false);
			}
		},
		[checkSession, router, nextParam, setError]
	);

	return (
		<Stack spacing={4}>
			<Stack spacing={1}>
				<Typography variant="h4">Sign in</Typography>
				<Typography color="text.secondary" variant="body2">
					Don&apos;t have an account?{" "}
					<Link component={RouterLink} href={paths.auth.signUp} underline="hover" variant="subtitle2">
						Sign up
					</Link>
				</Typography>
			</Stack>

			<form onSubmit={handleSubmit(onSubmit)} noValidate>
				<Stack spacing={2}>
					<Controller
						control={control}
						name="identifier"
						render={({ field }) => {
							const id = "auth-identifier";
							return (
								<FormControl error={Boolean(errors.identifier)} disabled={isPending} fullWidth>
									<InputLabel htmlFor={id}>Email or phone</InputLabel>
									<OutlinedInput
										{...field}
										id={id}
										label="Email or phone"
										fullWidth
										autoComplete="username"
										inputProps={{ inputMode: "email", "aria-label": "Email or phone" }}
									/>
									{errors.identifier ? <FormHelperText>{errors.identifier.message}</FormHelperText> : null}
								</FormControl>
							);
						}}
					/>

					<Controller
						control={control}
						name="password"
						render={({ field }) => {
							const id = "auth-password";
							return (
								<FormControl error={Boolean(errors.password)} disabled={isPending} fullWidth>
									<InputLabel htmlFor={id}>Password</InputLabel>
									<OutlinedInput
										{...field}
										id={id}
										fullWidth
										type={showPassword ? "text" : "password"}
										label="Password"
										autoComplete="current-password"
										endAdornment={
											<InputAdornment position="end">
												<IconButton
													aria-label={showPassword ? "Hide password" : "Show password"}
													onClick={() => setShowPassword((s) => !s)}
													edge="end"
													tabIndex={-1}
												>
													{showPassword ? (
														<EyeSlashIcon size="20" weight="regular" />
													) : (
														<EyeIcon size="20" weight="regular" />
													)}
												</IconButton>
											</InputAdornment>
										}
									/>
									{errors.password ? <FormHelperText>{errors.password.message}</FormHelperText> : null}
								</FormControl>
							);
						}}
					/>

					<div>
						<Link component={RouterLink} href={paths.auth.resetPassword} variant="subtitle2">
							Forgot password?
						</Link>
					</div>

					{errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}

					<Button disabled={isPending} type="submit" variant="contained" fullWidth>
						{isPending ? "Signing in..." : "Sign in"}
					</Button>
				</Stack>
			</form>

			{/* demo creds note (optional): remove in prod */}
			<Alert color="warning">
				Use{" "}
				<Typography component="span" sx={{ fontWeight: 700 }} variant="inherit">
					sofia@devias.io
				</Typography>{" "}
				with password{" "}
				<Typography component="span" sx={{ fontWeight: 700 }} variant="inherit">
					Secret1
				</Typography>
			</Alert>
		</Stack>
	);
}

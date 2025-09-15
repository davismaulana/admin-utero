// components/users/user-form-dialog.tsx
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
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
} from "@mui/material";
import { Eye as EyeIcon, EyeSlash as EyeSlashIcon } from "@phosphor-icons/react";
import { Controller, useForm } from "react-hook-form";
import { z as zod } from "zod";

type Mode = "create" | "edit";

// Build schema with a flag to allow MERCHANT when editing a merchant user
const buildSchema = (mode: Mode, allowMerchant: boolean) =>
  zod
    .object({
      username: zod.string().min(1, "Username is required"),
      email: zod.string().email("Invalid email").min(1, "Email is required"),
      phone: zod.string().min(1, "Phone is required"),
      level: allowMerchant
        ? zod.enum(["ADMIN", "BUYER", "MERCHANT"], { required_error: "Level is required" })
        : zod.enum(["ADMIN", "BUYER"], { required_error: "Level is required" }),
      password:
        mode === "create"
          ? zod.string().min(6, "Password must be at least 6 characters")
          : zod.string().optional(),
      confirmPassword:
        mode === "create"
          ? zod.string().min(1, "Please confirm your password")
          : zod.string().optional(),
    })
    .superRefine((vals, ctx) => {
      if (mode === "create" && vals.password !== vals.confirmPassword) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: "Passwords do not match",
        });
      }
    });

type FormValues = zod.infer<ReturnType<typeof buildSchema>>;

export type UserFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FormValues) => Promise<void>;
  initial?: Partial<FormValues>; // can be MERCHANT when editing
  mode: Mode;
  serverError?: string | null; // optional: show API error
};

export function UserFormDialog({
  open,
  onClose,
  onSubmit,
  initial,
  mode,
  serverError,
}: UserFormDialogProps) {
  const isEditingMerchant = mode === "edit" && initial?.level === "MERCHANT";
  const schema = React.useMemo(() => buildSchema(mode, isEditingMerchant), [mode, isEditingMerchant]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    defaultValues: {
      username: initial?.username ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      level: (initial?.level as any) ?? "BUYER",
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(schema),
  });

  React.useEffect(() => {
    reset({
      username: initial?.username ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      level: (initial?.level as any) ?? "BUYER",
      password: "",
      confirmPassword: "",
    });
  }, [initial, reset]);

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === "create" ? "Add user" : "Edit user"}</DialogTitle>

      <form
        onSubmit={handleSubmit(async (vals) => {
          try {
            // If editing a merchant, ignore any incoming level change (UI already locks it)
            if (isEditingMerchant) {
              (vals as any).level = "MERCHANT";
            }
            await onSubmit(vals);
          } catch (e: any) {
            // show clean server message (e.message set by service)
            setError("root", { type: "server", message: e?.message || "Failed to save" });
          }
        })}
      >
        <DialogContent>
          <Stack spacing={2}>
            {/* Username */}
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <FormControl error={!!errors.username} fullWidth>
                  <InputLabel>Username</InputLabel>
                  <OutlinedInput {...field} label="Username" />
                  {errors.username && <FormHelperText>{errors.username.message}</FormHelperText>}
                </FormControl>
              )}
            />

            {/* Email */}
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <FormControl error={!!errors.email} fullWidth>
                  <InputLabel>Email</InputLabel>
                  <OutlinedInput {...field} label="Email" type="email" />
                  {errors.email && <FormHelperText>{errors.email.message}</FormHelperText>}
                </FormControl>
              )}
            />

            {/* Phone */}
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <FormControl error={!!errors.phone} fullWidth>
                  <InputLabel>Phone</InputLabel>
                  <OutlinedInput {...field} label="Phone" />
                  {errors.phone && <FormHelperText>{errors.phone.message}</FormHelperText>}
                </FormControl>
              )}
            />

            {/* Level */}
            <Controller
              name="level"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl
                  fullWidth
                  error={!!fieldState.error}
                  disabled={isEditingMerchant} // lock when editing a merchant
                >
                  <InputLabel id="level-label">Level</InputLabel>
                  <Select
                    labelId="level-label"
                    label="Level"
                    value={(field.value as "ADMIN" | "BUYER" | "MERCHANT") ?? "BUYER"}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                  >
                    {/* Only allow ADMIN/BUYER selection */}
                    <MenuItem value="ADMIN">ADMIN</MenuItem>
                    <MenuItem value="BUYER">BUYER</MenuItem>
                    {/* MERCHANT is intentionally NOT an option */}
                  </Select>

                  <FormHelperText>
                    {isEditingMerchant
                      ? "MERCHANT level can’t be changed here."
                      : fieldState.error?.message ?? ""}
                  </FormHelperText>
                </FormControl>
              )}
            />

            {/* Password (create: required, edit: optional) */}
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <FormControl error={!!errors.password} fullWidth>
                  <InputLabel>Password</InputLabel>
                  <OutlinedInput
                    {...field}
                    type={showPassword ? "text" : "password"}
                    label="Password"
                    endAdornment={
                      showPassword ? (
                        <EyeIcon
                          cursor="pointer"
                          fontSize="var(--icon-fontSize-md)"
                          onClick={() => setShowPassword(false)}
                        />
                      ) : (
                        <EyeSlashIcon
                          cursor="pointer"
                          fontSize="var(--icon-fontSize-md)"
                          onClick={() => setShowPassword(true)}
                        />
                      )
                    }
                  />
                  <FormHelperText>
                    {errors.password
                      ? errors.password.message
                      : mode === "edit"
                      ? "Leave blank to keep the current password"
                      : ""}
                  </FormHelperText>
                </FormControl>
              )}
            />

            {/* Confirm Password (create only) */}
            {mode === "create" && (
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.confirmPassword} fullWidth>
                    <InputLabel>Confirm password</InputLabel>
                    <OutlinedInput
                      {...field}
                      type={showConfirm ? "text" : "password"}
                      label="Confirm password"
                      endAdornment={
                        showConfirm ? (
                          <EyeIcon
                            cursor="pointer"
                            fontSize="var(--icon-fontSize-md)"
                            onClick={() => setShowConfirm(false)}
                          />
                        ) : (
                          <EyeSlashIcon
                            cursor="pointer"
                            fontSize="var(--icon-fontSize-md)"
                            onClick={() => setShowConfirm(true)}
                          />
                        )
                      }
                    />
                    {errors.confirmPassword && (
                      <FormHelperText>{errors.confirmPassword.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            )}

            {/* API error (from service) or root error */}
            {serverError && <Alert color="error">{serverError}</Alert>}
            {errors.root && <Alert color="error">{errors.root.message}</Alert>}
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

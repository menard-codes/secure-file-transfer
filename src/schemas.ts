import z from "zod";

export const FileUploadSchema = z.object({
    passphrase: z.string().min(4, 'Minimum length of passphrase is at least 4').max(40, 'Max passphrase reached'),
    expiration: z.enum(['7 Days', '3 Days', '24 Hours', '12 Hours', '4 Hours', '1 Hour', '5 Minutes'])
});

export type ExpirationEnum = z.infer<typeof FileUploadSchema.shape.expiration>;

export const FileAccessRequestSchema = FileUploadSchema.omit({ expiration: true });

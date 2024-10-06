import z from "zod";

export const FileUploadSchema = z.object({
    passphrase: z.string(),
    expiration: z.enum(['7 Days', '3 Days', '24 Hours', '12 Hours', '4 Hours', '1 Hour', '5 Minutes', '1 Minute'])
});

export type ExpirationEnum = z.infer<typeof FileUploadSchema.shape.expiration>;

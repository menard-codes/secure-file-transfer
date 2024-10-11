import type { Request, Response } from 'express';
import bcrypt from "bcrypt";
import { FileUploadSchema } from "~/schemas";
import { getExpISOString } from "~/utils";
import { SALT_ROUNDS } from "~/constants";
import { scheduleFileDeletion } from "~/background-tasks";
import { uploadFile } from "~/myPinata";
import { ErrorResponseTemplates } from "~/routes/response-templates";

export class UploadHandlers {
    public static async GET(req: Request, res: Response) {
        res.render('upload', { errors: {}, data: {} });
    }

    public static async POST(req: Request, res: Response) {
        const data = req.body;
        const attachment = req.file;
    
        // 1. Check file attachment and upload metadata from request
        const parsedFileUpload = FileUploadSchema.safeParse(data);
        if (parsedFileUpload.error) {
            const errors = parsedFileUpload.error.flatten().fieldErrors;
            const badRequest = ErrorResponseTemplates.badRequestTemplate('Invalid Form Upload', errors as { [key: string]: string });
            console.log(badRequest);
            res.statusCode = badRequest.status;
            res.statusMessage = badRequest.statusText;
            res.json(badRequest);
            return;
        }
        if (!attachment) {
            const badRequest = ErrorResponseTemplates.badRequestTemplate('File is required', {attachment: 'Invalid or missing file'});
            console.log(badRequest);
            res.statusCode = badRequest.status;
            res.statusMessage = badRequest.statusText;
            res.json(badRequest);
            return;
        }
        
        // 2. Upload the file to Pinata
        const file = new File([attachment.buffer], attachment.originalname, {
            type: attachment.mimetype
        });
        const uploadedFile = await uploadFile(file);
        if (!uploadedFile) {
            console.error('Got undefined after uploading to Pinata. Needs further investigation.');
            const serverError = ErrorResponseTemplates.internalServerError();
    
            res.statusCode = serverError.status;
            res.statusMessage = serverError.statusText;
            res.json(serverError);
            return;
        }
    
        // 3. Save a record in the database about the uploaded file
        const expiration = getExpISOString(parsedFileUpload.data.expiration);
        const uploadedFileRecord = await prisma.$transaction(async (tx) => {
            try {
                const salt = await bcrypt.genSalt(SALT_ROUNDS);
                const hashedPassphrase = await bcrypt.hash(parsedFileUpload.data.passphrase, salt);
                return await tx.view.create({
                    data: {
                        cid: uploadedFile.cid,
                        hashedPassphrase,
                        share: {
                            create: {
                                expiration
                            }
                        },
                        fileId: uploadedFile.id
                    },
                    select: {
                        share: true
                    }
                });
            } catch (error) {
                console.error('Something went wrong while saving to database');
                console.error(error);
            }
        });
        
        if (!uploadedFileRecord || !uploadedFileRecord.share) {
            console.log('Saving file record Share and View is returning an undefined. Needs further investigation');
            const serverError = ErrorResponseTemplates.internalServerError();
            res.statusCode = serverError.status;
            res.statusMessage = serverError.statusText;
            res.json(serverError);
            return;
        }
    
        // 4. Add file deletion job to trigger on selected time
        scheduleFileDeletion(uploadedFile.id, uploadedFileRecord.share.id, uploadedFileRecord.share.expiration)
    
        res.json({
            data: {
                redirect: `/files/share/${uploadedFileRecord.share.id}`
            }
        });
    }
}

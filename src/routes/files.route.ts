import type { BadRequest, InternalServerError } from "~/response.schema";

import { Router } from "express";
import multer from "multer";
import bcrypt from 'bcrypt';

import { manuallyDeleteFile, scheduleFileDeletion } from "~/background-tasks";
import { getFileUrl, uploadFile } from "~/myPinata";
import { FileUploadSchema, FileAccessRequestSchema } from "~/schemas";
import { getExpISOString } from "~/utils";
import { SALT_ROUNDS } from "~/constants";

export const filesRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

filesRouter.get('/view/:id', async (req, res) => {
    const { id } = req.params;
    const viewFile = await prisma.view.findUnique({
        where: { id },
        select: {
            share: {
                select: {
                    expiration: true
                }
            }
        }
    });

    if (!viewFile) {
        res.statusCode = 404;
        res.send('Not Found');
        return;
    }

    const formatter = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZoneName: 'short'
    });
    const expiration = formatter.format(viewFile?.share?.expiration);
    res.render('view', { viewId: id, expiration });
});

filesRouter.post('/view/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    // 1. Check if the uploaded file record still exists
    const viewFile = await prisma.view.findUnique({
        where: { id },
        include: {
            share: {
                select: {
                    expiration: true
                }
            }
        }
    });

    if (!viewFile || !viewFile.share) {
        res.statusCode = 404;
        res.send('Not Found');
        return;
    }

    // 2. check passphrase
    const parsedData = FileAccessRequestSchema.safeParse(data);

    // 2.1 no passphrase
    if (parsedData.error) {
        res.statusCode = 400;
        res.send('passphrase required');
        return;
    }

    const enteredPassphrase = parsedData.data.passphrase;
    const storedHashedPassphrase = viewFile.hashedPassphrase;
    const isSame = await bcrypt.compare(enteredPassphrase, storedHashedPassphrase);
    
    // 2.2 Incorrect passphrase
    if (!isSame) {
        res.statusCode = 401;
        res.send('Invalid passphrase');
        return;
    }

    // 3. Authorized request, return the file
    // TODO: Change with Raw File (that'll be auto downloaded)
    const urlExpiration = 300; // URL Expiration is set to 5 minutes
    const fileUrl = await getFileUrl(viewFile.cid, urlExpiration);
    if (!fileUrl) {
        res.statusCode = 404;
        res.send('File not found');
        return;
    }
    // TODO: Autodelete file
    res.redirect(fileUrl);
});

filesRouter.get('/share/:id', async (req, res) => {
    const { id } = req.params;

    const fileRecord = await prisma.share.findUnique({
        where: { id }
    });

    if (!fileRecord) {
        res.statusCode = 404;
        res.send('Not Found');
        return;
    }

    const shareLinkRoute = `/files/view/${fileRecord.viewId}`;
    const formatter = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
    const expiration = formatter.format(new Date(fileRecord.expiration));
    
    res.render('share', { expiration, shareLinkRoute, shareId: id });
});

filesRouter.post('/share/:id', async (req, res) => {
    const { id } = req.params;
    const body = req.body;
    
    // 1. Check if share file exists
    const fileShareRecord = await prisma.share.findUnique({
        where: { id },
        include: {
            view: {
                select: {
                    hashedPassphrase: true,
                    fileId: true
                }
            }
        }
    });
    if (!fileShareRecord) {
        res.statusCode = 404;
        res.send('Not Found');
        return;
    }

    // 2. Check if passphrase is sent
    const parsedBody = FileAccessRequestSchema.safeParse(body);
    if (parsedBody.error) {
        res.statusCode = 400;
        res.send('Passphrase required');
        return;
    }

    // 3. Check if correct passphrase
    const storedHashedPass = fileShareRecord.view.hashedPassphrase;
    const enteredPassphrase = parsedBody.data.passphrase;
    const isMatch = bcrypt.compare(enteredPassphrase, storedHashedPass);
    if (!isMatch) {
        res.statusCode = 401;
        res.send('Incorrect Passphrase');
        return;
    }

    // 4. Delete file manually: File in Pinata, file record in DB, and file-deletion job
    await manuallyDeleteFile(fileShareRecord.view.fileId, fileShareRecord.id);

    res.redirect('/upload');
});

filesRouter.get('/upload', async (req, res) => {
    res.render('upload');
});

filesRouter.post('/upload', upload.single('attachment'), async (req, res) => {
    const data = req.body;
    const attachment = req.file;

    // 1. Check file attachment and upload metadata from request
    const parsedFileUpload = FileUploadSchema.safeParse(data);
    if (parsedFileUpload.error) {
        const badRequest: BadRequest = {
            status: 400,
            statusText: "Bad Request",
            message: "Invalid request body",
            error: parsedFileUpload.error,
            data: {}
        };

        console.log(badRequest);

        res.statusCode = badRequest.status;
        res.statusMessage = badRequest.statusText;
        res.json(badRequest);
        return;
    }
    if (!attachment) {
        const badRequest: BadRequest = {
            status: 400,
            statusText: "Bad Request",
            message: "File is required",
            error: parsedFileUpload.error,
            data: {}
        };

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
        const serverError: InternalServerError = {
            status: 500,
            statusText: "Internal Server Error",
            message: "Something went wrong... Please try again later or find support",
            error: {},
            data: {}
        };

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
        const serverError: InternalServerError = {
            status: 500,
            statusText: "Internal Server Error",
            message: "Something went wrong... Please try again later or find support",
            error: {},
            data: {}
        };
        res.statusCode = serverError.status;
        res.statusMessage = serverError.statusText;
        res.json(serverError);
        return;
    }

    // 4. Add file deletion job to trigger on selected time
    scheduleFileDeletion(uploadedFile.id, uploadedFileRecord.share.id, uploadedFileRecord.share.expiration)

    res.redirect(`/files/share/${uploadedFileRecord.share.id}`);
});

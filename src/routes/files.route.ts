import { Router } from "express";
import multer from "multer";
import { scheduleFileDeletion } from "~/background-tasks";
import { uploadFile } from "~/myPinata";
import { FileUploadSchema } from "~/schemas";
import { getExpISOString } from "~/utils";
import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from "~/constants";

export const filesRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

filesRouter.get('/view/:id', async (req, res) => {
    const { id } = req.params;
    res.render('view', { viewId: id });
});

filesRouter.post('/view/:id', async (req, res) => {
    // TODO: POST handler
    // * Reference: https://www.freecodecamp.org/news/how-to-hash-passwords-with-bcrypt-in-nodejs/#heading-how-to-verify-passwords-with-bcrypt
    // * Reference: https://www.npmjs.com/package/bcrypt
})

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
    
    res.render('share', { expiration, shareLinkRoute });
});

filesRouter.post('/upload', upload.single('attachment'), async (req, res) => {
    const data = req.body;
    const attachment = req.file;

    // 1. Check file attachment and upload metadata from request
    const parsedFileUpload = FileUploadSchema.safeParse(data);
    if (parsedFileUpload.error) {
        // TODO: Better error handling
        console.log(parsedFileUpload.error);
        res.statusCode = 400;
        res.send('Bad Request');
        return;
    }
    if (!attachment) {
        // TODO: Better error handling
        res.statusCode = 400;
        res.json('File upload required');
        return;
    }
    
    // 2. Upload the file to Pinata
    const file = new File([attachment.buffer], attachment.originalname, {
        type: attachment.mimetype
    });
    const uploadedFile = await uploadFile(file);
    if (!uploadedFile) {
        // TODO: Better error handling
        res.statusCode = 500;
        console.log(uploadedFile);
        res.send('Something went wrong while uploading the file');
        return;
    }

    // 3. Save a record in the database about the uploaded file
    const expiration = getExpISOString(parsedFileUpload.data.expiration);
    const uploadedFileRecord = await prisma.$transaction(async (tx) => {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const hashedPassphrase = await bcrypt.hash(parsedFileUpload.data.passphrase, salt);
        return tx.view.create({
            data: {
                fileId: uploadedFile.id,
                hashedPassphrase,
                share: {
                    create: {
                        expiration
                    }
                }
            },
            select: {
                share: true
            }
        });
    });

    // 4. Add file deletion job to trigger on selected time
    scheduleFileDeletion(uploadedFile.id, uploadedFileRecord.share!.id, uploadedFileRecord.share!.expiration)

    res.redirect(`/files/share/${uploadedFileRecord.share!.id}`);
});

import { Router } from "express";
import multer from "multer";
import { scheduleFileDeletion } from "~/background-tasks";
import { uploadFile } from "~/myPinata";
import { FileUploadSchema } from "~/schemas";
import { getExpISOString } from "~/utils";

export const filesRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

filesRouter.get('/share/:id', async (req, res) => {
    res.render('share', { id: req.params.id });
});

filesRouter.post('/upload', upload.single('attachment'), async (req, res) => {
    const data = req.body;
    const attachment = req.file;

    // 1. Check file attachment and upload metadata from request
    const parsedFileUpload = FileUploadSchema.safeParse(data);
    if (parsedFileUpload.error) {
        console.log(parsedFileUpload.error);
        res.statusCode = 400;
        res.send('Bad Request');
    }
    if (!attachment) {
        res.statusCode = 400;
        res.json('File upload required');
    }
    
    // 2. Upload the file to Pinata
    const file = new File([attachment!.buffer], attachment!.originalname, {
        type: attachment!.mimetype
    });
    const uploadedFile = await uploadFile(file);
    if (!uploadedFile) {
        // TODO: Something went wrong while uploading the file
        res.statusCode = 500;
        res.send(uploadedFile);
    }

    // 3. Save a record in the database about the uploaded file
    if (parsedFileUpload.success) {
        const expiration = getExpISOString(parsedFileUpload.data.expiration);
        const uploadedFileRecord = await prisma.fileUpload.create({
            data: {
                id: uploadedFile!.id,
                cid: uploadedFile!.cid,
                passphrase: parsedFileUpload.data.passphrase,
                expiration
            }
        });

        // * Add file deletion job to trigger on selected time
        scheduleFileDeletion(uploadedFile!.id, uploadedFileRecord.expiration)
    
        res.redirect(`/files/share/${uploadedFile!.id}`);
    }
})

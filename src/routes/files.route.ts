import { Router } from "express";
import multer from "multer";
import { uploadFile } from "~/myPinata";

export const filesRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

filesRouter.post('/upload', upload.single('attachment'), async (req, res) => {
    // TODO: Redirect to share page
    const data = req.body;
    const attachment = req.file;

    if (!attachment) {
        res.statusCode = 400;
        res.json('File upload required');
    } else {
        const file = new File([attachment.buffer], attachment.originalname, {
            type: attachment.mimetype
        });
        const uploadedFile = await uploadFile(file);
    
        res.send(uploadedFile);
    }

    res.send('done')

})

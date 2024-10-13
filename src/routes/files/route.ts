import { Router } from "express";
import multer from "multer";
import { UploadHandlers } from "./upload.handlers.ts";
import { ShareHandlers } from "./share.handlers.ts";
import { ViewHandlers } from "./view.handlers.ts";


export const filesRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

filesRouter.get('/upload', UploadHandlers.GET);
filesRouter.post('/upload', upload.single('attachment'), UploadHandlers.POST);

filesRouter.get('/share/:id', ShareHandlers.GET);
filesRouter.post('/share/:id', ShareHandlers.POST);

filesRouter.get('/view/:id', ViewHandlers.GET);
filesRouter.post('/view/:id', ViewHandlers.POST);

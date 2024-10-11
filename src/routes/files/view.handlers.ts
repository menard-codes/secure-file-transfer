import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { FileAccessRequestSchema } from "~/schemas";
import { getFileUrl } from "~/myPinata";
import { ErrorResponseTemplates } from "~/routes/response-templates";
import { rescheduleFileDeletion } from "~/background-tasks";

export class ViewHandlers {
    public static async GET(req: Request, res: Response) {
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
            res.redirect('/404');
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
    }

    public static async POST(req: Request, res: Response) {
        const { id } = req.params;
        const data = req.body;

        // 1. Check if the uploaded file record still exists
        const viewFile = await prisma.view.findUnique({
            where: { id },
            include: {
                share: {
                    select: {
                        expiration: true,
                        id: true
                    }
                }
            }
        });

        if (!viewFile || !viewFile.share) {
            res.redirect('/404');
            return;
        }

        // 2. check passphrase
        const parsedData = FileAccessRequestSchema.safeParse(data);

        // 2.1 no passphrase
        if (parsedData.error) {
            const errors = parsedData.error.flatten().fieldErrors;
            const badRequest = ErrorResponseTemplates.badRequestTemplate("Invalid credentials passed", errors as {[key: string]: string});
            res.statusCode = badRequest.status;
            res.statusMessage = badRequest.statusText;
            res.json(badRequest);
            return;
        }

        const enteredPassphrase = parsedData.data.passphrase;
        const storedHashedPassphrase = viewFile.hashedPassphrase;
        const isSame = await bcrypt.compare(enteredPassphrase, storedHashedPassphrase);
        
        // 2.2 Incorrect passphrase
        if (!isSame) {
            const unauthorizedError = ErrorResponseTemplates.unauthorizedTemplate("Invalid credentials", { passphrase: ['Invalid credentials'] });
            res.statusCode = unauthorizedError.status;
            res.statusMessage = unauthorizedError.statusText;
            res.json(unauthorizedError);
            return;
        }

        // 3. Authorized request, return the file
        const urlExpiration = 300; // URL Expiration is set to 300seconds / 5minutes
        const fileUrl = await getFileUrl(viewFile.cid, urlExpiration);
        if (!fileUrl) {
            res.redirect('/404');
            return;
        }

        // Reschedule file deletion (expiration) to be 5 minutes
        await rescheduleFileDeletion(viewFile.fileId, viewFile.share.id, urlExpiration * 1000)
        
        res.json({
            data: {
                redirect: fileUrl,
                expiration: `Expires in ${urlExpiration / 60} minutes`
            }
        });
        return;
    }
}

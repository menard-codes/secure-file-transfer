import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { FileAccessRequestSchema } from "~/schemas";
import { getFileUrl } from "~/myPinata";
import { ErrorResponseTemplates } from "~/routes/response-templates";

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
            const notFound = ErrorResponseTemplates.notFoundTemplate("Not found in our records", {});
            res.statusCode = notFound.status;
            res.statusMessage = notFound.statusText;
            res.json(notFound);
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
                        expiration: true
                    }
                }
            }
        });

        if (!viewFile || !viewFile.share) {
            const notFound = ErrorResponseTemplates.notFoundTemplate("File record not found", {});
            res.statusCode = notFound.status;
            res.statusMessage = notFound.statusText;
            res.json(notFound);
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
            const unauthorizedError = ErrorResponseTemplates.unauthorizedTemplate("Invalid credentials", { passphrase: 'Invalid credentials' });
            res.statusCode = unauthorizedError.status;
            res.statusMessage = unauthorizedError.statusText;
            res.json(unauthorizedError);
            return;
        }

        // 3. Authorized request, return the file
        // TODO: Change with Raw File (that'll be auto downloaded)
        const urlExpiration = 300; // URL Expiration is set to 5 minutes
        const fileUrl = await getFileUrl(viewFile.cid, urlExpiration);
        if (!fileUrl) {
            const notFound = ErrorResponseTemplates.notFoundTemplate("File not found", { file: 'File not found' });
            res.statusCode = notFound.status;
            res.statusMessage = notFound.statusText;
            res.json(notFound);
            return;
        }

        // TODO: Autodelete file
        res.redirect(fileUrl);

    }
}

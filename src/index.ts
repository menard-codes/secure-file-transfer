import express from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";
import { filesRouter } from "./routes/files.route";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Register view engine (ejs)
app.set('view engine', 'ejs');
app.set('views', join(dirname(fileURLToPath(import.meta.url)), '/views'));

// Serving assets
app.use(
    express.static(join(
        dirname(fileURLToPath(import.meta.url)),
        '/public'
    ))
);

// parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/files', filesRouter);

app.get('/', async (req: Request, res: Response) => {
    res.render('index');
});

// TODO: 404 page
app.use((req, res) => {res.status(404).send('Not Found')});

app.listen(PORT, () => console.log(`Server listening to port ${PORT}`));

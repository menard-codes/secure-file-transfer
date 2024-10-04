import express from "express";
import type { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
    res.json({ msg: 'hello world' });
});

app.listen(PORT, () => console.log(`Server listening to port ${PORT}`));

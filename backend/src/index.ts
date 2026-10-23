import express from "express";
import cors from "cors";
import 'dotenv/config';
import slotsRouter from "./routes/slots.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use("/slots", slotsRouter);

const port =process.env.PORT || 4000;

app.listen(port, () => console.log(`API running on http://localhost:${port}`));
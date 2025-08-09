import express from "express";
import { handleTestPdfExtract } from "../test-pdf-extract";
// Create the router
const pdfTestRouter = express.Router();
// Register the PDF test endpoint
pdfTestRouter.post("/test-pdf-extract", handleTestPdfExtract);
export default pdfTestRouter;

import { Router } from "express";
import { uploadNewsCtrl, getNewsCtrl } from "../controllers/news.controller.js";
import { authenticateJWTCtrl } from "../middlewares/authenticateJWT.js";

const routerNews = Router();

routerNews.post("/upload-news", authenticateJWTCtrl, uploadNewsCtrl);
routerNews.get("/get-news", getNewsCtrl);

export { routerNews };

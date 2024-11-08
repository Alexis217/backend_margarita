import { Router } from "express";
import { authenticateJWTCtrl } from "../middlewares/authenticateJWT.js";

import {
  emailResetPasswordCtrl,
  FormContactCtrl,
} from "../controllers/contact.controllers.js";

const routerContact = Router();

routerContact.post("/send-contact", authenticateJWTCtrl, FormContactCtrl);
routerContact.post("/reset-password", emailResetPasswordCtrl);

export { routerContact };

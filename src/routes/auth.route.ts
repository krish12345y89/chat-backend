import { Router } from "express";
import { signToken } from "../utils/jwt.util";
import { register, login, me } from "../modules/user/user.controller";
import { restAuth } from "../middlewares/auth.middleware";
import { requireFields } from "../middlewares/validate.middleware";

const router = Router();

router.post('/register', requireFields(['username','password']), register);
router.post('/login', requireFields(['username','password']), login);
router.get('/me', restAuth, me);

export default router;

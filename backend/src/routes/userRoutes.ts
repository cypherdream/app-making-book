import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.json({ users: ["Admin", "SecurityAnalyst"] });
});

export default router;

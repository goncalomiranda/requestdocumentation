import { Router } from 'express';

const router = Router();



router.get('/requests', async (req, res) => {
  try {
    const result = 'getDocumentRequests()';
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});

export default router;

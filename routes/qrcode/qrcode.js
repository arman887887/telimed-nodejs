import multer from 'multer';
import { Router } from 'express';
import  {getQrCodes } from '../../controllers/qrCodeController.js';

const router = Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); 
    }
});

const upload = multer({ storage: storage });


router.get('/:adminId', upload.none(), async (req, res) => {
    await getQrCodes(req, res);
});

export default router;

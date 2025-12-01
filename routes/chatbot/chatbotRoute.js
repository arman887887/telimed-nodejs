import multer from 'multer';
import { Router } from 'express';
import {
    QNAS,
    addQNA,
    findQNA,
    updateQNA,
    deleteQNA,
    chatBot
} from '../../controllers/ChatBotController.js'

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

router.get('/qna', upload.none(), async (req, res) => {
    await QNAS(req, res);
});

router.get('/find-qna/:id', upload.none(), async (req, res) => {
    await findQNA(req, res);
});

router.post('/add-qna', upload.none(), async (req, res) => {
    await addQNA(req, res);
});

router.put('/update-qna/:id', upload.none(), async (req, res) => {
    await updateQNA(req, res);
});

router.get('/delete-qna/:id', upload.none(), async (req, res) => {
    await deleteQNA(req, res);
});


router.post('/chatbot', upload.none(), async (req, res) => {
    await chatBot(req, res);
});

export default router;





    

import { Router } from 'express';
import { mySubscription, getSubscription, takeSubscription, getTransaction, myTransaction } from '../../controllers/subscription/subscriptionController.js';
import multer from 'multer';
import { verifyToken } from '../../middleware/verifyToken.js';
const router = Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/subscription/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); 
    }
}); 

const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
    await getSubscription(req, res);
});

router.get('/my-subscription/:id', async (req, res) => {
    await mySubscription(req, res);
});

router.post('/store', upload.single('image'), async (req, res) => {
    await takeSubscription(req, res);
});

router.get('/transaction', async (req, res) => {
    await getTransaction(req, res);
});

router.get('/my-transaction/:id', async (req, res) => {

    await myTransaction(req, res);

});

export default router;

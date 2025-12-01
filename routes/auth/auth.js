import { Router } from 'express';
import { register,login, logout, currentUser, verifyEmail } from '../../controllers/auth/authController.js';
import multer from 'multer';
import { verifyToken, verifyTokenAndSuperadmin } from '../../middleware/verifyToken.js';



const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'public/uploads/profile/'); 
  },
  filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname); 
  }
});

const upload = multer({ storage: storage });

router.post('/register', upload.single('profile'), async (req, res) => {
  await register(req, res);
});

router.post('/login', upload.single('image'), async (req, res) => {
  await login(req, res);
});


router.get('/current-user',  verifyToken,  async(req, res) => {
    await currentUser(req, res);
});


router.get('/verifyemail/:email/:token',upload.single('image'),  async(req, res) => {
  await verifyEmail(req, res);
});
router.get('/logout', verifyToken, async(req, res) => {
  await logout(req, res);
});


export default router;


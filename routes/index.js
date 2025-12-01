import { Router } from 'express';
import authRoute from './auth/auth.js'; 
import subscriptionRoute from './subscription/subscription.js';
import chatRoute from './chats/chatRoutes.js';
import qrCodeRoute from './qrcode/qrcode.js';
import chatbotRoute from './chatbot/chatbotRoute.js';

const router = Router();

router.use('/auth', authRoute);

router.use('/subscription', subscriptionRoute);

router.use('/chat', chatRoute);

router.use('/qr-code', qrCodeRoute);

router.use('/chatbot', chatbotRoute);
         
export default router;  


     
 

  
      
 
             

 
  
 
 
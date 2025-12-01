import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import  connectDB  from './config/dbConfig.js';
import router from './routes/index.js';
import express from 'express';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';  
import { socketController } from './controllers/socketController.js';  

const app = express();
const server = http.createServer(app);

const io = new Server(server, { 
  cors: {
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'],
   }
 });

dotenv.config();
connectDB();  

 if (!process.env.PASS_SEC || !process.env.JWT_SECRET) {
    console.error('Missing required environmental variables. Please check your .env file.');
    process.exit(1); 
}
 
  
app.use(cors());  

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());                                                           
app.use('/public/uploads', express.static('public/uploads'));
app.use('/api', router);

app.get('/test', (req, res) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
    });

    // let mailOptions = {
    //     from: process.env.EMAIL_USER,
    //     to: 'kunsang.dotlinkertech@gmail.com',
    //     subject: 'Test Email from Node.js',
    //     text: 'Hello, this is a test email sent using Nodemailer!',
    // };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Email sent: ' + info.response);
        return res.json('Email sent: ' + info.response);
    });
});
socketController(io); 
const PORT = process.env.PORT || 50013;
server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

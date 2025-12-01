import { Router } from 'express';
import { Groups, createGroup, joinGroup, sendMessage, getChatHistory, deleteGroup, leaveGroup, searchGroups, findGroup, updateGroup, sendIndividualMessage, findFriendChats, getAllusers } from '../../controllers/chatController.js';
import multer from 'multer';
import { verifyToken } from '../../middleware/verifyToken.js';

const router = Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/groupLogo/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

router.get('/groups/:adminId/:userId', Groups);
router.get('/group/find/:id', findGroup);
router.get('/groups/search/:adminId/:groupName', searchGroups);
router.post('/group/create', upload.single('groupLogo'), createGroup);

router.delete('/group/delete/:groupId', deleteGroup);
router.put('/group/update/:groupId', upload.single('groupLogo'), updateGroup);

router.post('/group/join', upload.single('groupLogo'), joinGroup);
router.post('/group/leave', upload.single('groupLogo'), leaveGroup);
router.post('/message/send', upload.single('groupLogo'), sendMessage);
router.get('/group/history/:groupId/:userId', upload.single('groupLogo'), getChatHistory);


router.get('/get/all-users/:adminId/:userId', getAllusers);

router.get('/friend/:senderId/:receiverId', findFriendChats);
router.post('/individual/message/send', upload.single('groupLogo'), sendIndividualMessage);

export default router;
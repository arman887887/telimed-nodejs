import { Schema, model } from 'mongoose';
const qnaSchema = new Schema({
    question: { type: String,  required: false },
    answer: { type: String, required: false },
},
    { timestamps: true }

);

const QNA = model('QNA', qnaSchema, 'qna');
export default QNA;

 

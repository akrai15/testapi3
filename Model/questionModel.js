import mongoose from 'mongoose';
import User from './userModel.js';
// Schema for answers
const answerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    answerText: { type: String, required: true },
    
});

// Schema for questions
const questionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    questionText: { type: String, required: true },
    answers: [answerSchema],
   
}, {
    timestamps: true
});

const Question = mongoose.model('Question', questionSchema);

export default Question;

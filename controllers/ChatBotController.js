import QNA from "../models/qnaModel.js"
import { sendSuccess, created, sendError }  from "../utills/sendResponse.js";
import stringSimilarity from 'string-similarity';

export const QNAS = async (req, res) => {
    try {
         const qna = await QNA.find();
    
        if (qna) {
            return sendSuccess(res, qna);
    
        } else {
            return sendError(res, "QNA not found");
        }
    
    } catch (error) {
        return sendError(res, error.message);
    } 
};

export const addQNA = async (req, res) => {
    try {
        const { question, answer } = req.body;
        const addQNA = await QNA.create({
            question,
            answer
        });

        if (addQNA) {
            return sendSuccess(res, addQNA,'QNA Added Successfully');
        }
    } catch (error) {
        return sendError(res, error.message);
    }
};

export const findQNA = async (req, res) => {
    try {
        const { id } = req.params;
        let qna;

        if (id) {
            qna = await QNA.findById(id);
        } else {
            qna = await QNA.find();
        }

        if (qna) {
            return sendSuccess(res, qna);
        } else {
            return sendError(res, "QNA not found");
        }
    } catch (error) {
        return sendError(res, error.message);
    }
};

export const updateQNA = async (req, res) => {
    try {
        const { id } = req.params;
        const { question, answer } = req.body;
        const updatedQNA = await QNA.findByIdAndUpdate(
            id,
            { question, answer },
            { new: true, runValidators: true }
        );

        if (updatedQNA) {
            return sendSuccess(res, updatedQNA, "QNA Updated Successfully");
        } else {
            return sendError(res,"", "QNA not found or not updated");
        }
    } catch (error) {
        return sendError(res, error.message);
    }
};

export const deleteQNA = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedQNA = await QNA.findByIdAndDelete(id);

        if (deletedQNA) {
            return sendSuccess(res, "", "QNA deleted successfully" );
        } else {
            return sendError(res,"", "QNA not found");
        }
    } catch (error) {
        return sendError(res, error.message);
    }
};



let pendingSuggestion = null;

export const chatBot = async (req, res) => {
    const { message } = req.body; 
    if (!message) {
        return res.status(400).json({ error: 'Message is required' }); 
    }

    const userMessage = message.toLowerCase().trim(); 
    let response = '';

    try {
        const qna = await QNA.find();

        const normalizeText = text =>
            text
                .replace(/[^\w\s]/gi, '') 
                .replace(/(.)\1+/g, '$1') 
                .trim()
                .toLowerCase();

        const questions = qna.map(q => normalizeText(q.question));
        const normalizedMessage = normalizeText(userMessage);

        if (pendingSuggestion && (normalizedMessage === 'yes' || normalizedMessage === 'agree')) {
            response = pendingSuggestion.answer;
            pendingSuggestion = null; 
        } else if (pendingSuggestion && normalizedMessage === 'no') {
            response = 'Okay, let us know your question again.';
            pendingSuggestion = null; 
        } else {
           
            const bestMatch = stringSimilarity.findBestMatch(normalizedMessage, questions);

            if (bestMatch.bestMatch.rating > 0.6) {
               
                const matchedQuestion = bestMatch.bestMatch.target;
                const matchedQna = qna.find(q => normalizeText(q.question) === matchedQuestion);
                response = matchedQna.answer;
            } else if (bestMatch.bestMatch.rating > 0.3) {
                const suggestedQuestion = bestMatch.bestMatch.target;
                pendingSuggestion = qna.find(q => normalizeText(q.question) === suggestedQuestion);
                response = `Did you mean: "${suggestedQuestion}"? Reply with "yes" or "no" to confirm.`;
            } else {
                response = 'You will get a call from our team for further support.';
            }
        }

        res.json({ response });
    } catch (error) {

        console.error('Error fetching QNA:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// } else if (/strata title\b/i.test(message)) {
//     response = 'Strata title is a form of ownership devised for multi-level apartment blocks and horizontal subdivisions with shared areas.';
// } else if (/\bmanage(s|r|ment)\b/i.test(message)) {
//     response = 'The owners corporation, made up of all the owners in the strata scheme, manages the strata scheme. They may also engage a strata manager.';
// } else if (/\blevies\b/i.test(message)) {
//     response = 'Levies are fees that all owners must pay to cover the cost of running the strata scheme, including maintenance, insurance, and other expenses.';
// } else if (/\bdecisions\b/i.test(message)) {
//     response = 'Decisions in a strata scheme are made by the owners corporation at general meetings, where owners vote on motions.';
// } else if (/\bcommon property\b/i.test(message)) {
//     response = 'Common property includes areas of the strata scheme that are shared by all owners, such as gardens, hallways, and pools.';
// } else if (/\bexecutive committee\b/i.test(message)) {
//     response = 'You can become a member of the executive committee by being elected at the annual general meeting by other owners.';
// } else if (/\bowners corporation\b/i.test(message)) {
//     response = 'The owners corporation is responsible for managing common property, enforcing by-laws, and maintaining insurance for the strata scheme.';
// } else if (/\bdisputes\b/i.test(message)) {
//     response = 'Disputes in a strata scheme can be resolved through mediation, tribunal hearings, or court proceedings, depending on the nature of the dispute.';
// } else if (/\bby-laws\b/i.test(message)) {
//     response = 'By-laws are rules made by the owners corporation that govern the use of common property and the behavior of residents within the strata scheme.';
// } 
















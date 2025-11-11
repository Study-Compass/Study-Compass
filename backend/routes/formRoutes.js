const express = require("express");
const router = express.Router();
const {
    verifyToken,
    verifyTokenOptional,
} = require("../middlewares/verifyToken.js");
const getModels = require("../services/getModelService.js");



router.get("/get-form-by-id/:id", verifyTokenOptional, async (req, res) => {
    try{
        const { Form } = getModels(req, "Form");
        const formId = req.params.id;
        const form = await Form.findById(formId);
        if(!form) return res.status(404).json({ success: false, message: "Form not found" });
        res.status(200).json({ success: true, form: form });
    } catch(error){
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});


// ---- SUBMIT FORM RESPONSE ----
router.post("/submit-form-response", verifyToken, async (req, res) => {
    try {
        const { formId, responses } = req.body;
        const { Form, FormResponse } = getModels(req, "Form", "FormResponse");
        const userId = req.user?.userId;

        console.log("Form submission request:", { formId, responsesCount: responses?.length, userId });

        if (!formId || !responses) {
            return res.status(400).json({ success: false, message: "Missing formId or responses" });
        }

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        // Make sure the form exists
        const form = await Form.findById(formId);
        if (!form) {
            return res.status(404).json({ success: false, message: "Form not found" });
        }

        console.log("Form found:", form.title, "Questions:", form.questions.length);

        // Convert responses array to answers array in the same order as questions
        // responses format: [{ referenceId, answer, question, type }, ...]
        // answers format: [answer1, answer2, ...] in order of questions
        const answers = form.questions.map((question, index) => {
            const response = responses.find(r => {
                // Try to match by referenceId (string comparison)
                const questionIdStr = question._id.toString();
                const responseIdStr = r.referenceId?.toString();
                return questionIdStr === responseIdStr;
            });
            if (!response) {
                console.log(`No response found for question ${index + 1}: ${question.question}`);
            }
            return response ? response.answer : null;
        });

        console.log("Converted answers:", answers.length, "answers");

        // Save a new FormResponse using the schema correctly
        const formResponse = new FormResponse({
            formSnapshot: form.toObject(),
            form: formId,
            submittedBy: userId,
            answers: answers,
            submittedAt: new Date()
        });

        await formResponse.save();

        console.log("Form response saved successfully:", formResponse._id);

        res.status(201).json({ success: true, message: "Form response submitted", formResponse });
    } catch (error) {
        console.error("Error submitting form response:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error", 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ---- GET FORM RESPONSES FOR ORG DASHBOARD ----
// This route must come after the more specific routes above
router.get("/form/:formId/responses", verifyToken, async (req, res) => {
    try {
        const { Form, FormResponse, OrgMember } = getModels(req, "Form", "FormResponse", "OrgMember");
        const formId = req.params.formId;
        const userId = req.user?.userId;

        // Fetch form to ensure it exists and get org
        const form = await Form.findById(formId).lean();
        if (!form) {
            return res.status(404).json({ success: false, message: "Form not found" });
        }

        // Check if form belongs to an org and user has permission
        if (form.formOwnerType === 'Org') {
            const orgId = form.formOwner;
            // Check if user is a member of the org with admin/owner role
            const orgMember = await OrgMember.findOne({
                org_id: orgId,
                user_id: userId,
            });

            console.log("orgMember", orgMember);

            if (!orgMember) {
                return res.status(403).json({ 
                    success: false, 
                    message: "You do not have permission to view form responses" 
                });
            }
        } else if (form.formOwnerType === 'User') {
            // If form is owned by a user, only that user can see responses
            if (form.formOwner.toString() !== userId) {
                return res.status(403).json({ 
                    success: false, 
                    message: "You do not have permission to view form responses" 
                });
            }
        }

        // Fetch all responses for this form, and populate user fields for dashboard display
        const responses = await FormResponse.find({ form: formId })
            .populate("submittedBy", "name email")
            .sort({ submittedAt: -1 })
            .lean();

        res.status(200).json({ success: true, responses });
    } catch (error) {
        console.error("Error fetching form responses:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});



module.exports = router;
const express = require("express");
const router = express.Router();
const {
    verifyToken,
    verifyTokenOptional,
} = require("../middlewares/verifyToken.js");
const getModels = require("../services/getModelService.js");
const FormResponse = require("../events/schemas/formResponse.js");



router.get("/get-form-by-id/:id", verifyToken, async (req, res) => {
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
        const { Form } = getModels(req, "Form");

        if (!formId || !responses) {
            return res.status(400).json({ success: false, message: "Missing formId or responses" });
        }

        // Make sure the form exists
        const form = await Form.findById(formId);
        if (!form) {
            return res.status(404).json({ success: false, message: "Form not found" });
        }

        // Save a new FormResponse
        const formResponse = new FormResponse({
            formSnapshot: form.toObject(),
            form: formId,
            user: req.user?.id,
            responses: responses,
            submittedAt: new Date()
        });

        await formResponse.save();

        res.status(201).json({ success: true, message: "Form response submitted", formResponse });
    } catch (error) {
        console.error("Error submitting form response:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// ---- GET FORM RESPONSES FOR ORG DASHBOARD ----
router.get("/:formId/responses", verifyToken, async (req, res) => {
    try {
        const { Form } = getModels(req, "Form");
        const formId = req.params.formId;

        // Fetch form to ensure it exists and get org
        const form = await Form.findById(formId).lean();
        if (!form) {
            return res.status(404).json({ success: false, message: "Form not found" });
        }

        // Optionally, you may want to check permissions here:
        // e.g. only org admins/owners can see responses

        // Fetch all responses for this form, and populate user fields for dashboard display
        const responses = await FormResponse.find({ form: formId })
            .populate("user", "name email")
            .sort({ submittedAt: -1 })
            .lean();

        res.status(200).json({ success: true, responses });
    } catch (error) {
        console.error("Error fetching form responses:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});



module.exports = router;
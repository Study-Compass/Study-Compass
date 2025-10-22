const express = require("express");
const router = express.Router();
const {
    verifyToken,
    verifyTokenOptional,
} = require("../middlewares/verifyToken.js");
const getModels = require("../services/getModelService.js");

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

module.exports = router;
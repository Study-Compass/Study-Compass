const express = require("express");
const router = express.Router();
const {
    verifyToken,
    verifyTokenOptional,
} = require("../middlewares/verifyToken.js");
const mongoose = require("mongoose");
const { clean, isProfane } = require("../services/profanityFilterService.js");
const getModels = require("../services/getModelService.js");
const { Resend } = require('resend');
const { render } = require('@react-email/render')
const React = require('react');
const ForgotEmail = require('../emails/ForgotEmail').default;
const resend = new Resend(process.env.RESEND_API_KEY);
const multer = require('multer');
const path = require('path');
const { uploadImageToS3, upload } = require('../services/imageUploadService');
const { requireMemberManagement } = require('../middlewares/orgPermissions');
const NotificationService = require('../services/notificationService');

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size exceeds 5MB limit.'
            });
        }
    } else if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
};

//Route to get a specific org by name
router.get("/get-org/:id", verifyToken, async (req, res) => {
    //May eventually change login permissions
    const { Org } = getModels(req, "Org");

    try {
        const orgId = req.params.id;

        //Find the Org
        const org = await Org.find({ _id: orgId });

        if (org !== null) {
            // If the org exists, return it
            console.log(`GET: /get-org/${orgId}`);
            res.json({ success: true, message: "Org found", org: org });
        } else {
            // If not found, return a 404 with a message
            return res.status(404).json({ success: false, message: "Org not found" });
        }
    } catch (error) {
        // Handle any errors that occur during the process
        console.log(`GET: /get-org failed`, error);
        return res
            .status(500)
            .json({
                success: false,
                message: "Error retrieving org data",
                error: error.message,
            });
    }
});

router.get("/get-org-by-name/:name", verifyToken, async (req, res) => {
    const { Org, OrgMember, OrgFollower, Event, User, OrgMemberApplication } = getModels(req, "Org", "OrgMember", "OrgFollower", "Event", "User", "OrgMemberApplication");
    const { exhaustive } = req.query;

    try {
        const orgName = req.params.name;

        const org = await Org.findOne({ org_name: orgName }).populate('memberForm');

        if (!org) {
            console.log(`GET: /get-org-by-name/${orgName} - Org not found`);
            return res.status(404).json({ success: false, message: "Org not found" });
        }

        const exhaustiveData = {
            eventCount: 0,
            memberCount: 0,
            followerCount: 0,
        }

        if(exhaustive){
            const eventCount = await Event.countDocuments({hostingId: org._id, start_time: {$gte: new Date()}, status: { $in: ["approved", "not-applicable"] }});
            exhaustiveData.eventCount = eventCount;
        console.log(exhaustiveData);
        }
        const orgMembers = await OrgMember.find({ org_id: org._id }).populate(
            "user_id"
        );
        const orgFollowers = await OrgFollower.find({ org_id: org._id }).populate(
            "user_id"
        );
        //check if the user has applied to the org
        const user = await User.findById(req.user.userId);
        const existingApplication = await OrgMemberApplication.findOne({org_id: org._id, user_id: user._id, status: "pending"});
        const isMember = orgMembers.some(member => member.user_id._id.toString() === user._id.toString());
        const isFollower = orgFollowers.some(follower => follower.user_id._id.toString() === user._id.toString());
        const isPending = existingApplication ? true : false;

        // If the org exists, return it
        console.log(`GET: /get-org-by-name/${orgName}`);
        res.json({
            success: true,
            message: "Org found",
            org: {
                overview: org,
                members: orgMembers,
                followers: orgFollowers,
                isMember: isMember,
                isFollower: isFollower,
                isPending: isPending,
            },
            exhaustive: exhaustive ? exhaustiveData : null
        }); 
    } catch (error) {
        // Handle any errors that occur during the process
        console.log(`GET: /get-org-by-name failed`, error);
        return res
            .status(500)
            .json({
                success: false,
                message: "Error retrieving org data",
                error: error.message,
            });
    }
});

router.post("/create-org", verifyToken, upload.single('image'), handleMulterError, async (req, res) => {
    const { Org, OrgMember, User } = getModels(req, "Org", "OrgMember", "User");
    const {
        org_name,
        org_description,
        positions,
        weekly_meeting,
        custom_roles
    } = req.body;
    const file = req.file;

    try {
        //Verify user and have their orgs saved under them
        const userId = req.user.userId;
        const user = await User.findById({ _id: userId });
        console.log(user);
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }

        const orgExist = await Org.findOne({ org_name: org_name });
        //Check to verify if the org already exists
        if (orgExist) {
            return res
                .status(400)
                .json({ success: false, message: "Org name already exists" });
        }
        if (isProfane(req.body.org_name)) {
            //Check if Bad Words
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Org name contains inappropriate language",
                });
        }

        const cleanOrgName = clean(org_name); // Sanitize org name and description verify this right
        if (isProfane(org_description)) {
            //Check if Bad Words
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Description contains inappropriate language",
                });
        }

        const cleanOrgDescription = clean(org_description);

        // Prepare default roles
        const defaultRoles = [
            {
                name: 'owner',
                displayName: 'Owner',
                permissions: ['all'],
                isDefault: false,
                canManageMembers: true,
                canManageRoles: true,
                canManageEvents: true,
                canViewAnalytics: true,
                order: 0
            },
            {
                name: 'admin',
                displayName: 'Administrator',
                permissions: ['manage_members', 'manage_events', 'view_analytics'],
                isDefault: false,
                canManageMembers: true,
                canManageRoles: false,
                canManageEvents: true,
                canViewAnalytics: true,
                order: 1
            },
            {
                name: 'officer',
                displayName: 'Officer',
                permissions: ['manage_events'],
                isDefault: false,
                canManageMembers: false,
                canManageRoles: false,
                canManageEvents: true,
                canViewAnalytics: false,
                order: 2
            },
            {
                name: 'member',
                displayName: 'Member',
                permissions: ['view_events'],
                isDefault: true,
                canManageMembers: false,
                canManageRoles: false,
                canManageEvents: false,
                canViewAnalytics: false,
                order: 3
            }
        ];

        // Parse and merge custom roles if provided
        let allRoles = [...defaultRoles];
        if (custom_roles) {
            try {
                const parsedCustomRoles = JSON.parse(custom_roles);
                if (Array.isArray(parsedCustomRoles)) {
                    // Add custom roles with proper order
                    parsedCustomRoles.forEach((customRole, index) => {
                        const roleWithOrder = {
                            ...customRole,
                            order: defaultRoles.length + index,
                            isDefault: false
                        };
                        allRoles.push(roleWithOrder);
                    });
                }
            } catch (error) {
                console.error('Error parsing custom roles:', error);
                // Continue with default roles only if parsing fails
            }
        }

        const newOrg = new Org({
            org_name: cleanOrgName,
            org_description: cleanOrgDescription,
            positions: allRoles,
            weekly_meeting: weekly_meeting || null,
            //Owner is the user
            owner: userId,
        });

        // Handle image upload if file is present
        if (file) {
            console.log('Uploading image');
            const fileExtension = path.extname(file.originalname);
            const fileName = `${newOrg._id}${fileExtension}`;
            const imageUrl = await uploadImageToS3(file, 'orgs', fileName);
            newOrg.org_profile_image = imageUrl;
        } else {
            // Set default image if no file uploaded
            newOrg.org_profile_image = '/Logo.svg';
        }

        const newMember = new OrgMember({
            //add new member to the org
            org_id: newOrg._id,
            user_id: userId,
            role: 'owner', // Set the creator as owner
            status: 'active',
            assignedBy: userId
        });

        await newMember.save();

        user.clubAssociations.push(newOrg._id);
        await user.save();

        const saveOrg = await newOrg.save(); //Save the org
        console.log(`POST: /create-org`);
        return res
            .status(200)
            .json({
                success: true,
                message: "Org created successfully",
                org: saveOrg,
            });
    } catch (error) {
        // Handle any errors that occur during the process
        console.log(`POST: /create-org failed`, error);
        return res
            .status(500)
            .json({
                success: false,
                message: "Error creating org",
                error: error.message,
            });
    }
});
//add org perms
router.post("/edit-org", verifyToken, upload.single('image'), handleMulterError, async (req, res) => {
    const { Org, Form } = getModels(req, "Org", "Form");
    try {
        const {
            orgId,
            org_profile_image,
            org_description,
            positions,
            weekly_meeting,
            org_name,
            requireApprovalForJoin,
            memberForm,
        } = req.body;
        const userId = req.user?.userId;
        const file = req.file;

        // Validate that the essential fields are present
        if (!orgId) {
            return res
                .status(400)
                .json({ success: false, message: "Org ID is required" });
        }

        const org = await Org.findById(orgId);

        // Check if the org exists
        console.log;
        if (!org) {
            return res.status(404).json({ success: false, message: "Org not found" });
        }

        // Check if the user is authorized to edit the org
        if (org.owner.toString() !== userId) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "You are not authorized to edit this org",
                });
        }

        // If org_name is provided, clean it and check for inappropriate language
        if (org_name) {
            const cleanOrgName = clean(org_name);

            if (isProfane(org_name)) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message: "Org name contains inappropriate language",
                    });
            }

            // Check if a org with the cleaned name already exists, excluding the current org
            const orgExist = await Org.findOne({ org_name: cleanOrgName });
            if (orgExist && orgExist._id.toString() !== orgId) {
                return res
                    .status(400)
                    .json({ success: false, message: "Org name already taken" });
            }

            // Update the org name with the clean version
            org.org_name = cleanOrgName;
        }

        // If org_description is provided, clean it
        if (org_description) {
            const cleanOrgDescription = clean(org_description);

            if (isProfane(org_description)) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message: "Description contains inappropriate language",
                    });
            }
            org.org_description = cleanOrgDescription;
        }

        // Handle image upload if file is present
        if (file) {
            console.log('Uploading new image');
            const fileExtension = path.extname(file.originalname);
            const fileName = `${org._id}${fileExtension}`;
            const imageUrl = await uploadImageToS3(file, 'orgs', fileName);
            org.org_profile_image = imageUrl;
        } else if (org_profile_image) {
            org.org_profile_image = org_profile_image;
        }

        // Update other fields only if they are provided
        if (positions) {
            try {
                // Parse positions if it's a JSON string
                const parsedPositions = typeof positions === 'string' ? JSON.parse(positions) : positions;
                org.positions = parsedPositions;
            } catch (error) {
                console.error('Error parsing positions:', error);
                return res.status(400).json({
                    success: false,
                    message: "Invalid positions data format"
                });
            }
        }
        if (requireApprovalForJoin) {
            org.requireApprovalForJoin = requireApprovalForJoin;
        }
        if (memberForm) {
            console.log(memberForm);
            if(org.memberForm) {
                const formObject = JSON.parse(memberForm);
                await Form.findByIdAndUpdate(org.memberForm, formObject);
            } else {
                const formObject = JSON.parse(memberForm);
                formObject.createdBy = userId;
                const newForm = new Form(formObject);
                await newForm.save();
                org.memberForm = newForm._id;
            }
        }
        if (weekly_meeting) {
            org.weekly_meeting = weekly_meeting;
        }

        // Save the updated org
        await org.save();

        // Send success response
        console.log(`POST: /edit-org`);
        res.json({ success: true, message: "Org updated successfully", org });
    } catch (error) {
        // Handle any errors that occur during the process
        console.log(`POST: /edit-org failed`, error);
        return res
            .status(500)
            .json({
                success: false,
                message: "Error updating org",
                error: error.message,
            });
    }
});

// Candidate: no direct frontend references found; verify before deprecating
router.delete("/delete-org/:orgId", verifyToken, async (req, res) => {
    const { Org, Follower, OrgMember } = getModels(req, "Org", "Follower", "OrgMember");
    try {
        const { orgId } = req.params;
        const userId = req.user.userId;

        const org = await Org.findById(orgId);

        //Check if the org exists
        if (!org) {
            return res.status(404).json({ success: false, message: "Org not found" });
        }

        // Verify that the user is the owner of the org
        if (org.owner.toString() !== userId) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "You are not authorized to delete this org",
                });
        }

        // Delete the org
        await Org.findByIdAndDelete(orgId);

        console.log(`DELETE: /delete-org`);
        res.json({ success: true, message: "Org deleted successfully" });
    } catch (error) {
        console.log(`DELETE: /delete-org failed`, error);
        return res
            .status(500)
            .json({
                success: false,
                message: "Error deleting org",
                error: error.message,
            });
    }
});

// UNUSED: No current frontend references; consider deprecating in favor of a future follow system
router.post("/follow-org/:orgId", verifyToken, async (req, res) => {
    const { Org, Follower } = getModels(req, "Org", "Follower");
    try {
        const { orgId } = req.params;
        const userId = req.user.userId;

        const org = await Org.findById(orgId);

        //Check if the org exists
        if (!org) {
            return res.status(404).json({ success: false, message: "Org not found" });
        }

        const alreadyFollowing = await Follower.findOne({
            user_id: userId,
            org_id: orgId,
        }); //Check if the user is already following the org
        if (alreadyFollowing) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "You are already following this org",
                });
        }

        const newFollower = new Follower({
            user_id: userId,
            org_id: orgId,
        });
        await newFollower.save();

        console.log(`POST: /follow-org`);
        res.json({ success: true, message: "Org followed successfully" });
    } catch (error) {
        console.log(`POST: /follow-org failed`, error);
        return res
            .status(500)
            .json({
                success: false,
                message: "Error following org",
                error: error.message,
            });
    }
});

// UNUSED: No current frontend references; consider deprecating in favor of a future follow system
router.post("/unfollow-org/:orgId", verifyToken, async (req, res) => {
    const { Org, Follower } = getModels(req, "Org", "Follower");
    try {
        const { orgId } = req.params;
        const userId = req.user.userId;

        const org = await Org.findById(orgId);

        //Check if the org exists
        if (!org) {
            return res.status(404).json({ success: false, message: "Org not found" });
        }

        const follower = await Follower.findOne({ user_id: userId, org_id: orgId }); //Check if the user is already following the org
        if (!follower) {
            return res
                .status(400)
                .json({ success: false, message: "You are not following this org" });
        }

        await Follower.findByIdAndDelete(follower._id);

        console.log(`POST: /unfollow-org`);
        res.json({ success: true, message: "Org unfollowed successfully" });
    } catch (error) {
        console.log(`POST: /unfollow-org failed`, error);
        return res
            .status(500)
            .json({
                success: false,
                message: "Error unfollowing org",
                error: error.message,
            });
    }
});

router.get("/get-followed-orgs", verifyToken, async (req, res) => {
    const { Follower } = getModels(req, "Follower");
    try {
        const userId = req.user.userId;

        const followedOrgs = await Follower.find({ user_id: userId }).populate(
            "org_id"
        );
        console.log(`GET: /get-followed-orgs`);
        res.json({
            success: true,
            message: "Followed orgs retrieved successfully",
            orgs: followedOrgs,
        });
    } catch (error) {
        console.log(`GET: /get-followed-orgs failed`, error);
        return res
            .status(500)
            .json({
                success: false,
                message: "Error retrieving followed orgs",
                error: error.message,
            });
    }
});

// UNUSED: Replaced by /org-roles/:orgId/members
router.get("/get-org-members/:orgId", verifyToken, async (req, res) => {
    const { Org, OrgMember } = getModels(req, "Org", "OrgMember");
    try {
        const { orgId } = req.params;
        const userId = req.user.userId;

        const org = await Org.findById(orgId);

        //Check if the org exists
        if (!org) {
            return res.status(404).json({ success: false, message: "Org not found" });
        }

        // Check if the user is a member of the org
        const member = await OrgMember.findOne({ org_id: orgId, user_id: userId });
        if (!member) {
            return res
                .status(400)
                .json({ success: false, message: "You are not a member of this org" });
        }

        const members = await OrgMember.find({ org_id: orgId }).populate("user_id");
        console.log(`GET: /get-org-members`);
        res.json({
            success: true,
            message: "Org members retrieved successfully",
            members,
        });
    } catch (error) {
        console.log(`GET: /get-org-members failed`, error);
        return res
            .status(500)
            .json({
                success: false,
                message: "Error retrieving org members",
                error: error.message,
            });
    }
});

// Candidate: No direct frontend references found; verify if still needed with new membership flows
router.post("/:orgId/apply-to-org", verifyToken, async (req, res) => {
    const { Org, OrgMemberApplication, FormResponse, Form, User, Notification, OrgMember } = getModels(req, "Org", "OrgMemberApplication", "FormResponse", "Form", "User", "Notification", "OrgMember");
    try {
        const { orgId } = req.params;
        const userId = req.user.userId;
        const { formResponse } = req.body;

        const org = await Org.findById(orgId);
        if(!org) return res.status(404).json({success: false, message: "Org not found"});
        
        if(org.requireApprovalForJoin) {
            const existingApplication = await OrgMemberApplication.findOne({org_id: orgId, user_id: userId, status: "pending"});
            if(existingApplication) return res.status(400).json({success: false, message: "You have already applied to this org"});
        } else {
            const newMember = new OrgMember({
                org_id: orgId,
                user_id: userId,
                role: 'member',
            });
            await newMember.save();
            res.status(200).json({success: true, message: "You are now a member of this org"});
            return;
        };
        
        if(org.memberForm) {
            const form = await Form.findById(org.memberForm);
            if(!form) return res.status(404).json({success: false, message: "Form not found"});
            
            // Create answers array in the same order as questions
            const answers = form.questions.map(question => {
                const response = formResponse.find(r => r.referenceId === question._id.toString());
                return response ? response.answer : null;
            });
            
            const formResponseObject = await FormResponse.create({
                form: form._id,
                formSnapshot: form.toObject(), // Store the complete form object
                submittedBy: userId,
                answers: answers,
                submittedAt: new Date(),
                lastModifiedAt: new Date(),
            });
            if(!formResponseObject) return res.status(400).json({success: false, message: "Error submitting form"});
            //check if the user has already applied to the org
            //create a new application
            const newApplication = new OrgMemberApplication({
                org_id: orgId,
                user_id: userId,
                formResponse: formResponseObject._id,
            });
            await newApplication.save();
        } else {
            const newApplication = new OrgMemberApplication({
                org_id: orgId,
                user_id: userId,
            });
            await newApplication.save();
        }

        // Send notification to org admins about the new member
        const orgAdmins = await OrgMember.find({ 
            org_id: orgId, 
            role: { $in: ['owner', 'admin'] } 
        });
        console.log('orgAdmins', orgAdmins);

        const user = await User.findById(userId);
        
        if (orgAdmins.length > 0) {
            const notificationService = NotificationService.withModels({ Notification });
            const recipients = orgAdmins.map(admin => ({
                id: admin.user_id,
                model: 'User'
            }));
            
            await notificationService.createBatchTemplateNotification(recipients, 'org_member_applied', {
                senderName: user.name || user.username,
                orgName: org.org_name,
                sender: user._id,
            });
            
            // Legacy direct notification path removed; handled via template above
        }
        res.status(200).json({success: true, message: "Application submitted successfully"});
    } catch (error) {
        console.log(`POST: /apply-to-org failed`, error);
        return res
            .status(500)
            .json({
                success: false,
                message: "Error applying to org",
                error: error.message,
            });
    }
});


// UNUSED: Superseded by DELETE /org-roles/:orgId/members/:userId


router.post("/check-org-name", verifyToken, async (req, res) => {
    const { Org } = getModels(req, "Org");
    const { orgName } = req.body;
    try {
        if (orgName.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: "Org name is required" });
        }
        if (isProfane(orgName)) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Org name contains inappropriate language",
                });
        }
        const cleanOrgName = clean(orgName);
        const orgExist = await Org.findOne({ org_name: cleanOrgName });
        if (orgExist) {
            return res
                .status(402)
                .json({ success: false, message: "Org name already exists" });
        }
        console.log(`POST: /org-name-check`);
        return res.json({ success: true, message: "Org name is available" });
    } catch (error) {
        console.log("POST: /org-name-check failed", error);
        return res
            .status(500)
            .json({
                success: false,
                message: "Error checking org name",
                error: error.message,
            });
    }
});

router.get('/get-meetings/:name', verifyToken, async(req,res)=>{
    const { Org, Event } = getModels(req, "Org", "Event");
    const name = req.params.name;
    try {
        const org = await Org.findOne({ org_name: name });
        if(!org) return res.status(404).json({ success: false, message: 'Org not found' });
        const events = await Event.find({ hostingId: org._id, hostingType: 'Org', type: "meeting" });
        console.log(`GET: /get-meetings`);
        res.json({
            success: true,
            message: "Meetings retrieved successfully",
            events,
        });
    } catch (error) {
        console.log(`GET: /get-meetings failed`, error);
        return res
            .status(500)
            .json({
                success: false,
                message: "Error retrieving meetings",
                error: error.message,
            });
    }
});

// UNUSED/DEV: Sample email sender route
router.post('/send-email', async (req,res) => {
    try{
        
        const emailHTML = await render(React.createElement(ForgotEmail, { name: "James", link: "https://study-compass.com" }));

        const { data, error } = await resend.emails.send({
            from: "Study Compass <support@study-compass.com>",
            to: ["jbliu02@gmail.com"],
            subject: "hello world",
            html: emailHTML,
          });
        if(error){
            console.log('POST: email sending error', error);
            return res.status(500).json({ success: false, message: 'Error sending email', error: error.message });
        }
        res.status(200).json({ success: true, message: 'Email sent successfully', data });
    } catch (error){
        console.log('POST: email sending error');
        res.status(500).json({ success: false, message: 'Error sending email', error: error.message });
    }
});

router.get('/get-orgs', async (req, res) => {
    try{
        const { Org } = getModels(req, 'Org');
        const orgs = await Org.find();
        console.log('GET: /get-orgs successful')
        res.status(200).json({
            success:true,
            orgs:orgs
        })
    } catch (error){
        console.log('GET: /get-orgs failed', error);
        res.status(500).json({
            sucess:false,
            
        })
    }
});

router.get('/:orgId/events', verifyToken, async (req, res) => {
    const { Event } = getModels(req, 'Event');
    try {
        const { orgId } = req.params;
        const { page = 1, limit = 15 } = req.query;
        
        const skip = (page - 1) * limit;
        
        // Find events hosted by this organization
        const events = await Event.find({
            hostingId: orgId,
            hostingType: 'Org',
            start_time: { $gte: new Date() },
            status: { $in: ['approved', 'not-applicable'] },
            isDeleted: false
        })
        .sort({ start_time: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('hostingId');

        console.log(events);
        
        const totalEvents = await Event.countDocuments({
            hostingId: orgId,
            hostingType: 'Org',
            start_time: { $gte: new Date() },
            status: { $in: ['approved', 'not-applicable'] },
            isDeleted: false
        });
        
        console.log(`GET: /${orgId}/events`);
        res.json({
            success: true,
            message: "Org events retrieved successfully",
            events,
            hasMore: events.length === parseInt(limit),
            total: totalEvents
        });
    } catch (error) {
        console.log(`GET: /${req.params.orgId}/events failed`, error);
        return res.status(500).json({
            success: false,
            message: "Error retrieving org events",
            error: error.message,
        });
    }
});

router.post('/:orgId/create-member-form', verifyToken, requireMemberManagement(), async (req, res) => {
    const { Org, Form } = getModels(req, 'Org', 'Form');
    const { form, orgId } = req.body;
    try{
        const newForm = new Form(form);
        await newForm.save();
        const org = await Org.findOneAndUpdate({_id: orgId}, {$set: {memberForm: newForm._id}});
        if(!org) return res.status(404);
        console.log('POST: /create-member-form successful');
        return res.status(200).json({success:true, message: "Form created"});
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.post('/:orgId/edit-member-form', verifyToken, requireMemberManagement(), async (req, res) => {
    const { Org, Form } = getModels(req, 'Org', 'Form');
    const { formId, form } = req.body;
    try{
        const form = await Form.findByIdAndUpdate(formId, form);
        if(!form) return res.status(404);      
        console.log('POST: /edit-member-form successful');
        return res.status(200).json({success:true, message: "Form updated"});
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
})



module.exports = router;

const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middlewares/verifyToken');
const getModels = require('../services/getModelService');

// Get all stakeholder roles
router.get('/stakeholder-roles', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { StakeholderRole } = getModels(req, 'StakeholderRole');
        
        const stakeholderRoles = await StakeholderRole.find({ isActive: true })
            .populate('currentAssignee.userId', 'name email picture')
            .populate('backupAssignees.userId', 'name email picture')
            .populate('assignmentHistory.userId', 'name email')
            .populate('assignmentHistory.assignedBy', 'name email')
            .populate('assignmentHistory.endedBy', 'name email')
            .sort({ domainId: 1, stakeholderType: 1, stakeholderName: 1 });

        res.status(200).json({
            success: true,
            data: stakeholderRoles
        });
    } catch (error) {
        console.error('Error fetching stakeholder roles:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get stakeholder roles by domain
router.get('/stakeholder-roles/domain/:domainId', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { StakeholderRole } = getModels(req, 'StakeholderRole');
        const { domainId } = req.params;

        const stakeholderRoles = await StakeholderRole.findByDomain(domainId)
            .populate('currentAssignee.userId', 'name email picture')
            .populate('backupAssignees.userId', 'name email picture')
            .sort({ stakeholderType: 1, stakeholderName: 1 });

        res.status(200).json({
            success: true,
            data: stakeholderRoles
        });
    } catch (error) {
        console.error('Error fetching stakeholder roles by domain:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get stakeholder roles by user
router.get('/stakeholder-roles/user/:userId', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { StakeholderRole } = getModels(req, 'StakeholderRole');
        const { userId } = req.params;

        const stakeholderRoles = await StakeholderRole.findByUser(userId)
            .populate('currentAssignee.userId', 'name email picture')
            .populate('backupAssignees.userId', 'name email picture')
            .sort({ domainId: 1, stakeholderType: 1 });

        res.status(200).json({
            success: true,
            data: stakeholderRoles
        });
    } catch (error) {
        console.error('Error fetching stakeholder roles by user:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get stakeholder roles by type
router.get('/stakeholder-roles/type/:stakeholderType', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { StakeholderRole } = getModels(req, 'StakeholderRole');
        const { stakeholderType } = req.params;
        const { domainId } = req.query;

        const stakeholderRoles = await StakeholderRole.findByType(stakeholderType, domainId)
            .populate('currentAssignee.userId', 'name email picture')
            .populate('backupAssignees.userId', 'name email picture')
            .sort({ domainId: 1, stakeholderName: 1 });

        res.status(200).json({
            success: true,
            data: stakeholderRoles
        });
    } catch (error) {
        console.error('Error fetching stakeholder roles by type:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Create new stakeholder role
router.post('/stakeholder-roles', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { StakeholderRole, User } = getModels(req, 'StakeholderRole', 'User');
        const stakeholderRoleData = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!stakeholderRoleData.stakeholderId || !stakeholderRoleData.stakeholderName || 
            !stakeholderRoleData.stakeholderType || !stakeholderRoleData.domainId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: stakeholderId, stakeholderName, stakeholderType, domainId'
            });
        }

        // Check if stakeholder role already exists
        const existingRole = await StakeholderRole.findOne({ 
            stakeholderId: stakeholderRoleData.stakeholderId 
        });
        
        if (existingRole) {
            return res.status(400).json({
                success: false,
                message: 'Stakeholder role with this ID already exists'
            });
        }

        // Set created by
        stakeholderRoleData.createdBy = userId;

        // Create stakeholder role
        const stakeholderRole = new StakeholderRole(stakeholderRoleData);
        await stakeholderRole.save();

        // Populate the created role
        await stakeholderRole.populate([
            { path: 'currentAssignee.userId', select: 'name email picture' },
            { path: 'backupAssignees.userId', select: 'name email picture' },
            { path: 'createdBy', select: 'name email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Stakeholder role created successfully',
            data: stakeholderRole
        });
    } catch (error) {
        console.error('Error creating stakeholder role:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update stakeholder role
router.put('/stakeholder-roles/:roleId', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { StakeholderRole } = getModels(req, 'StakeholderRole');
        const { roleId } = req.params;
        const updateData = req.body;
        const userId = req.user.userId;

        // Set last modified by
        updateData.lastModifiedBy = userId;

        const stakeholderRole = await StakeholderRole.findByIdAndUpdate(
            roleId,
            updateData,
            { new: true, runValidators: true }
        ).populate([
            { path: 'currentAssignee.userId', select: 'name email picture' },
            { path: 'backupAssignees.userId', select: 'name email picture' },
            { path: 'lastModifiedBy', select: 'name email' }
        ]);

        if (!stakeholderRole) {
            return res.status(404).json({
                success: false,
                message: 'Stakeholder role not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Stakeholder role updated successfully',
            data: stakeholderRole
        });
    } catch (error) {
        console.error('Error updating stakeholder role:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Assign user to stakeholder role
router.post('/stakeholder-roles/:roleId/assign', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { StakeholderRole, User } = getModels(req, 'StakeholderRole', 'User');
        const { roleId } = req.params;
        const { userId } = req.body;
        const assignedBy = req.user.userId;

        const stakeholderRole = await StakeholderRole.findById(roleId);
        if (!stakeholderRole) {
            return res.status(404).json({
                success: false,
                message: 'Stakeholder role not found'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user can be assigned to this role
        const canAssign = stakeholderRole.canUserBeAssigned(user);
        if (!canAssign.canAssign) {
            return res.status(400).json({
                success: false,
                message: canAssign.reason
            });
        }

        // Assign user to role
        await stakeholderRole.assignUser(userId, assignedBy);

        // Populate and return updated role
        await stakeholderRole.populate([
            { path: 'currentAssignee.userId', select: 'name email picture' },
            { path: 'backupAssignees.userId', select: 'name email picture' },
            { path: 'assignmentHistory.userId', select: 'name email' },
            { path: 'assignmentHistory.assignedBy', select: 'name email' }
        ]);

        res.status(200).json({
            success: true,
            message: 'User assigned to stakeholder role successfully',
            data: stakeholderRole
        });
    } catch (error) {
        console.error('Error assigning user to stakeholder role:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Remove user from stakeholder role
router.post('/stakeholder-roles/:roleId/remove', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { StakeholderRole } = getModels(req, 'StakeholderRole');
        const { roleId } = req.params;
        const { reason } = req.body;
        const removedBy = req.user.userId;

        const stakeholderRole = await StakeholderRole.findById(roleId);
        if (!stakeholderRole) {
            return res.status(404).json({
                success: false,
                message: 'Stakeholder role not found'
            });
        }

        // Remove user from role
        await stakeholderRole.removeUser(removedBy, reason || 'removal');

        // Populate and return updated role
        await stakeholderRole.populate([
            { path: 'currentAssignee.userId', select: 'name email picture' },
            { path: 'backupAssignees.userId', select: 'name email picture' },
            { path: 'assignmentHistory.userId', select: 'name email' },
            { path: 'assignmentHistory.endedBy', select: 'name email' }
        ]);

        res.status(200).json({
            success: true,
            message: 'User removed from stakeholder role successfully',
            data: stakeholderRole
        });
    } catch (error) {
        console.error('Error removing user from stakeholder role:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Add backup assignee to stakeholder role
router.post('/stakeholder-roles/:roleId/backup', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { StakeholderRole, User } = getModels(req, 'StakeholderRole', 'User');
        const { roleId } = req.params;
        const { userId, priority, name } = req.body;
        const assignedBy = req.user.userId;

        const stakeholderRole = await StakeholderRole.findById(roleId);
        if (!stakeholderRole) {
            return res.status(404).json({
                success: false,
                message: 'Stakeholder role not found'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is already a backup assignee
        const existingBackup = stakeholderRole.backupAssignees.find(
            backup => backup.userId.toString() === userId.toString() && backup.isActive
        );

        if (existingBackup) {
            return res.status(400).json({
                success: false,
                message: 'User is already a backup assignee for this role'
            });
        }

        // Add backup assignee
        stakeholderRole.backupAssignees.push({
            userId: userId,
            priority: priority || 1,
            name: name || 'Backup Assignee',
            assignedBy: assignedBy
        });

        await stakeholderRole.save();

        // Populate and return updated role
        await stakeholderRole.populate([
            { path: 'currentAssignee.userId', select: 'name email picture' },
            { path: 'backupAssignees.userId', select: 'name email picture' },
            { path: 'backupAssignees.assignedBy', select: 'name email' }
        ]);

        res.status(200).json({
            success: true,
            message: 'Backup assignee added successfully',
            data: stakeholderRole
        });
    } catch (error) {
        console.error('Error adding backup assignee:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Remove backup assignee from stakeholder role
router.delete('/stakeholder-roles/:roleId/backup/:backupId', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { StakeholderRole } = getModels(req, 'StakeholderRole');
        const { roleId, backupId } = req.params;

        const stakeholderRole = await StakeholderRole.findById(roleId);
        if (!stakeholderRole) {
            return res.status(404).json({
                success: false,
                message: 'Stakeholder role not found'
            });
        }

        // Find and remove backup assignee
        const backupIndex = stakeholderRole.backupAssignees.findIndex(
            backup => backup._id.toString() === backupId
        );

        if (backupIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Backup assignee not found'
            });
        }

        stakeholderRole.backupAssignees[backupIndex].isActive = false;
        await stakeholderRole.save();

        // Populate and return updated role
        await stakeholderRole.populate([
            { path: 'currentAssignee.userId', select: 'name email picture' },
            { path: 'backupAssignees.userId', select: 'name email picture' }
        ]);

        res.status(200).json({
            success: true,
            message: 'Backup assignee removed successfully',
            data: stakeholderRole
        });
    } catch (error) {
        console.error('Error removing backup assignee:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get available assignee for stakeholder role
router.get('/stakeholder-roles/:roleId/available-assignee', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { StakeholderRole } = getModels(req, 'StakeholderRole');
        const { roleId } = req.params;

        const stakeholderRole = await StakeholderRole.findById(roleId);
        if (!stakeholderRole) {
            return res.status(404).json({
                success: false,
                message: 'Stakeholder role not found'
            });
        }

        const availableAssignee = await stakeholderRole.getAvailableAssignee();

        if (!availableAssignee) {
            return res.status(404).json({
                success: false,
                message: 'No available assignee found for this role'
            });
        }

        res.status(200).json({
            success: true,
            data: availableAssignee
        });
    } catch (error) {
        console.error('Error getting available assignee:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Deactivate stakeholder role
router.post('/stakeholder-roles/:roleId/deactivate', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { StakeholderRole } = getModels(req, 'StakeholderRole');
        const { roleId } = req.params;
        const { reason } = req.body;
        const deactivatedBy = req.user.userId;

        const stakeholderRole = await StakeholderRole.findById(roleId);
        if (!stakeholderRole) {
            return res.status(404).json({
                success: false,
                message: 'Stakeholder role not found'
            });
        }

        // Remove current assignee if exists
        if (stakeholderRole.currentAssignee && stakeholderRole.currentAssignee.userId) {
            await stakeholderRole.removeUser(deactivatedBy, reason || 'role_deactivated');
        }

        // Deactivate role
        stakeholderRole.isActive = false;
        stakeholderRole.lastModifiedBy = deactivatedBy;
        await stakeholderRole.save();

        res.status(200).json({
            success: true,
            message: 'Stakeholder role deactivated successfully',
            data: stakeholderRole
        });
    } catch (error) {
        console.error('Error deactivating stakeholder role:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete stakeholder role (permanent deletion)
router.delete('/stakeholder-roles/:roleId', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { StakeholderRole } = getModels(req, 'StakeholderRole');
        const { roleId } = req.params;

        const stakeholderRole = await StakeholderRole.findById(roleId);
        if (!stakeholderRole) {
            return res.status(404).json({
                success: false,
                message: 'Stakeholder role not found'
            });
        }

        // Check if role is currently assigned
        if (stakeholderRole.currentAssignee && stakeholderRole.currentAssignee.userId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete stakeholder role that is currently assigned. Please remove the assignee first.'
            });
        }

        await StakeholderRole.findByIdAndDelete(roleId);

        res.status(200).json({
            success: true,
            message: 'Stakeholder role deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting stakeholder role:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

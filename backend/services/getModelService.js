const badgeGrantSchema = require('../schemas/badgeGrant');
const buildingSchema = require('../schemas/building');
const classroomSchema = require('../schemas/classroom');
const developerSchema = require('../schemas/developer');
const eventSchema = require('../schemas/event');
const friendshipSchema = require('../schemas/friendship');
const OIESchema = require('../schemas/OIE');
const OIEConfigSchema = require('../schemas/OIEConfig');
const orgSchema = require('../schemas/org');
const orgFollowerSchema = require('../schemas/orgFollower');
const orgMemberSchema = require('../schemas/orgMember');
const qrSchema = require('../schemas/qr');
const ratingSchema = require('../schemas/rating');
const repeatedVisitSchema = require('../schemas/repeatedVisit');
const reportSchema = require('../schemas/report');
const scheduleSchema = require('../schemas/schedule');
const searchSchema = require('../schemas/search');
const studyHistorySchema = require('../schemas/studyHistory');
const userSchema = require('../schemas/user');
const visitSchema = require('../schemas/visit');

const getModels = (req, ...names) => {
    const models = {
        BadgeGrant: req.db.model('BadgeGrant', badgeGrantSchema, 'badgeGrants'),
        Building: req.db.model('Building', buildingSchema, 'buildings'),
        Classroom: req.db.model('Classroom', classroomSchema, 'classrooms1'),
        Developer: req.db.model('Developer', developerSchema, 'developers'),
        Event: req.db.model('Event', eventSchema, 'events'),
        Friendship: req.db.model('Friendship', friendshipSchema, 'friendships'),
        OIEStatus: req.db.model('OIE', OIESchema, 'OIEStatuses'),
        OIEConfig: req.db.model('OIEConfig', OIEConfigSchema, 'OIEConfig'),
        Org: req.db.model('Org', orgSchema, 'orgs'),
        OrgFollower: req.db.model('OrgFollower', orgFollowerSchema, 'followers'),
        OrgMember: req.db.model('OrgMember', orgMemberSchema, 'members'),
        QR: req.db.model('QR', qrSchema, 'QR'),
        Rating: req.db.model('Rating', ratingSchema, 'ratings'),
        RepeatedVisit: req.db.model('RepeatedVisit', repeatedVisitSchema, 'repeatedVisits'),
        Report: req.db.model('Report', reportSchema, 'reports'),
        Schedule: req.db.model('Schedule', scheduleSchema, 'schedules'),
        Search: req.db.model('Search', searchSchema, 'searches'),
        StudyHistory: req.db.model('StudyHistory', studyHistorySchema, 'studyHistories'),
        User: req.db.model('User', userSchema, 'users'),
        Visit: req.db.model('Visit', visitSchema, 'visits')
    };

    return names.reduce((acc, name) => {
        if (models[name]) {
            acc[name] = models[name];
        }
        return acc;
    }, {});
};

//example call
// const { User, Event } = getModels(req, 'User', 'Event');

module.exports = getModels;

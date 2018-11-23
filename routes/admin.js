var express = require('express');
var router = express.Router();
var db = require('../db');
// Get list of users
router.get('/users', function(req, res) {
    var args = {
        data: req.query
    };
    db.profile.search(args, function(err, data, count) {
        if (!err && data) {
            res.json({
                "total": count,
                "rows": data
            });
        }
        else {
            res.json({
                "total": 0,
                "rows": []
            });
        }
    });
});
// Get list of exams
router.get('/exams', function(req, res) {
    var args = {
        data: req.query
    };
    db.exam.search(args, function(err, data, count) {
        if (!err && data) {
            res.json({
                "total": count,
                "rows": data
            });
        }
        else {
            res.json({
                "total": 0,
                "rows": []
            });
        }
    });
});
// Get list of schedules
router.get('/schedules', function(req, res) {
    var args = {
        data: req.query
    };
    db.schedule.search(args, function(err, data, count) {
        if (!err && data) {
            res.json({
                "total": count,
                "rows": data
            });
        }
        else {
            res.json({
                "total": 0,
                "rows": []
            });
        }
    });
});
// Get users stats
router.get('/usersStats', function(req, res) {
    var args = {
        data: req.query
    };
    db.stats.usersStats(args, function(err, totalUsers, totalStudents, totalInspectors, totalActiveUsers, totalActiveStudents, totalActiveInspectors) {
        if (!err) {
            res.json({
                "totalUsers": totalUsers,
                "totalStudents": totalStudents,
                "totalInspectors": totalInspectors,
                "totalActiveUsers": totalActiveUsers,
                "totalActiveStudents": totalActiveStudents,
                "totalActiveInspectors": totalActiveInspectors
            });
        }
        else {
            res.json({
                "totalUsers": 0,
                "totalStudents": 0,
                "totalInspectors": 0,
                "totalActiveUsers": 0,
                "totalActiveStudents": 0,
                "totalActiveInspectors": 0
            });
        }
    });
});
// Get users stats
router.get('/examsStats', function(req, res) {
    var args = {
        data: req.query
    };
    db.stats.examsStats(args, function(err, totalExams, totalPlanned, totalAccepted, totalIntercepted, totalMissed) {
        if (!err) {
            res.json({
                "totalExams": totalExams,
                "totalPlanned": totalPlanned,
                "totalAccepted": totalAccepted,
                "totalIntercepted": totalIntercepted,
                "totalMissed": totalMissed
            });
        }
        else {
            res.json({
                "totalExams": 0,
                "totalPlanned": 0,
                "totalAccepted": 0,
                "totalIntercepted": 0,
                "totalMissed": 0
            });
        }
    });
});
// Get schedules stats
router.get('/schedulesStats', function(req, res) {
    var args = {
        data: req.query
    };
    db.stats.schedulesStats(args, function(err, interval, timetable, timetableTotal, examsBeginningsTotal, inspectors, exams) {
        if (!err && timetable) {
            res.json({
                "interval": interval,
                "timetable": timetable,
                "timetableTotal": timetableTotal,
                "examsBeginningsTotal": examsBeginningsTotal,
                "inspectors": inspectors,
                "exams": exams
            });
        }
        else {
            res.json({
                "interval": 0,
                "timetable": {},
                "timetableTotal": {},
                "examsBeginningsTotal": {},
                "inspectors": {},
                "exams": []
            });
        }
    });
});
// Get inspectors stats
router.get('/inspectorsStats', function(req, res) {
    var args = {
        data: req.query
    };
    db.stats.inspectorsStats(args, function(err, data, count) {
        if (!err && data) {
            res.json({
                "total": count,
                "rows": data
            });
        }
        else {
            res.json({
                "total": 0,
                "rows": []
            });
        }
    });
});
module.exports = router;
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
    db.stats.usersStats(args, function(err, totalUsers, totalStudents, totalInspectors) {
        if (!err) {
            res.json({
                "totalUsers": totalUsers,
                "totalStudents": totalStudents,
                "totalInspectors": totalInspectors
            });
        }
        else {
            res.json({
                "totalUsers": 0,
                "totalStudents": 0,
                "totalInspectors": 0
            });
        }
    });
});
// Get users stats
router.get('/examsStats', function(req, res) {
    var args = {
        data: req.query
    };
    db.stats.examsStats(args, function(err, totalExams, totalAccepted, totalIntercepted) {
        if (!err) {
            res.json({
                "totalExams": totalExams,
                "totalAccepted": totalAccepted,
                "totalIntercepted": totalIntercepted
            });
        }
        else {
            res.json({
                "totalExams": 0,
                "totalAccepted": 0,
                "totalIntercepted": 0
            });
        }
    });
});
module.exports = router;
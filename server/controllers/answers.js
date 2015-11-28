var express = require("express"),
    router = express.Router(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    Module = require("../models/module"),
    Answer = require("../models/answer");

router.post("/", function(req, res) {
    var answer = new Answer({ 
        num        : req.body.id,
        _course    : req.body._course,
        _module    : req.body._module,
        _user      : req.body._user,
        userAnswer : req.body.userAnswer,
    });

    answer.save(function(err) {
        if (err) throw err;
        if (req.body.id == req.body.countAnswers) {
            Module.findOneAndUpdate({"_id": req.body._module}, {$set: {"available": false}}, function(err, module) {
            if (err) return err;
        });
        }
        return res.json({ success: true });
    });
});

module.exports = router;
var express = require("express"),
    async = require("async"),
    router = express.Router(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    Module = require("../models/module"),
    Question = require("../models/question"),
    Answer = require("../models/answer");

router.post("/", function(req, res) {
    var mark = 0;
    var data = req.body.data;
    if(data){  // check universal rule
        async.forEach(data, function(values, callback){
            var answer = new Answer({
                num        : values.id,
                _course    : values._course,
                _module    : values._module,
                _user      : req.body._user,
                userAnswer : values.userAnswer,
            });
            answer.save(function(err) {
                if (err) throw err;
                Question.findOne({"_course": answer._course, "_module": answer._module,"num": answer.num})
                .exec(function(error, question) {
                    if (error) throw error;  
                    var questions = question.variants;
                 // estimate of answer on close question with one right variant  
                    if (question.typeVariant == 0) {
                        for(variant in questions) {
                            if(questions[variant][1]){
                                mark = (variant == answer.userAnswer)?(mark+1):mark;
                            }
                        }
                    }
                 // estimate of answer on open question    
                    else if (question.typeVariant == 1) {
                        mark = (question.answer == answer.userAnswer)?(mark+1):mark;
                    }
                 // estimate of answer on close question with few right variants
                    else {
                            var userAnswers = answer.userAnswer.split(",");
                            var countAnswers = userAnswers.length;
                            var countVariants = 0;
                            if (countAnswers != countVariants) {   // check universal rule
                                var rightAnswers = [];
                                var rightCounter = 0;
                             // for all three methods: simple, proportional and gravimetric
                                for(variant in questions) {
                                    if(questions[variant][1]){
                                        rightAnswers.push(variant); 
                                    }
                                    countVariants++;
                                }
                                for(answer in rightAnswers) {
                                    if(userAnswers.indexOf(rightAnswers[answer]) > -1) {
                                        rightCounter++; 
                                    }
                                }
                             // only for proportional and gravimetric methods
                                if(req.body.estimateMethod == "proportional" || req.body.estimateMethod =="gravimetric"){
                                    var wrongAnswers = [];
                                    var wrongCounter = 0;
                                    var countRightVariants = 0;
                                    var countWrongVariants = 0;
                                    for(variant in questions) {
                                        if(!questions[variant][1]){
                                            wrongAnswers.push(variant);
                                            countWrongVariants++;
                                        }
                                        else {
                                            countRightVariants++;
                                        }
                                    }
                                    for(answer in wrongAnswers) {
                                        if(req.body.estimateMethod == "proportional" &&
                                           userAnswers.indexOf(wrongAnswers[answer]) == -1) 
                                        {
                                            wrongCounter++; 
                                        }
                                        else if(req.body.estimateMethod == "gravimetric" &&
                                                userAnswers.indexOf(wrongAnswers[answer]) > -1) 
                                        {
                                            wrongCounter++;
                                        }
                                    }
                                }
                             // total result
                                if (req.body.estimateMethod == "simple" && 
                                    userAnswers.length == rightAnswers.length && 
                                    rightAnswers.length == rightCounter)
                                {
                                    mark++;
                                }
                                else if(req.body.estimateMethod == "proportional")
                                {
                                    mark = mark + 1/countVariants*(rightCounter + wrongCounter);
                                }
                                else if(req.body.estimateMethod == "gravimetric")
                                {
                                    var tempMark = (1/countRightVariants*rightCounter) - (1/countWrongVariants*wrongCounter);
                                    if(tempMark > 0) {
                                        mark = mark + tempMark;
                                    }
                                }
                            }
                    }
                    callback();
                });
            });
        }, function(err) {
            if (err) throw err;
            Module.findOneAndUpdate({"_id": data[0]._module},
                {$set: {"numberOfTests": req.body.numberOfTests, "result": mark}},
                function(err, module) {
                    if (err) return err;
            });
        }); 
    }

    return res.json({ success: true });
});

module.exports = router;
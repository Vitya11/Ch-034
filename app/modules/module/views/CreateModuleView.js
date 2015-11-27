define(function(require, exports, module) {
    "use strict";

    require("ckeditor-jquery");

    var CMS = require("CMS"),

    View = CMS.View.extend({

        template: _.template(require("text!../templates/createModuleTemplate.html")),
        el: false,

        events: {
            "click #test-btn": "submitHandler"
        },

        initialize: function(options) {
            this.model = options.model;
            this.courseId = options.courseId;
            this.listenTo(this.model, "invalid", this.errorMessage);
        },

        afterRender: function() {
            $("#description").ckeditor({
                language: 'uk',
                skin:'office2013,/vendor/bower/ckeditor-office2013-skin/office2013/'
            });

            $("module-name").focus();
        },

        submitHandler: function (e) {
            e.preventDefault();
            this.saveModule();
        },

        saveModule: function () {
            $("#module-name").removeClass("error");
            $("#module-name").popover("destroy");
            this.model.set({
                title: $("#module-name").val(),
                description: $("#description").val(),
                courseId: this.courseId,
                available: $("#test-available").prop("checked")
            });
            this.model.save(null, {
                success: function(model, response){
                    $("#module-form").trigger("reset");
                    $("#module-name").focus();
                },
                error: function(model, error){
                    console.log(error);
                },
            });
        },

        errorMessage: function (model, error) {
            $("#module-name").addClass("error");
            $("#module-name").popover({
                container: "body",
                title: error.title,
                content: error.message,
                placement: "right",
                trigger: "focus, hover"
            });
            $("#module-name").popover("toggle");
        },
    });
    return View;
});
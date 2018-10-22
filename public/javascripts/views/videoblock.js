//
// Videoblock view
//
define([
    "i18n",
    "text!templates/videoblock.html",
    "views/screenwebcam"
], function(i18n, template, ScreenwebcamView) {
    console.log('views/videoblock.js');
    var View = Backbone.View.extend({
        initialize: function(options) {
            // Variables
            var self = this;
            this.options = options || {};
            // Templates
            this.templates = _.parseTemplate(template);
            // Exam model
            var Exam = Backbone.Model.extend({
                urlRoot: 'inspector/exam'
            });
            this.exam = new Exam({
                _id: this.options.examId
            });
            // Sub views
            this.view = {
                screenwebcam: new ScreenwebcamView({
                    examId: this.options.examId,
                    userId: app.profile.get('_id'),
                    capture: false,
                    webcamProctor: this.options.webcamProctor,
                    audioAutomuteFlag: this.options.audioAutomuteFlag,
                    videoAutomuteFlag: this.options.videoAutomuteFlag,
                    examSelected: true,
                    windowFocus: true
                })
            };
            this.exam.fetch({
                success: function(exam) {
                    self.render();
                }
            });
        },
        render: function() {
            var self = this;
            var tpl = _.template(this.templates['main-tpl']);
            var data = {
                i18n: i18n,
                exam: this.exam.toJSON()
            };
            this.$el.html(tpl(data));
            $.parser.parse(this.$el);
            // Views
            this.view.screenwebcam.setElement(this.$('.panel-screenwebcam'));
            // Render panels
            this.view.screenwebcam.render();
            this.view.screenwebcam.toolbar(this.exam);
            
            this.stickit(app.time);
            this.stickit(this.exam);
            return this;
        },
        mute: function(state) {
            this.view.screenwebcam.mute(state);
        },
        fixDraggablePosition: function() {
            this.view.screenwebcam.fixDraggablePosition();
        },
        destroy: function() {
            this.remove();
        }
    });
    return View;
});
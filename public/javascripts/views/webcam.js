//
// Webcam view
//
define([
    "i18n",
    "text!templates/webcam.html",
    "models/webcall"
], function(i18n, template, WebcallModel) {
    console.log('views/webcam.js');
    var View = Backbone.View.extend({
        className: "webcam-view",
        initialize: function(options) {
            this.options = options || {};
            this.audioAutomuteFlag = this.options.audioAutomuteFlag;
            this.videoAutomuteFlag = this.options.videoAutomuteFlag;
            this.windowFocus = this.options.windowFocus;
            this.buttonAudioState = true;
            this.buttonVideoState = true;
            this.templates = _.parseTemplate(template);
            this.webcall = new WebcallModel({
                userid: "camera-" + this.options.examId + "-" + this.options.userId,
                constraints: this.constraints.bind(this)
            });
        },
        destroy: function() {
            if (this.webcall) this.webcall.destroy();
            this.remove();
        },
        render: function() {
            var tpl = _.template(this.templates['main-tpl']);
            var data = {
                i18n: i18n
            };
            this.$el.html(tpl(data));
            this.$VideoInput = this.$(".webcam-input");
            this.$VideoOutput = this.$(".webcam-output");
            this.videoInput = this.$VideoInput.get(0);
            this.videoOutput = this.$VideoOutput.get(0);
            this.$VideoInput.draggable({
                onDrag: function(e) {
                    var d = e.data;
                    var parent = $(d.parent);
                    var target = $(d.target);
                    if (d.left < 0) {
                        d.left = 0;
                    }
                    if (d.top < 0) {
                        d.top = 0;
                    }
                    if (d.left + target.outerWidth() > parent.width()) {
                        d.left = parent.width() - target.outerWidth();
                    }
                    if (d.top + target.outerHeight() > parent.height()) {
                        d.top = parent.height() - target.outerHeight();
                    }
                }
            });
            this.webcall.set({
                input: this.videoInput,
                output: this.videoOutput
            });
            return this;
        },
        toolbar: function(model) {
            var self = this;
            this.$el.panel({
                tools: [{
                    iconCls: 'fa fa-play',
                    handler: function() {
                        var student = model.get('student') || {};
                        self.play(student._id);
                        $(this).parent().find('.fa-microphone-slash').attr('class', 'fa fa-microphone');
                        $(this).parent().find('.fa-eye-slash').attr('class', 'fa fa-eye');
                        self.buttonAudioState = true;
                        self.buttonVideoState = true;
                        self.updateMuteState();
                    }
                }, {
                    iconCls: 'fa fa-pause',
                    handler: function() {
                        self.stop();
                    }
                }, {
                    iconCls: 'fa fa-microphone',
                    handler: function() {
                        self.buttonAudioState = !self.buttonAudioState;
                        if (self.buttonAudioState) {
                            $(this).attr('class', 'fa fa-microphone');
                        }
                        else {
                            $(this).attr('class', 'fa fa-microphone-slash');
                        }
                        self.updateMuteState();
                    }
                }, {
                    iconCls: 'fa fa-eye',
                    handler: function() {
                        self.buttonVideoState = !self.buttonVideoState;
                        if (self.buttonVideoState) {
                            $(this).attr('class', 'fa fa-eye');
                        }
                        else {
                            $(this).attr('class', 'fa fa-eye-slash');
                        }
                        self.updateMuteState();
                    }
                }]
            });
        },
        constraints: function() {
            app.settings.refresh();
            var audioSource = app.settings.get('webcamera-audio');
            audioSource = audioSource ? audioSource.get('value') : null;
            var videoSource = app.settings.get('webcamera-video');
            videoSource = videoSource ? videoSource.get('value') : null;
            var resolution = app.settings.get('webcamera-resolution');
            resolution = resolution ? resolution.get('value').split('x') : [640, 480];
            var fps = app.settings.get('webcamera-fps');
            fps = fps ? fps.get('value') : 15;
            var constraints = {
                audio: {
                    optional: [{
                        sourceId: audioSource
                    }]
                },
                video: {
                    mandatory: {
                        maxWidth: resolution[0],
                        maxHeight: resolution[1],
                        maxFrameRate: fps,
                        minFrameRate: 1
                    },
                    optional: [{
                        sourceId: videoSource
                    }]
                }
            };
            return constraints;
        },
        mute: function(state) {
            this.webcall.toggleAudio(!state);
            this.webcall.toggleVideo(!state);
        },
        updateMuteState: function() {
            var aState = this.getAudioState();
            var newAState = false;
            if (this.audioAutomuteFlag && this.windowFocus && this.buttonAudioState) newAState = true;
            else if (!this.audioAutomuteFlag && this.buttonAudioState) newAState = true;

            var vState = this.getVideoState();
            var newVState = false;
            if (this.videoAutomuteFlag && this.windowFocus && this.buttonVideoState) newVState = true;
            else if (!this.videoAutomuteFlag && this.buttonVideoState) newVState = true;

            if (aState != newAState)
                this.webcall.toggleAudio(newAState);
            if (vState != newVState)
                this.webcall.toggleVideo(newVState);
        },
        getAudioState: function() {
            return this.webcall.audio;
        },
        getVideoState: function() {
            return this.webcall.video;
        },
        play: function(userId) {
            var peer = "camera-" + this.options.examId + "-" + userId;
            this.mute(false);
            this.webcall.call(peer);
        },
        stop: function() {
            this.webcall.stop();
        }
    });
    return View;
});
//
// Screen and webcam combined view
//
define([
    "i18n",
    "text!templates/screenwebcam.html",
    "models/webcall"
], function(i18n, template, WebcallModel) {
    console.log('views/screenwebcam.js');
    var View = Backbone.View.extend({
        className: "screenwebcam-view",
        initialize: function(options) {
            this.options = options || {};
            this.webcamProctor = this.options.webcamProctor;
            this.audioAutomuteFlag = this.options.audioAutomuteFlag;
            this.videoAutomuteFlag = this.options.videoAutomuteFlag;
            this.examSelected = this.options.examSelected;
            this.windowFocus = this.options.windowFocus;
            this.buttonAudioState = true;
            this.buttonVideoState = true;
            this.templates = _.parseTemplate(template);
            this.webcamWebcall = new WebcallModel({
                userid: "camera-" + this.options.examId + "-" + this.options.userId,
                constraints: this.webcamConstraints.bind(this)
            });
            this.screenWebcall = new WebcallModel({
                userid: "screen-" + this.options.examId + "-" + this.options.userId,
                constraints: this.constraintsScreen.bind(this)
            });
        },
        destroy: function() {
            if (this.webcamWebcall) this.webcamWebcall.destroy();
            if (this.screenWebcall) this.screenWebcall.destroy();
            this.remove();
        },
        render: function() {
            var tpl = _.template(this.templates['main-tpl']);
            var data = {
                i18n: i18n
            };
            this.$el.html(tpl(data));
            this.$ScreenOutput = this.$(".screen-output");
            this.$WebcamOutput = this.$(".webcam-output");
            this.$WebcamInput = this.$(".webcam-input");
            this.screenOutput = this.$ScreenOutput.get(0);
            this.webcamOutput = this.$WebcamOutput.get(0);
            this.webcamInput = this.$WebcamInput.get(0);
            this.$WebcamOutput.addClass('draggable');
            this.$WebcamOutput.draggable({
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
            this.webcamWebcall.set({
                input: this.webcamInput,
                output: this.webcamOutput
            });
            this.screenWebcall.set({
                input: this.screenInput,
                output: this.screenOutput
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
                        //self.mute(false); // todo play without selection
                        self.updateMuteState();
                    }
                }, {
                    iconCls: 'fa fa-pause',
                    handler: function() {
                        self.stop();
                        self.updateProctorState();
                    }
                }, {
                    iconCls: self.buttonAudioState ? 'fa fa-microphone' : 'fa fa-microphone-slash',
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
                    iconCls: self.buttonVideoState ? 'fa fa-eye' : 'fa fa-eye-slash',
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
        webcamConstraints: function() {
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
        constraintsScreen: function() {
            var constraints = {
                audio: false,
                video: true
            };
            if (this.options.capture) {
                app.settings.refresh();
                var resolution = app.settings.get('screen-resolution');
                resolution = resolution ? resolution.get('value').split('x') : [1280, 720];
                var fps = app.settings.get('screen-fps');
                fps = fps ? fps.get('value') : 5;
                var sourceId = app.settings.get('screen-id');
                sourceId = sourceId ? sourceId.get('value') : 'screen:0';
                constraints.video = {
                    mandatory: {
                        maxWidth: resolution[0],
                        maxHeight: resolution[1],
                        maxFrameRate: fps,
                        minFrameRate: 1,
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId
                    }
                };
            }
            return constraints;
        },
        mute: function(state) {
            this.webcamWebcall.toggleAudio(!state);
            this.webcamWebcall.toggleVideo(!state);
        },
        updateMuteState: function() {
            var aState = this.getAudioState();
            var newAState = false;
            if (this.audioAutomuteFlag && this.examSelected && this.windowFocus && this.buttonAudioState) newAState = true;
            else if (!this.audioAutomuteFlag && this.buttonAudioState) newAState = true;

            var vState = this.getVideoState();
            var newVState = false;
            if (this.videoAutomuteFlag && this.examSelected && this.windowFocus && this.buttonVideoState) newVState = true;
            else if (!this.videoAutomuteFlag && this.buttonVideoState) newVState = true;

            if (aState != newAState)
                this.webcamWebcall.toggleAudio(newAState);
            if (vState != newVState)
                this.webcamWebcall.toggleVideo(newVState);
            
            if (this.examSelected)
                this.updateProctorState();
        },
        updateProctorState: function() {
            if (!this.webcamInput || !this.examSelected) return;
            this.webcamProctor.get(0).srcObject = this.webcamInput.srcObject;
        },
        getAudioState: function() {
            return this.webcamWebcall.audio;
        },
        getVideoState: function() {
            return this.webcamWebcall.video;
        },
        fixDraggablePosition: function() {
            if (!this.$WebcamOutput) return;
            var target = this.$('.draggable');
            var left = parseFloat(target.css('left'));
            var top = parseFloat(target.css('top'));
            var parent = target.parent();
            if (left + target.outerWidth() > parent.width()) {
                left = parent.width() - target.outerWidth();
                target.css('left', left);
            }
            if (top + target.outerHeight() > parent.height()) {
                top = parent.height() - target.outerHeight();
                target.css('top', top);
            }
        },
        play: function(userId) {
            var peerWebcam = "camera-" + this.options.examId + "-" + userId;
            this.webcamWebcall.call(peerWebcam);
            var peerScreen = "screen-" + this.options.examId + "-" + userId;
            this.screenWebcall.call(peerScreen);
        },
        stop: function() {
            this.webcamWebcall.stop();
            this.screenWebcall.stop();
        }
    });
    return View;
});
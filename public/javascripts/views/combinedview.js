//
// Screen and webcam combined view
//
define([
    "i18n",
    "text!templates/combinedview.html",
    "models/webcall"
], function(i18n, template, WebcallModel) {
    console.log('views/combinedview.js');
    var View = Backbone.View.extend({
        className: "combined-view",
        initialize: function(options) {
            this.options = options || {};
            this.templates = _.parseTemplate(template);
            var showCamera = this.options.mainSource === 'camera' || this.options.secondarySource === 'camera';
            var showScreen = this.options.mainSource === 'screen' || this.options.secondarySource === 'screen';
            if (showCamera) {
                this.webcamWebcall = new WebcallModel({
                    userid: "camera-" + this.options.examId + "-" + this.options.userId,
                    constraints: this.webcamConstraints.bind(this)
                });
            }
            if (showScreen) {
                this.screenWebcall = new WebcallModel({
                    userid: "screen-" + this.options.examId + "-" + this.options.userId,
                    constraints: this.screenConstraints.bind(this)
                });
            }
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
            this.$MainSource = this.$(".main-source");
            this.$SecondarySource = this.$(".secondary-source");
            this.mainSource = this.$MainSource.get(0);
            this.secondarySource = this.$SecondarySource.get(0);
            if (this.options.secondarySource) {
                this.$SecondarySource.draggable({
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
            }
            else {
                this.$SecondarySource.hide();
            }
            if (this.webcamWebcall) {
                this.webcamWebcall.set({
                    input: this.secondarySource,
                    output: this.mainSource
                });
            }
            if (this.screenWebcall) {
                this.screenWebcall.set({
                    input: this.secondarySource,
                    output: this.mainSource
                });
            }
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
                    }
                }, {
                    iconCls: 'fa fa-pause',
                    handler: function() {
                        self.stop();
                    }
                }, {
                    iconCls: 'fa fa-microphone',
                    handler: function() {
                        var audio = self.webcamWebcall.toggleAudio();
                        if (audio) {
                            $(this).attr('class', 'fa fa-microphone');
                        }
                        else {
                            $(this).attr('class', 'fa fa-microphone-slash');
                        }
                    }
                }, {
                    iconCls: 'fa fa-eye',
                    handler: function() {
                        var video = self.webcamWebcall.toggleVideo();
                        if (video) {
                            $(this).attr('class', 'fa fa-eye');
                        }
                        else {
                            $(this).attr('class', 'fa fa-eye-slash');
                        }
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
        screenConstraints: function() {
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
        play: function(userId) {
            if (this.webcamWebcall) {
                var webcamPeer = "camera-" + this.options.examId + "-" + userId;
                this.mute(false);
                this.webcamWebcall.call(webcamPeer);
            }
            if (this.screenWebcall) {
                var screenPeer = "screen-" + this.options.examId + "-" + userId;
                this.screenWebcall.call(screenPeer);
            }
        },
        stop: function() {
            if (this.webcamWebcall) this.webcamWebcall.stop();
            if (this.screenWebcall) this.screenWebcall.stop();
        }
    });
    return View;
});
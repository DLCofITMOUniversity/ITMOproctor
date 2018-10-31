//
// Multivision view
//
define([
    "i18n",
    "text!templates/multivision.html",
    "views/settings",
    "views/exam/viewer",
    "views/exam/adding",
    "views/passport/viewer",
    "views/profile/viewer",
    "views/verify/maker",
    "views/members",
    "views/notes",
    "views/chat",
    "views/webcam",
    "views/combinedview",
    "views/videoblock",
    "collections/attach"
], function(i18n, template, SettingsView, ExamViewer, ExamAdding, PassportViewer, ProfileViewer, VerifyMaker, MembersView, NotesView, ChatView, WebcamView, CombinedView, VideoblockView, Attach) {
    console.log('views/multivision.js');
    var View = Backbone.View.extend({
        events: {
            "click .verify-btn": "doVerify",
            "click .screenshot-btn": "doScreenshot",
            "click .exam-add-btn": "doAdd",
            "click .exam-stop-btn": "rejectExam",
            "click .exam-apply-btn": "applyExam",
            "click .panel-videoblock": "switchExam"
        },
        bindings: {
            '.server-time': {
                observe: 'time',
                onGet: function(val) {
                    return moment(val).format('HH:mm:ss');
                }
            },
            '.duration-time': {
                observe: 'time',
                onGet: function(val) {
                    if (this.examsCount === 0 || !this.exam) return;
                    var out = '0.00:00:00';
                    var now = app.now();
                    var startDate = this.exam.get('startDate');
                    if (startDate) {
                        var diff = now.diff(startDate);
                        if (diff < 0) diff = 0;
                        out = moment(diff).utc().format('HH:mm:ss');
                    }
                    var endDate = this.exam.get('endDate');
                    if (endDate && this.$DurationWidget) {
                        if (moment(endDate).diff(now, 'minutes') <= 5)
                            this.$DurationWidget.css('color', 'red');
                        else if (moment(endDate).diff(now, 'minutes') <= 15)
                            this.$DurationWidget.css('color', 'orange');
                    }
                    for (var examId in this.exams) {
                        var endDate1 = this.exams[examId].data.get('endDate');
                        if (endDate1) {
                            var $DurationWarning = this.$VideoContainer.find('.panel-videoblock[data-id="' + examId + '"] .duration-warning');
                            if (moment(endDate1).diff(now, 'minutes') <= 5) {
                                $DurationWarning.css('display', 'block');
                                $DurationWarning.css('color', 'red');
                            }
                            else if (moment(endDate1).diff(now, 'minutes') <= 15) {
                                $DurationWarning.css('display', 'block');
                                $DurationWarning.css('color', 'orange');
                            }
                        }
                    }
                    return out;
                }
            }
        },
        initialize: function(options) {
            // Variables
            var self = this;
            this.options = options || {};
            this.protectionCode = null;
            this.audioAutomuteFlag = true;
            this.videoAutomuteFlag = false;
            this.alwaysOnTop = false;
            this.examsCount = 0;
            this.exams = {};
            this.exam = {};
            // Templates
            this.templates = _.parseTemplate(template);
            // Sub views
            this.view = {
                settings: new SettingsView(),
                profile: new ProfileViewer(),
                passport: new PassportViewer(),
                exam: new ExamViewer(),
                verify: new VerifyMaker(),
                webcam: new CombinedView({
                    examId: 'loopback',
                    userId: app.profile.get('_id'),
                    mainSource: 'camera',
                    secondarySource: false
                }),
                examAdding: new ExamAdding()
            };
            // Window events
            this.messageEventHandler = function(event) {
                var message = event.data;
                switch (message.id) {
                    case 'screenshot':
                        self.screenshotDlg(message.data);
                        break;
                }
            };
            this.throttle = function(callback) {
                var limit = 200;
                var delay = 100;
                var wait = false;
                var timeout;
                return function() {
                    if (!wait) {
                        callback.call();
                        wait = true;
                        setTimeout(function() {
                            wait = false;
                        }, limit);
                    }
                    // Debouncing
                    clearTimeout(timeout);
                    timeout = setTimeout(callback, delay);
                };
            };
            this.resizeEventHandler = function(event) {
                self.updateBlockPositions();
            };
            this.hashchangeEventHandler = function(event) {
                self.addAllExams();
            };
            this.focusEventHandler = function(event) {
                if (self.examsCount === 0 || !self.exam) return;
                for (var examId in self.exams) {
                    self.exams[examId].videoblock.view.screenwebcam.windowFocus = true;
                    self.exams[examId].videoblock.view.screenwebcam.updateMuteState();
                }
            };
            this.blurEventHandler = function(event) {
                if (self.examsCount === 0 || !self.exam) return;
                for (var examId in self.exams) {
                    self.exams[examId].videoblock.view.screenwebcam.windowFocus = false;
                    self.exams[examId].videoblock.view.screenwebcam.updateMuteState();
                }
            };
            this.newNotificationHandler = function(data) {
                self.newNotification(data);
            };
            window.addEventListener('message', this.messageEventHandler);
            window.addEventListener('resize', this.throttle(this.resizeEventHandler));
            window.addEventListener('hashchange', this.hashchangeEventHandler);
            window.addEventListener('focus', this.focusEventHandler);
            window.addEventListener('blur', this.blurEventHandler);
            // Socket events
            this.connectHandler = function(data) {
                self.$NetworkWidget.html(i18n.t('multivision.online'));
                self.$NetworkWidget.css('color', 'green');
            };
            this.disconnectHandler = function(data) {
                self.$NetworkWidget.html(i18n.t('multivision.offline'));
                self.$NetworkWidget.css('color', 'red');
            };
            app.io.notify.on('connect', this.connectHandler);
            app.io.notify.on('disconnect', this.disconnectHandler);
            // Timers
            var t1 = setInterval(function() {
                if (!self.exam) return;
                for (var examId in self.exams) {
                    var student = self.exams[examId].data.get('student');
                    if (student && student.provider) {
                        self.getExamStatus(examId);
                    }
                }
            }, REQUEST_INTERVAL * 1000);
            this.timers = [t1];
        },
        render: function() {
            var self = this;
            var tpl = _.template(this.templates['main-tpl']);
            this.videoBlockTpl = _.template(this.templates['video-block-tpl']);
            this.membersTpl = _.template(this.templates['members-block-tpl']);
            this.notesTpl = _.template(this.templates['notes-block-tpl']);
            this.chatTpl = _.template(this.templates['chat-block-tpl']);
            var data = {
                i18n: i18n
            };
            this.$el.html(tpl(data));
            $.parser.parse(this.$el);
            // jQuery selectors
            this.$Menu = $('#main-menu');
            this.$NetworkWidget = this.$('.network-widget');
            this.$DurationWidget = this.$('.duration-time');
            this.$DialogScreenshot = $("#screenshot-dlg");
            this.$ScreenshotPreview = this.$DialogScreenshot.find('img');
            this.$ScreenshotComment = this.$DialogScreenshot.find('.screenshot-comment');
            this.$DialogConfirm = $("#exam-confirm-dlg");
            this.$ConfirmMessage = this.$DialogConfirm.find('.confirm-message');
            this.$ProtectionCode = this.$DialogConfirm.find('.protection-code');
            this.$ProtectionCodeInput = this.$DialogConfirm.find('.protection-code-input');
            this.$ExamComment = this.$DialogConfirm.find('.exam-comment');
            this.$ApplyText = this.$DialogConfirm.find('.apply-text');
            this.$RejectText = this.$DialogConfirm.find('.reject-text');
            this.$ExamComment = this.$DialogConfirm.find('.exam-comment');
            this.$VideoContainer = this.$('.container');
            this.$PanelWebcam = this.$('.panel-webcam');
            this.$PanelWebcamVideo = this.$PanelWebcam.find('video');
            this.$MembersContainer = this.$('#members-container');
            this.$NotesContainer = this.$('#notes-container');
            this.$ChatContainer = this.$('#chat-container');
            // Event handlers
            this.$Menu.menu({
                onClick: function(item) {
                    switch (item.name) {
                        case "exam":
                            if (self.examCount === 0 || !self.exam) break;
                            self.view.exam.doOpen(self.exam.get('_id'));
                            break;
                        case "passport":
                            if (self.examCount === 0 || !self.exam) break;
                            var student = self.exam.get('student');
                            if (student) self.view.passport.doOpen(student._id);
                            break;
                        case "openVision":
                            if (self.examCount === 0 || !self.exam) break;
                            self.openVision(self.exam.get('_id'));
                            break;
                        case "closeExam":
                            if (self.examCount === 0 || !self.exam) break;
                            self.closeExam(self.exam.get('_id'));
                            break;
                        case "audioAutomute":
                            self.toggleAudioAutomute(item);
                            break;
                        case "alwaysOnTop":
                            self.toggleAlwaysOnTop(item);
                            break;
                        case "profile":
                            self.view.profile.doOpen();
                            break;
                        case "settings":
                            self.view.settings.doOpen();
                            break;
                        case "disconnect":
                            self.disconnect();
                            break;
                    }
                }
            });
            // set validate method
            $.extend($.fn.validatebox.defaults.rules, {
                protectionCode: {
                    validator: function(value, param) {
                        return value == self.protectionCode;
                    },
                    message: i18n.t('multivision.submit.incorrectProtectionCode')
                }
            });
            // set protection code method
            this.$ProtectionCodeInput.validatebox({
                required: true,
                validType: 'protectionCode'
            });
            this.stickit(app.time);
            this.addAllExams();
            return this;
        },
        destroy: function() {
            this.timers.forEach(function(element, index, array) {
                clearInterval(element);
            });
            for (var v in this.view) {
                if (this.view[v]) this.view[v].destroy();
            }
            for (var examId in this.exams) {
                app.io.notify.removeListener('note-' + examId, this.newNotificationHandler);
                app.io.notify.removeListener('chat-' + examId, this.newNotificationHandler);
                this.exams[examId].ws.removeListener('message');
            }
            window.removeEventListener('message', this.messageEventHandler);
            window.removeEventListener('focus', this.focusEventHandler);
            window.removeEventListener('blur', this.blurEventHandler);
            window.removeEventListener('resize', this.throttle(this.resizeEventHandler));
            window.removeEventListener('hashchange', this.hashchangeEventHandler);
            app.io.notify.removeListener('connect', this.connectHandler);
            app.io.notify.removeListener('disconnect', this.disconnectHandler);
            this.remove();
        },
        openVision: function(examId) {
            this.closeExam(examId);
            if (SINGLE_MODE) {
                app.router.navigate("vision/" + examId, {
                    trigger: true
                });
            }
            else {
                window.open("#vision/" + examId, examId);
            }
        },
        closeExam: function(examId) {
            this.exams[examId].videoblock.view.screenwebcam.stop();
            this.$PanelWebcam.find('video').attr('src', '');
            this.unselectExam();
            this.showPanels('empty');
            
            app.io.notify.removeListener('note-' + examId, this.newNotificationHandler);
            app.io.notify.removeListener('chat-' + examId, this.newNotificationHandler);
            this.exams[examId].ws.removeListener('message');

            delete this.exams[examId];
            this.exam = undefined;
            this.examsCount--;
            var hash = window.location.hash.replace('-' + examId, '').replace(examId, '').replace('/-', '/');
            Backbone.history.navigate(hash);
            
            this.$VideoContainer.find('.panel-videoblock[data-id="' + examId + '"]').remove();
            this.updateBlockPositions();
            if (this.examsCount > 0) this.selectExam(Object.keys(this.exams)[this.examsCount-1]);
        },
        toggleAudioAutomute: function(item) {
            this.audioAutomuteFlag = !this.audioAutomuteFlag;
            for (var examId in this.exams) {
                this.exams[examId].videoblock.view.screenwebcam.audioAutomuteFlag = this.audioAutomuteFlag;
                this.exams[examId].videoblock.view.screenwebcam.updateMuteState();
            }
            if (this.audioAutomuteFlag) {
                this.$Menu.menu('setIcon', {
                    target: item.target,
                    iconCls: 'fa fa-dot-circle-o'
                });
            }
            else {
                this.$Menu.menu('setIcon', {
                    target: item.target,
                    iconCls: 'fa fa-circle-o'
                });
            }
        },
        toggleAlwaysOnTop: function(item) {
            this.alwaysOnTop = !this.alwaysOnTop;
            if (this.alwaysOnTop) {
                _.postMessage('enableAlwaysOnTop', '*');
                this.$Menu.menu('setIcon', {
                    target: item.target,
                    iconCls: 'fa fa-dot-circle-o'
                });
            }
            else {
                _.postMessage('disableAlwaysOnTop', '*');
                this.$Menu.menu('setIcon', {
                    target: item.target,
                    iconCls: 'fa fa-circle-o'
                });
            }
        },
        getExamStatus: function(examId) {
            var self = this;
            $.getJSON('inspector/status/' + self.exams[examId].data.get('_id'),
                function(data) {
                    if (!data) return;
                    if (!self.exams[examId].examStatus) self.exams[examId].examStatus = data.status;
                    if (data.status != self.exams[examId].examStatus) {
                        self.exams[examId].examStatus = data.status;
                        self.exams[examId].notes.collection.create({
                            time: app.now(),
                            text: i18n.t('multivision.changeStatus', {
                                status: self.exams[examId].examStatus
                            }),
                            attach: [],
                            editable: false
                        });
                    }
                });
        },
        addAllExams: function() {
            var hash = window.location.hash;
            var ids = hash.split('/');
            if (ids && ids[1]) {
                ids = ids[1].split('-');
                for (var i = 0; i < ids.length; i++) {
                    var examId = ids[i];
                    if (examId && !this.exams[examId])
                        this.addExam(examId);
                }
            }
        },
        addExam: function(examId) {
            if (this.examsCount >= 9) return;
            
            this.unselectExam();
            this.showPanels('empty');
            
            // Exam model
            var Exam = Backbone.Model.extend({
                urlRoot: 'inspector/exam'
            });
            this.exams[examId] = {};
            this.exams[examId].data = new Exam({
                _id: examId
            });
            this.examsCount++;
            
            this.exams[examId].data.fetch();
            
            this.initExam(this.exams[examId].data);
            this.updateBlockPositions();
        },
        initExam: function(exam) {
            var examId = exam.get('_id');
            this.exams[examId].members = new MembersView({
                examId: examId
            });
            this.exams[examId].notes = new NotesView({
                examId: examId
            });
            this.exams[examId].chat = new ChatView({
                examId: examId,
                templates: true
            });
            this.exams[examId].videoblock = new VideoblockView({
                examId: examId,
                audioAutomuteFlag: this.audioAutomuteFlag,
                videoAutomuteFlag: this.videoAutomuteFlag,
                webcamProctor: this.$PanelWebcamVideo
            });
            
            var templateData = {
                i18n: i18n,
                exam: exam.toJSON()
            };
            this.$MembersContainer.append(this.membersTpl(templateData));
            this.$NotesContainer.append(this.notesTpl(templateData));
            this.$ChatContainer.append(this.chatTpl(templateData));
            this.$VideoContainer.append(this.videoBlockTpl(templateData));
            
            $.parser.parse(this.$MembersContainer);
            $.parser.parse(this.$NotesContainer);
            $.parser.parse(this.$ChatContainer);
            
            // Views
            this.exams[examId].members.setElement(this.$MembersContainer.find('.panel-members[data-id="' + examId + '"]'));
            this.exams[examId].notes.setElement(this.$NotesContainer.find('.panel-notes[data-id="' + examId + '"]'));
            this.exams[examId].chat.setElement(this.$ChatContainer.find('.panel-chat[data-id="' + examId + '"]'));
            this.exams[examId].videoblock.setElement(this.$VideoContainer.find('.panel-videoblock[data-id="' + examId + '"]'));
            
            // Render panels
            this.exams[examId].members.render();
            this.exams[examId].notes.render();
            this.exams[examId].chat.render();
//             this.exams[examId].videoblock.render();

            app.io.notify.on('note-' + examId, this.newNotificationHandler);
            app.io.notify.on('chat-' + examId, this.newNotificationHandler);
            this.exams[examId].ws = this.exams[examId].videoblock.view.screenwebcam.webcamWebcall.ws;
            this.exams[examId].ws.on('message', this.parseMessage.bind(this));
            
            this.exam = exam;
            this.unselectExam();
            this.exam = exam;
            this.selectExam(examId);

            this.stickit(this.exams[examId].data);

        },
        parseMessage: function(message) {
            var parsedMessage = JSON.parse(message);
            if (parsedMessage.id == 'callResponse' && parsedMessage.response == 'accepted') {
                var examId = this.exam.get('_id');
                this.exams[examId].videoblock.view.screenwebcam.updateProctorState();
            }
        },
        updateBlockPositions: function() {
            if (this.examsCount === 0) return;
            var blocks = this.$VideoContainer.find('.panel-videoblock');

            var screenRatio = 16 / 9;
            var headerHeight = 28;
            var footerHeight = 39;
            var blockMinWidth = 300;
            var blockMinHeight = blockMinWidth / screenRatio + headerHeight + footerHeight;
            var containerWidth = this.$VideoContainer.width();
            var containerHeight = this.$VideoContainer.height();
            blocks.css('min-width', blockMinWidth + 'px');
            blocks.css('min-height', blockMinHeight + 'px');


            if (this.examsCount == 1 && screenRatio < containerWidth / (containerHeight - headerHeight - footerHeight)) {
                var blockHeight = Math.max(containerHeight, blockMinHeight);
                var blockWidth = (blockHeight - headerHeight - footerHeight) * screenRatio;

                blocks.css('max-height', '100%');
                blocks.css('max-width', 'none');
                blocks.css('height', blockHeight + 'px');
                blocks.css('width', blockWidth + 'px');
            }
            else {
                var numBlocksX = containerWidth / blockMinWidth;
                var numBlocksY = containerHeight / blockMinHeight;
                var columns;

                if (this.examsCount == 1 || numBlocksX < 2) columns = 1;
                else if (this.examsCount == 2 || numBlocksX < 3 || numBlocksY > numBlocksX && this.examsCount < 7) columns = 2;
                else columns = 3;
                
                var blockWidth = Math.max(containerWidth / columns, blockMinWidth);
                var blockHeight = blockWidth / screenRatio + headerHeight + footerHeight;

                blocks.css('max-width', '100%');
                blocks.css('max-height', 'none');
                blocks.css('width', blockWidth + 'px');
                blocks.css('height', blockHeight + 'px');
            }

            $.parser.parse(this.$VideoContainer);
            
            for (var examId in this.exams) {
                this.exams[examId].videoblock.fixDraggablePosition();
                this.exams[examId].videoblock.view.screenwebcam.toolbar(this.exams[examId].data);
            }
        },
        switchExam: function(e) {
            var elem = $(e.currentTarget);
            var examId = elem.data('id');
            
            if (!this.exam || examId == this.exam.get('_id')) return;
            
            this.unselectExam();
            this.selectExam(examId);
        },
        unselectExam: function() {
            if (!this.exam || this.examsCount === 0) return;
            
            var examId = this.exam.get('_id');
            this.$VideoContainer.find('.panel-videoblock[data-id="' + examId + '"]').removeClass('selected');
            this.exams[examId].videoblock.view.screenwebcam.examSelected = false;
            this.exams[examId].videoblock.view.screenwebcam.updateMuteState();
            
            this.hidePanels(examId);
            
            this.exam = undefined;
        },
        selectExam: function(examId) {
            this.$VideoContainer.find('.panel-videoblock[data-id="' + examId + '"]').addClass('selected');
            this.exam = this.exams[examId].data;
            this.exams[examId].videoblock.view.screenwebcam.examSelected = true;
            this.exams[examId].videoblock.view.screenwebcam.updateMuteState();
            
            this.hidePanels('empty');
            this.showPanels(examId);
            this.scrollPanelsToBottom(examId);
            this.updatePanelsWidth(examId);
            
            this.$VideoContainer.find('.panel-videoblock[data-id="' + examId + '"] .new-notification').hide();
        },
        updatePanelsWidth: function(examId) {
            var width = this.$MembersContainer.width();
            var members = this.$MembersContainer.find('.panel-members[data-id="' + examId + '"]').parent();
            var notes = this.$NotesContainer.find('.panel-notes[data-id="' + examId + '"]').parent();
            var chat = this.$ChatContainer.find('.panel-chat[data-id="' + examId + '"]').parent();
            $.parser.parse(members.width(width));
            $.parser.parse(notes.width(width));
            $.parser.parse(chat.width(width));
        },
        showPanels: function(examId) {
            this.$MembersContainer.find('.panel-members:not([data-id="' + examId + '"])').parent().hide();
            this.$NotesContainer.find('.panel-notes:not([data-id="' + examId + '"])').parent().hide();
            this.$ChatContainer.find('.panel-chat:not([data-id="' + examId + '"])').parent().hide();
            
            this.$MembersContainer.find('.panel-members[data-id="' + examId + '"]').parent().show();
            this.$NotesContainer.find('.panel-notes[data-id="' + examId + '"]').parent().show();
            this.$ChatContainer.find('.panel-chat[data-id="' + examId + '"]').parent().show();
        },
        hidePanels: function(examId) {
            this.$MembersContainer.find('.panel-members[data-id="' + examId + '"]').parent().hide();
            this.$NotesContainer.find('.panel-notes[data-id="' + examId + '"]').parent().hide();
            this.$ChatContainer.find('.panel-chat[data-id="' + examId + '"]').parent().hide();
        },
        scrollPanelsToBottom: function(examId) {
            var $NotesPanel = this.$NotesContainer.find('.panel-notes[data-id="' + examId + '"] .notes-panel');
            var $ChatPanel = this.$ChatContainer.find('.panel-chat[data-id="' + examId + '"] .chat-panel');
            $NotesPanel.scrollTop($NotesPanel[0].scrollHeight);
            $ChatPanel.scrollTop($ChatPanel[0].scrollHeight);
        },
        newNotification: function(data) {
            if (app.isMe(data.userId) || data.examId === this.exam.get('_id')) return;
            
            this.$VideoContainer.find('.panel-videoblock[data-id="' + data.examId + '"] .new-notification').show();
        },
        doAdd: function() {
            this.view.examAdding.doOpen();
        },
        doVerify: function() {
            if (!this.exam || this.examsCount === 0) return;
            var self = this;
            var examId = this.exam.get('_id');
            this.$Video = this.$VideoContainer.find('.panel-videoblock[data-id="' + examId + '"] .webcam-output');
            this.view.verify.doOpen(this.$Video.get(0), this.exam.get('_id'), this.exam.get('student'), {
                success: function(model) {
                    var message = model.get('submit') ? i18n.t('multivision.verify.success') : i18n.t('multivision.verify.fail');
                    self.exams[examId].notes.collection.create({
                        time: app.now(),
                        text: message,
                        attach: model.get('attach'),
                        editable: false
                    });
                }
            });
        },
        doScreenshot: function() {
            _.postMessage('takeScreenshot', '*');
        },
        screenshotDlg: function(dataUrl) {
            if (!this.exam || this.examsCount === 0) return;
            var self = this;
            var examId = this.exam.get('_id');
            var closeBtn = function() {
                self.$DialogScreenshot.dialog('close');
                self.$ScreenshotComment.textbox('setValue', '');
            };
            var saveBtn = function() {
                var attach = new Attach([], {
                    onDone: function(model) {
                        var comment = self.$ScreenshotComment.textbox('getValue');
                        self.exams[examId].notes.collection.create({
                            time: app.now(),
                            text: comment,
                            attach: this.toJSON(),
                            editable: true
                        });
                        closeBtn();
                    }
                });
                attach.create({
                    file: _.dataUrlToFile(dataUrl, 'screenshot.png', 'image/png')
                });
            };
            self.$ScreenshotPreview.attr({
                src: dataUrl
            });
            self.$DialogScreenshot.dialog({
                closed: false,
                buttons: [{
                    text: i18n.t('multivision.screenshot.save'),
                    iconCls: 'fa fa-check',
                    handler: saveBtn
                }, {
                    text: i18n.t('multivision.screenshot.close'),
                    iconCls: 'fa fa-times',
                    handler: closeBtn
                }],
                onOpen: function() {
                    $(this).dialog('center');
                }
            });
        },
        confirmDlg: function(resolution) {
            if (!this.exam || this.examsCount === 0) return;
            var self = this;
            var examId = this.exam.get('_id');
            var reset = function() {
                self.generateCode();
                self.$ProtectionCode.text(self.protectionCode);
                self.$ExamComment.textbox('clear');
                self.$ProtectionCodeInput.val('');
                self.$ProtectionCodeInput.focus();
            };
            if (resolution) {
                this.$ConfirmMessage.html(i18n.t('multivision.submit.message', {
                    resolution: '<strong style="color:green">' + i18n.t('multivision.submit.true') + '</strong>'
                }));
            }
            else {
                this.$ConfirmMessage.html(i18n.t('multivision.submit.message', {
                    resolution: '<strong style="color:red">' + i18n.t('multivision.submit.false') + '</strong>'
                }));
            }
            this.$DialogConfirm.dialog({
                closed: false,
                buttons: [{
                    text: i18n.t('multivision.submit.submitBtn'),
                    handler: function() {
                        if (self.$ProtectionCodeInput.validatebox('isValid')) {
                            // Finish exam
                            self.exam.save({
                                _id: examId,
                                resolution: resolution,
                                comment: self.$ExamComment.textbox('getValue')
                            }, {
                                success: function() {
                                    self.$DialogConfirm.dialog('close');
                                    self.closeExam(examId);
                                }
                            });
                        }
                        else {
                            reset();
                        }
                    }
                }, {
                    text: i18n.t('multivision.submit.cancelBtn'),
                    handler: function() {
                        self.$DialogConfirm.dialog('close');
                    }
                }],
                onOpen: function() {
                    reset();
                }
            });
        },
        applyExam: function() {
            this.confirmDlg(true);
        },
        rejectExam: function() {
            this.confirmDlg(false);
        },
        disconnect: function() {
            if (SINGLE_MODE) {
                app.router.navigate("monitor", {
                    trigger: true
                });
            }
            else {
                _.postMessage('closeWindow', '*');
                window.close();
            }
        },
        generateCode: function() {
            var randomizeNumber = function(min, max) {
                return Math.ceil((Math.random() * (max - min)) + min);
            };
            this.protectionCode = randomizeNumber(1000, 9999);
        }
    });
    return View;
});
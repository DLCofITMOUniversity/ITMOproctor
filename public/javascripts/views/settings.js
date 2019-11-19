//
// Settings view
//
define([
    "i18n",
    "text!templates/settings.html"
], function(i18n, template) {
    console.log('views/settings.js');
    var View = Backbone.View.extend({
        initialize: function() {
            var self = this;
            // Templates
            this.templates = _.parseTemplate(template);
            // Events
            this.eventHandler = function(event) {
                var message = event.data;
                switch (message.id) {
                    case 'version':
                        self.$Version.text(message.data.version + ' [' + message.data.engine + '/' + message.data.release + ']');
                        self.doUpdate(message.data);
                        break;
                }
            };
            window.addEventListener('message', this.eventHandler);
            this.render();
        },
        destroy: function() {
            window.removeEventListener('message', this.eventHandler);
            this.remove();
        },
        render: function() {
            var self = this;
            var tpl = _.template(this.templates['main-tpl']);
            var data = {
                i18n: i18n
            };
            var dialog = $(this.el).dialog({
                title: i18n.t('settings.title'),
                width: 500,
                height: 420,
                closed: true,
                modal: true,
                content: tpl(data),
                onOpen: function() {
                    $(this).dialog('center');
                },
                buttons: [{
                    text: i18n.t('settings.save'),
                    iconCls: 'fa fa-check',
                    handler: function() {
                        self.doSave();
                    }
                }, {
                    text: i18n.t('settings.close'),
                    iconCls: 'fa fa-times',
                    handler: function() {
                        self.doClose();
                    }
                }]
            });
            this.$Dialog = $(dialog);
            this.$ScreenBtn = this.$('.screen-btn');
            this.$WebcameraAudio = this.$('.webcamera-audio');
            this.$WebcameraVideo = this.$('.webcamera-video');
            this.$SettingsForm = this.$('.settings-form');
            this.$ScreenId = this.$('.screen-id');
            this.$Version = this.$('.app-version');
            this.$Update = this.$('.app-update');
            self.$OsVersion = self.$('.os-version');
            self.$AppLink = self.$('.app-link');
            self.$Download = self.$('.download');
            self.$Caption = self.$('.caption');
            this.$Dist = this.$('.app-dist');
            this.$DownloadInfo = this.$('.download-info');
            this.$Progress = this.$('.download-progress');
            this.$ScreenBtn.click(function() {
                if (!IS_APP) return;
                nw.Screen.chooseDesktopMedia(['screen'], function(sourceId) {
                    var constraints = {
                        audio: false,
                        video: {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: sourceId
                            }
                        }
                    };
                    navigator.getUserMedia(constraints, function(stream) {
                        var screenId = stream.getVideoTracks()[0].label;
                        self.$ScreenId.textbox('setValue', screenId);
                    }, function(err) {
                        console.error(err);
                    });
                });
            });
            _.postMessage('getVersion', '*');
            return this;
        },
        getMediaSources: function(kind, callback) {
            navigator.mediaDevices.enumerateDevices()
                .then(function(devices) {
                    var mediaSources = [];
                    for (var i = 0, l = devices.length; i < l; i++) {
                        var device = devices[i];
                        if (device.kind == kind) {
                            var n = mediaSources.length + 1;
                            mediaSources.push({
                                name: device.deviceId,
                                value: device.label ||
                                    i18n.t('settings.webcamera.unknown', {
                                        num: n
                                    })
                            });
                        }
                    }
                    if (callback) callback(mediaSources);
                }).catch(function(err) {
                    console.log(err.name + ": " + err.message);
                });
        },
        updateMediaSources: function() {
            var self = this;
            this.getMediaSources('audioinput', function(sources) {
                self.$WebcameraAudio.combobox('loadData', sources);
                var model = app.settings.get('webcamera-audio');
                if (model) self.$WebcameraAudio.combobox('setValue', model.get('value'));
            });
            this.getMediaSources('videoinput', function(sources) {
                self.$WebcameraVideo.combobox('loadData', sources);
                var model = app.settings.get('webcamera-video');
                if (model) self.$WebcameraVideo.combobox('setValue', model.get('value'));
            });
        },
        doOpen: function() {
            this.$SettingsForm.form('load', app.settings.load());
            this.updateMediaSources();
            this.$Dialog.dialog('open');
        },
        doSave: function() {
            var formData = this.$SettingsForm.serializeArray();
            app.settings.save(formData);
            this.doClose();
        },
        doClose: function() {
            this.$Dialog.dialog('close');
        },
        doUpdate: function(app) {
            var self = this;
            $.getJSON("dist/metadata.json", function(data) {
                if (!data) return;
                if (app.engine == 'node-webkit') {
                    if (data.version != app.version) {
                        $.messager.alert(i18n.t('settings.app.update'), i18n.t('settings.app.updateMessage'), 'warning', function() {
                            self.doOpen();
                            self.$('.easyui-tabs').tabs('select', 2);
                        });
                        var platform = {
                            os: self.detectOS(),
                            arch: self.detectArch(),
                            toString: function() {
                                switch(this.os) {
                                    case 'win': return 'Windows (' + this.arch + ' бита)';
                                    case 'osx': return 'Mac OS X (64 бита)';
                                    case 'linux': return 'Linux (' + this.arch + ' бита)';
                                    default: return 'не поддерживается';
                                }
                            }
                        };
                        self.$Update.html(data.version + " (" + moment(data.date).format('YYYY.MM.DD HH:mm:ss') + ")");
                        self.$OsVersion.html(platform.toString());
                        for (var k in data.md5) {
                            self.$Dist.append('<li><a href="dist/' + k + '" title="md5: ' + data.md5[k] + '">' + k + '</a></li>');
                            if (k.indexOf(platform.os) != -1 && k.indexOf(platform.arch) != -1) {
                                self.$AppLink.html('<a href="/dist/' + k + '" title="md5: ' + data.md5[k] + '">' + k + '</a>');
                                self.$Download.show();
                            }
                        }
                        self.$Caption.find('a').click(function(e) {
                            e.preventDefault();
                            var filename = e.target.href.match(/[^/]+$/)[0];
                            self.download(e.target.href, filename);
                        });
                        self.$Caption.show();
                    }
                }

            });
        },
        detectOS: function() {
            var os = "unknown";
            if (navigator.platform.toUpperCase().indexOf('WIN') !== -1) os = "win";
            else if (navigator.platform.toUpperCase().indexOf('MAC') !== -1) os = "osx";
            else if (navigator.platform.toUpperCase().indexOf('LINUX') !== -1) os = "linux";
            return os;
        },
        detectArch: function() {
            var arch = "32";
            var arr = ["x86_64", "x86-64", "Win64", "x64;", "amd64", "AMD64", "WOW64", "x64_64"];
            for (var i = 0, l = arr.length; i < l; i++) {
                if (navigator.userAgent.indexOf(arr[i]) !== -1) {
                    arch = "64";
                    break;
                }
            }
            return arch;
        },
        download: function(url, filename) {
            var self = this;
            this.$Progress.progressbar('setColor', null);
            this.$Caption.hide();
            this.$DownloadInfo.show();
            this.$Progress.progressbar({
                value: 0,
                text: _.truncateFilename(filename, 30)
            });
            $.ajax({
                type: 'get',
                url: url,
                xhr: function() {
                    var xhr = $.ajaxSettings.xhr();
                    xhr.responseType = 'blob';
                    xhr.onprogress = function(progress) {
                        var percentage = Math.floor((progress.loaded / progress.total) * 100);
                        self.$Progress.progressbar('setValue', percentage);
                    };
                    xhr.onload = function() {
                        self.$Progress.progressbar('setColor', 'green');
                        self.saveFile(xhr.response, filename);
                    };
                    return xhr;
                }
            }).fail(function() {
                self.$Progress.progressbar('setColor', 'red');
            });
        },
        saveFile: function(blob, filename) {
            var link = document.createElement('a');
            var url;
            if (window.URL && window.URL.createObjectURL) {
                url = window.URL.createObjectURL(blob);
            }
            else if (window.webkitURL) {
                url = window.webkitURL.createObjectURL(blob);
            }
            $(link).attr({
                style: 'display: none',
                href: url,
                download: filename
            });
            $('body').append(link);
            link.click();
            if (window.URL && window.URL.createObjectURL) {
                window.URL.revokeObjectURL(url);
            }
            else if (window.webkitURL) {
                window.webkitURL.revokeObjectURL(url);
            }
        }
    });
    return View;
});
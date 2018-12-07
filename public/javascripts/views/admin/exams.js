//
// Admin: Exams view
//
define([
    "i18n",
    "text!templates/admin/exams.html",
    "views/exam/viewer",
    "views/exam/editor",
    "views/profile/viewer",
    "views/passport/viewer"
], function(i18n, template, ExamViewer, ExamEditor, ProfileViewer, PassportViewer) {
    console.log('views/admin/exams.js');
    var View = Backbone.View.extend({
        events: {
            "click .exam-btn": "doExamInfo",
            "click .student-btn": "doStudentInfo",
            "click .inspector-btn": "doInspectorInfo",
            "click .play-btn": "doPlay"
        },
        initialize: function(options) {
            // Variables
            this.options = options || {};
            // Templates
            this.templates = _.parseTemplate(template);
            // Sub views
            this.view = {
                examViewer: new ExamViewer(),
                examEditor: new ExamEditor(),
                profileViewer: new ProfileViewer(),
                passportViewer: new PassportViewer()
            };
        },
        destroy: function() {
            for (var v in this.view) {
                if (this.view[v]) this.view[v].destroy();
            }
            this.remove();
        },
        render: function() {
            var self = this;
            var tpl = _.template(this.templates['main-tpl']);
            var data = {
                i18n: i18n
            };
            this.$el.html(tpl(data));
            $.parser.parse(this.$el);

            // Menu events
            this.$Menu = $('#exams-menu');
            this.$Menu.menu({
                onClick: function(item) {
                    switch (item.name) {
                        case "add":
                            self.doAdd();
                            break;
                        case "edit":
                            self.doEdit();
                            break;
                        case "remove":
                            self.doRemove();
                            break;
                        case "export":
                            self.doExport();
                            break;
                    }
                }
            });
            // Event handlers
            this.$FromDate = this.$(".date-from");
            this.$FromDate.datebox({
                value: app.now().format("DD.MM.YYYY"),
                delay: 0,
                onChange: function(date) {
                    var valid = moment(date, "DD.MM.YYYY", true).isValid();
                    if (!date || valid) self.doSearch();
                }
            });
            this.$ToDate = this.$(".date-to");
            this.$ToDate.datebox({
                value: app.now().add(1, 'days').format("DD.MM.YYYY"),
                delay: 0,
                onChange: function(date) {
                    var valid = moment(date, "DD.MM.YYYY", true).isValid();
                    if (!date || valid) self.doSearch();
                }
            });
            this.$TextSearch = this.$(".text-search");
            this.$TextSearch.searchbox({
                searcher: function(value, name) {
                    self.doSearch();
                }
            });
            var now = app.now();
            this.$Grid = this.$("#exams-grid");
            this.$Grid.datagrid({
                columns: [
                    [{
                        field: 'student',
                        title: i18n.t('admin.exams.student'),
                        width: 150,
                        sortable: true,
                        sorter: function(a, b) {
                            if (!a || !b) return 0;
                            var fa = a.lastname + ' ' + a.firstname + ' ' + a.middlename;
                            var fb = b.lastname + ' ' + b.firstname + ' ' + b.middlename;
                            return fa.localeCompare(fb);
                        },
                        formatter: function(value, row, index) {
                            return self.formatStudent(value, row);
                        }
                    }, {
                        field: 'inspector',
                        title: i18n.t('admin.exams.inspector'),
                        width: 150,
                        sortable: true,
                        sorter: function(a, b) {
                            if (!a || !b) return 0;
                            var fa = a.lastname + ' ' + a.firstname + ' ' + a.middlename;
                            var fb = b.lastname + ' ' + b.firstname + ' ' + b.middlename;
                            return fa.localeCompare(fb);
                        },
                        formatter: function(value, row) {
                            return self.formatInspector(value, row);
                        }
                    }, {
                        field: 'subject',
                        title: i18n.t('admin.exams.subject'),
                        width: 200,
                        sortable: true,
                        formatter: function(value, row) {
                            return self.formatSubject(value, row);
                        }
                    }, {
                        field: 'beginDate',
                        title: i18n.t('admin.exams.beginDate'),
                        width: 150,
                        sortable: true,
                        formatter: self.formatDate
                    }, {
                        field: 'duration',
                        title: i18n.t('admin.exams.duration'),
                        width: 100,
                        sortable: true,
                        formatter: self.formatDuration
                    }, {
                        field: 'status',
                        title: i18n.t('admin.exams.status'),
                        width: 100,
                        sortable: true,
                        formatter: function(value, row) {
                            return self.colorStatus(self.processStatus(value, row));
                        }
                    }, {
                        field: 'action',
                        title: '&nbsp;&nbsp;&nbsp;&nbsp;',
                        align: 'center',
                        formatter: self.formatAction.bind(this)
                    }]
                ],
                remoteSort: false,
                pagination: true,
                pageNumber: 1,
                pageSize: 50,
                pageList: [10, 50, 100, 250, 500, 1000, 10000],
                rownumbers: true,
                ctrlSelect: true,
                url: 'admin/exams',
                method: 'get',
                queryParams: {
                    from: now.startOf('day').toJSON(),
                    to: now.startOf('day').add(1, 'days').toJSON(),
                    text: self.$TextSearch.textbox('getValue').trim()
                },
                onLoadSuccess: function(data) {
                    if (!data.total) return;
                    var now = moment();
                    data.rows.forEach(function(row) {
                        if (row.status) return;
                        var status = self.getExamStatus(row, now);
                        row.status = status;
                    });
                }
            });
            this.$Duration = this.$("#exams-duration");
            this.$Duration.combobox({
                valueField: 'label',
                textField: 'value',
                panelHeight: 'auto',
                editable: false,
                multiple: true,
                data: [{
                    label: 'any',
                    value: i18n.t('admin.exams.anyDuration'),
                    selected: true
                }, {
                    label: '1-30',
                    value: i18n.t('admin.exams.durationValue', {duration: '1-30'})
                }, {
                    label: '31-45',
                    value: i18n.t('admin.exams.durationValue', {duration: '31-45'})
                }, {
                    label: '46-60',
                    value: i18n.t('admin.exams.durationValue', {duration: '46-60'})
                }, {
                    label: '61',
                    value: i18n.t('admin.exams.durationMoreThanValue', {duration: '60'})
                }],
                onSelect: function(newDuration) {
                    if (newDuration.label == 'any')
                        self.$Duration.combobox('setValues', ['any']);
                    else {
                        var values = self.$Duration.combobox('getValues');
                        var index = values.indexOf('any');
                        if (index >= 0) {
                            values.splice(index, 1);
                            self.$Duration.combobox('setValues', values);
                        }
                        if (values.length > 1)
                            self.$Duration.textbox('setText', i18n.t('admin.exams.severalDurations'));
                    }
                    self.doSearch();
                },
                onUnselect: function(newDuration) {
                    var values = self.$Duration.combobox('getValues');
                    if (newDuration.label == 'any' || values.length === 0)
                        self.$Duration.combobox('setValues', ['any']);
                    else if (values.length > 1)
                        self.$Duration.textbox('setText', i18n.t('admin.exams.severalDurations'));
                    self.doSearch();
                }
            });
            this.$Status = this.$("#exams-status");
            this.$Status.combobox({
                valueField: 'label',
                textField: 'value',
                panelHeight: 'auto',
                editable: false,
                multiple: true,
                data: [
                    { label: 'any', value: i18n.t('admin.exams.anyStatus'), selected: true },
                    { label: 'except0', value: i18n.t('admin.exams.statusExcept0') },
                    { label: 0 },
                    { label: 1 },
                    { label: 2 },
                    { label: 3 },
                    { label: 7 },
                    { label: 4 },
                    { label: 5 },
                    { label: 6 }
                ],
                formatter: function(row) {
                    return self.colorStatus(self.processStatus(row.label, row));
                },
                onSelect: function(newStatus) {
                    if (newStatus.label == 'any')
                        self.$Status.combobox('setValues', ['any']);
                    else if (newStatus.label == 'except0')
                        self.$Status.combobox('setValues', ['except0']);
                    else {
                        var values = self.$Status.combobox('getValues');
                        var index = values.indexOf('any');
                        var index2 = values.indexOf('except0');
                        if (index >= 0) values.splice(index, 1);
                        if (index2 >= 0) values.splice(index2, 1);
                        if (index >= 0 || index2 >= 0)
                            self.$Status.combobox('setValues', values);
                        if (values.length == 1)
                            self.$Status.textbox('setText', self.processStatus(values[0]).statusName);
                        else
                            self.$Status.textbox('setText', i18n.t('admin.exams.severalStatuses'));
                    }
                    self.doSearch();
                },
                onUnselect: function(newStatus) {
                    var values = self.$Status.combobox('getValues');
                    if (newStatus.label == 'any' || values.length === 0)
                        self.$Status.combobox('setValues', ['any']);
                    else if (newStatus.label == 'except0')
                        self.$Status.combobox('setValues', ['except0']);
                    if (values.length == 1)
                        self.$Status.textbox('setText', self.processStatus(values[0]).statusName);
                    else
                        self.$Status.textbox('setText', i18n.t('admin.exams.severalStatuses'));
                    self.doSearch();
                }
            });
        },
        getDates: function() {
            var fromVal = this.$FromDate.datebox('getValue');
            var toVal = this.$ToDate.datebox('getValue');
            var fromDate = fromVal ? moment(fromVal, 'DD.MM.YYYY').toJSON() : null;
            var toDate = toVal ? moment(toVal, 'DD.MM.YYYY').toJSON() : null;
            return {
                from: fromDate,
                to: toDate
            };
        },
        getDuration: function() {
            var duration = this.$Duration.combobox('getValues');
            duration = duration[0] != 'any' ? duration.join(',') : null;
            return duration;
        },
        getStatus: function() {
            var status = this.$Status.combobox('getValues');
            if (status[0] == 'any') status = [];
            else if (status[0] == 'except0') {
                status = [];
                for (var i = 1; i < 7; i++)
                    status.push(i);
            }
            status = status.join(',');
            return status;
        },
        processStatus: function(val, row) {
            var status = 0;
            if (val === undefined) {
                var now = moment();
                status = row.status ? row.status : this.getExamStatus(row, now);
            }
            else
                status = isNaN(val) ? val : Number(val);
            switch (status) {
                case 'any':
                    return {
                        statusName: i18n.t('admin.exams.anyStatus'),
                        color: 'black'
                    }
                case 'except0':
                    return {
                        statusName: i18n.t('admin.exams.statusExcept0'),
                        color: 'black'
                    }
                case 0:
                    return {
                        statusName: i18n.t('exam.status.0'),
                        color: 'olive'
                    }
                case 1:
                    return {
                        statusName: i18n.t('exam.status.1'),
                        color: 'teal'
                    };
                case 2:
                    return {
                        statusName: i18n.t('exam.status.2'),
                        color: 'orange'
                    };
                case 3:
                    return {
                        statusName: i18n.t('exam.status.3'),
                        color: 'darkred'
                    };
                case 4:
                    return {
                        statusName: i18n.t('exam.status.4'),
                        color: 'green'
                    };
                case 5:
                    return {
                        statusName: i18n.t('exam.status.5'),
                        color: 'purple'
                    };
                case 6:
                    return {
                        statusName: i18n.t('exam.status.6'),
                        color: 'gray'
                    };
                case 7:
                    return {
                        statusName: i18n.t('exam.status.7'),
                        color: 'red'
                    };
                default:
                    return {
                        statusName: status,
                        color: 'black'
                    };
            }
        },
        colorStatus: function(status) {
            // status -> object from processStatus()
            return '<span style="color:' + status.color + ';">' + status.statusName + '</span>';
        },
        formatDuration: function(val, row) {
            if (!val) return;
            return i18n.t('admin.exams.durationValue', {
                duration: val
            });
        },
        formatDate: function(val, row) {
            if (!val) return;
            return moment(val).format('DD.MM.YYYY HH:mm');
        },
        formatSubject: function(val, row) {
            if (!val || !row) return;
            var tpl = _.template(this.templates['subject-item-tpl']);
            return tpl({
                i18n: i18n,
                row: row
            });
        },
        formatStudent: function(val, row) {
            if (!val) return;
            var data = {
                i18n: i18n,
                row: row
            };
            var tpl = _.template(this.templates['student-item-tpl']);
            return tpl(data);
        },
        formatInspector: function(val, row) {
            if (!val) return;
            var data = {
                i18n: i18n,
                row: row
            };
            var tpl = _.template(this.templates['inspector-item-tpl']);
            return tpl(data);
        },
        formatAction: function(val, row) {
            if (!row.startDate) return;
            var tpl = _.template(this.templates['action-item-tpl']);
            var data = {
                i18n: i18n,
                row: row
            };
            return tpl(data);
        },
        formatUser: function(val, row) {
            if (!val) return;
            return (val.lastname || i18n.t('user.unknown')) + ' ' + val.firstname + ' ' + val.middlename + ' (' + val.username + ')';
        },
        doSearch: function() {
            var self = this;
            var dates = this.getDates();
            this.$Grid.datagrid('load', {
                from: dates.from,
                to: dates.to,
                text: self.$TextSearch.textbox('getValue').trim(),
                duration: self.getDuration(),
                status: self.getStatus()
            });
        },
        doExamInfo: function(e) {
            var element = e.currentTarget;
            var examId = $(element).attr('data-id');
            this.view.examViewer.doOpen(examId);
        },
        doStudentInfo: function(e) {
            var element = e.currentTarget;
            var userId = $(element).attr('data-id');
            this.view.passportViewer.doOpen(userId);
        },
        doInspectorInfo: function(e) {
            var element = e.currentTarget;
            var userId = $(element).attr('data-id');
            this.view.profileViewer.doOpen(userId);
        },
        doPlay: function(e) {
            var element = e.currentTarget;
            var examId = $(element).attr('data-id');
            this.options.parent.renderTab({
                id: 'play',
                text: i18n.t('play.title'),
                params: {
                    examId: examId
                }
            });
        },
        doAdd: function() {
            var self = this;
            var callback = function() {
                self.$Grid.datagrid('reload');
            };
            this.view.examEditor.doOpen(null, callback);
        },
        doEdit: function() {
            var selected = this.$Grid.datagrid('getSelected');
            if (!selected) return;
            var self = this;
            var callback = function() {
                self.$Grid.datagrid('reload');
            };
            this.view.examEditor.doOpen(selected._id, callback);
        },
        removeRows: function(rows) {
            var self = this;
            var User = Backbone.Model.extend({
                urlRoot: 'exam'
            });
            var onProgress = _.progressMessager(
                i18n.t('admin.remove.progressMsg'),
                rows.length,
                function() {
                    self.$Grid.datagrid('reload');
                });
            rows.forEach(function(row, i, arr) {
                _.defer(function() {
                    var user = new User({
                        _id: row._id
                    });
                    user.destroy({
                        success: onProgress,
                        error: onProgress
                    });
                });
            });
        },
        doRemove: function() {
            var selected = this.$Grid.datagrid('getSelections');
            if (!selected.length) return;
            var self = this;
            $.messager.confirm(i18n.t('admin.remove.confirm.title'),
                i18n.t('admin.remove.confirm.message'),
                function(r) {
                    if (r) self.removeRows(selected);
                });
        },
        getExamStatus: function(data, currentTime) {
            if (!data) return 0;
            var now = currentTime || moment();
            var status = 0;
            if (data.rightDate) {
                var rightDate = moment(data.rightDate);
                if (rightDate <= now) status = 6;
            }
            if (data.beginDate && data.endDate) {
                var beginDate = moment(data.beginDate);
                var endDate = moment(data.endDate);
                if (beginDate > now) status = 1;
                if (endDate <= now) status = 6;
                if (beginDate <= now && endDate > now) status = 2;
                if (data.startDate) status = 3;
                if (data.inspectorConnected === true) status = 7;
                if (data.resolution === true) status = 4;
                if (data.resolution === false) status = 5;
            }
            return status;
        },
        doExport: function() {
            var self = this;
            var dates = this.getDates();

            var fields = [{
                label: i18n.t('admin.examsCsv.identificator'),
                value: 'examId'
            }, {
                label: i18n.t('admin.examsCsv.code'),
                value: 'examCode'
            }, {
                label: i18n.t('admin.examsCsv.subject'),
                value: 'subject'
            }, {
                label: i18n.t('admin.examsCsv.student'),
                value: 'student',
                formatter: self.formatUser
            }, {
                label: i18n.t('admin.examsCsv.inspector'),
                value: 'inspector',
                formatter: self.formatUser
            }, {
                label: i18n.t('admin.examsCsv.duration'),
                value: 'duration',
                formatter: self.formatDuration
            }, {
                label: i18n.t('admin.examsCsv.leftDate'),
                value: 'leftDate',
                formatter: self.formatDate
            }, {
                label: i18n.t('admin.examsCsv.rightDate'),
                value: 'rightDate',
                formatter: self.formatDate
            }, {
                label: i18n.t('admin.examsCsv.startDate'),
                value: 'startDate',
                formatter: self.formatDate
            }, {
                label: i18n.t('admin.examsCsv.stopDate'),
                value: 'stopDate',
                formatter: self.formatDate
            }, {
                label: i18n.t('admin.examsCsv.status'),
                value: 'status',
                formatter: function(val, row) {
                    return self.processStatus(val, row).statusName;
                }
            }, {
                label: i18n.t('admin.examsCsv.comment'),
                value: 'comment'
            }];

            var selected = self.$Grid.datagrid('getSelections');
            if (selected.length > 0) {
                var csv = self.doCsv(fields, selected);
                self.downloadCsv(csv);
            }
            else {
                $.ajax({
                    url: 'admin/exams',
                    data: {
                        from: dates.from,
                        to: dates.to,
                        text: self.$TextSearch.textbox('getValue').trim(),
                        duration: self.getDuration(),
                        status: self.getStatus()
                    },
                    success: function(data) {
                        if (data.total === 0) return;
                        var csv = self.doCsv(fields, data.rows);
                        self.downloadCsv(csv);
                    }
                });
            }
        },
        doCsv: function(fields, rows) {
            var replacer = function(key, value) { return value || '-' };

            var csv = rows.map(function(row) {
                return fields.map(function(field) {
                    var fieldValue = row[field.value];

                    if (typeof field.formatter == 'function') {
                        return JSON.stringify(field.formatter(fieldValue, row), replacer);
                    }
                    return JSON.stringify(fieldValue, replacer);
                }).join(',');
            })

            // Add headers
            csv.unshift(fields.map(function(row) {
                return JSON.stringify(row.label, replacer);
            }).join(','));

            return csv.join('\r\n');
        },
        downloadCsv: function(csv) {
            var link = document.createElement('a');
            var blob = new Blob([csv], { type: 'text/csv' });

            var url;
            if (window.URL && window.URL.createObjectURL) {
                url = window.URL.createObjectURL(blob);
            }
            else if (window.webkitURL) {
                url = window.webkitURL.createObjectURL(blob);
            }

            var dateTime = moment().format('YYYY-MM-DD_HH-mm-ss');
            $(link).attr({
                style: 'display: none',
                href: url,
                download: 'ITMOproctor-report_' + dateTime + '.csv'
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
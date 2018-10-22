//
// Exam adding view
//
define([
    "i18n",
    "text!templates/exam/adding.html",
    "views/exam/viewer",
    "views/profile/viewer",
    "views/passport/viewer"
], function(i18n, template, ExamViewer, ProfileViewer, PassportViewer) {
    console.log('views/exam/adding.js');
    var View = Backbone.View.extend({
        events: {
            "click .status-btn1": "doSearch",
            "click .status-btn2": "doSearch",
            "click .exam-btn": "doExamInfo",
            "click .student-btn": "doStudentInfo",
            "click .inspector-btn": "doInspectorInfo"
        },
        initialize: function() {
            this.templates = _.parseTemplate(template);
            // Sub views
            this.view = {
                examViewer: new ExamViewer(),
                profileViewer: new ProfileViewer(),
                passportViewer: new PassportViewer()
            };
            // Exam model
            var Exam = Backbone.Model.extend({
                urlRoot: 'inspector/exam'
            });
            this.model = new Exam();
            this.render();
        },
        destroy: function() {
            this.remove();
        },
        render: function() {
            var self = this;
            var tpl = _.template(this.templates['main-tpl']);
            var data = {
                i18n: i18n
            };
            var dialog = $(this.el).dialog({
                title: i18n.t('multivision.adding.title'),
                width: 800,
                height: 450,
                closed: true,
                modal: true,
                content: tpl(data),
                buttons: [{
                    text: i18n.t('multivision.adding.add'),
                    iconCls: 'fa fa-plus',
                    handler: function() {
                        self.addExam();
                    }
                }, {
                    text: i18n.t('multivision.adding.close'),
                    iconCls: 'fa fa-times',
                    handler: function() {
                        self.$Dialog.dialog('close');
                    }
                }],
                onOpen: function() {
                    $(this).dialog('center');
                    self.doSearch();
                },
                onClose: function() {
                    self.$Grid.datagrid('loadData', {
                        "total": 0,
                        "rows": []
                    });
                }
            });
            this.$Dialog = $(dialog);
            this.$StatusBtn1 = this.$('.status-btn1');
            this.$StatusBtn2 = this.$('.status-btn2');
            this.$Grid = this.$('.adding-table');
            this.$Grid.datagrid({
                columns: [
                    [{
                        field: 'student',
                        title: i18n.t('multivision.adding.student'),
                        width: 150,
                        sortable: true,
                        sorter: function(a, b) {
                            if (!a || !b) return 0;
                            var fa = a.lastname + ' ' + a.firstname + ' ' + a.middlename;
                            var fb = b.lastname + ' ' + b.firstname + ' ' + b.middlename;
                            return fa.localeCompare(fb);
                        },
                        formatter: function(value, row, index) {
                            return self.formatStudent(value, row, index);
                        }
                    }, {
                        field: 'inspector',
                        title: i18n.t('multivision.adding.inspector'),
                        width: 150,
                        sortable: true,
                        sorter: function(a, b) {
                            if (!a || !b) return 0;
                            var fa = a.lastname + ' ' + a.firstname + ' ' + a.middlename;
                            var fb = b.lastname + ' ' + b.firstname + ' ' + b.middlename;
                            return fa.localeCompare(fb);
                        },
                        formatter: function(value, row, index) {
                            return self.formatInspector(value, row, index);
                        }
                    }, {
                        field: 'subject',
                        title: i18n.t('multivision.adding.subject'),
                        width: 300,
                        sortable: true,
                        formatter: function(value, row, index) {
                            return self.formatSubject(value, row, index);
                        }
                    }, {
                        field: 'status',
                        title: i18n.t('multivision.adding.status'),
                        width: 150,
                        sortable: true,
                        formatter: function(value, row, index) {
                            return self.formatStatus(value, row, index);
                        }
                    }]
                ],
                rownumbers: true,
                rowStyler: function(index, row) {
                    var examId = row._id;
                    var hash = window.location.hash;
                    if (hash.indexOf(examId) !== -1) {
                        return 'background-color:silver;';
                    }
                }
            });
            return this;
        },
        addExam: function() {
            var selected = this.$Grid.datagrid('getSelected');
            if (selected) {
                var examId = selected._id;
                var hash = window.location.hash;
                var ids = hash.split('/');
                if (ids && ids[1]) {
                    ids = ids[1].split('-');
                    if (ids.length >= 9) {
                        $.messager.alert(i18n.t('multivision.adding.warning'), i18n.t('multivision.adding.limitWarning'));
                        return;
                    }
                }
                if (hash.indexOf(examId) !== -1) {
                    $.messager.alert(i18n.t('multivision.adding.warning'), i18n.t('multivision.adding.alreadyAdded'));
                    return;
                }
                this.$Dialog.dialog('close');
                var sep = hash === '#multivision/' ? '' : '-';
                Backbone.history.navigate(hash + sep + examId);
            }
        },
        formatStatus: function(val, row) {
            var status = 0;
            if (row.beginDate && row.endDate) {
                if (row.startDate) status = 3;
                if (row.inspectorConnected === true) status = 7;
            }
            switch (status) {
                case 3:
                    return '<span style="color:darkred;">' + i18n.t('exam.status.3') + '</span>';
                case 7:
                    return '<span style="color:red;">' + i18n.t('exam.status.7') + '</span>';
                default:
                    return null;
            }
        },
        formatSubject: function(val, row) {
            if (!val || !row) return;
            var tpl = _.template(this.templates['subject-item-tpl']);
            return tpl({
                i18n: i18n,
                examId: row._id,
                subject: val
            });
        },
        formatStudent: function(val, row) {
            if (!val) return;
            var data = {
                i18n: i18n,
                userId: val._id,
                lastname: val.lastname,
                firstname: val.firstname,
                middlename: val.middlename
            };
            var tpl = _.template(this.templates['student-item-tpl']);
            return tpl(data);
        },
        formatInspector: function(val, row) {
            if (!val) return;
            var data = {
                i18n: i18n,
                userId: val._id,
                lastname: val.lastname,
                firstname: val.firstname,
                middlename: val.middlename
            };
            var tpl = _.template(this.templates['inspector-item-tpl']);
            return tpl(data);
        },
        doSearch: function() {
            var myself;
            switch (true) {
                case this.$StatusBtn1.linkbutton('options').selected:
                    myself = true;
                    break;
                case this.$StatusBtn2.linkbutton('options').selected:
                    myself = false;
                    break;
            }
            this.$Grid.datagrid({
                url: 'inspector/exams',
                method: 'get',
                queryParams: {
                    status: '3,7', // "In process (without proctor)", "In process"
                    myself: myself
                }
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
        doOpen: function() {
            this.$Dialog.dialog('open');
        },
        doClose: function() {
            this.$Dialog.dialog('close');
        }
    });
    return View;
});
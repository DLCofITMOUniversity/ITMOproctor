//
// Schedules view
//
define([
    "i18n",
    "text!templates/admin/schedules.html",
    "views/schedule/editor",
    "views/profile/viewer"
], function(i18n, template, ScheduleEditor, ProfileViewer) {
    console.log('views/admin/schedules.js');
    var View = Backbone.View.extend({
        events: {
            "click .inspector-info": "doInspectorInfo"
        },
        initialize: function() {
            // Templates
            this.templates = _.parseTemplate(template);
            // Sub views
            this.view = {
                scheduleEditor: new ScheduleEditor(),
                profileViewer: new ProfileViewer()
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
            this.$Menu = $('#schedules-menu');
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
                        case "import":
                            self.doImport();
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
            this.$Grid = this.$("#schedules-grid");
            this.$Grid.datagrid({
                columns: [
                    [{
                        field: '_id',
                        hidden: true
                    }, {
                        field: 'inspector',
                        title: i18n.t('admin.schedules.inspector'),
                        width: 150,
                        sortable: true,
                        sorter: function(a, b) {
                            if (!a || !b) return 0;
                            var fa = a.lastname + ' ' + a.firstname + ' ' + a.middlename;
                            var fb = b.lastname + ' ' + b.firstname + ' ' + b.middlename;
                            return fa.localeCompare(fb);
                        },
                        formatter: this.formatInspector.bind(this)
                    }, {
                        field: 'beginDate',
                        title: i18n.t('admin.schedules.beginDate'),
                        width: 150,
                        sortable: true,
                        formatter: this.formatDate.bind(this)
                    }, {
                        field: 'endDate',
                        title: i18n.t('admin.schedules.endDate'),
                        width: 150,
                        sortable: true,
                        formatter: this.formatDate.bind(this)
                    }, {
                        field: 'concurrent',
                        title: '<span title="' + i18n.t('admin.schedules.concurrentTooltip') +'">' + i18n.t('admin.schedules.concurrent') + '</span>',
                        width: 75,
                        sortable: true
                    }, {
                        field: 'maxExamsBeginnings',
                        title: '<span title="' + i18n.t('admin.schedules.maxExamsBeginningsTooltip') +'">' + i18n.t('admin.schedules.maxExamsBeginnings') + '</span>',
                        width: 75,
                        sortable: true
                    }]
                ],
                remoteSort: false,
                pagination: true,
                pageNumber: 1,
                pageSize: 50,
                pageList: [10, 50, 100, 250, 500, 1000, 10000],
                rownumbers: true,
                ctrlSelect: true,
                url: "admin/schedules",
                method: "get",
                queryParams: {
                    from: now.startOf('day').toJSON(),
                    to: now.startOf('day').add(1, 'days').toJSON(),
                    text: self.$TextSearch.textbox('getValue').trim()
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
        formatDate: function(val, row) {
            if (!val) return;
            return moment(val).format('DD.MM.YYYY HH:mm');
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
        doSearch: function() {
            var self = this;
            var dates = this.getDates();
            this.$Grid.datagrid('load', {
                from: dates.from,
                to: dates.to,
                text: self.$TextSearch.textbox('getValue').trim()
            });
        },
        doInspectorInfo: function(e) {
            var element = e.currentTarget;
            var userId = $(element).attr('data-id');
            this.view.profileViewer.doOpen(userId);
        },
        doEdit: function() {
            var selected = this.$Grid.datagrid('getSelected');
            if (!selected) return;
            var self = this;
            var callback = function() {
                self.$Grid.datagrid('reload');
            };
            this.view.scheduleEditor.doOpen(selected._id, callback);
        },
        doAdd: function() {
            var self = this;
            var callback = function() {
                self.$Grid.datagrid('reload');
            };
            this.view.scheduleEditor.doOpen(null, callback);
        },
        removeRows: function(rows, withoutDivision) {
            var self = this;
            var User = Backbone.Model.extend({
                urlRoot: 'schedule'
            });
            var onProgress = _.progressMessager(
                i18n.t('admin.remove.progressMsg'),
                rows.length,
                function() {
                    self.$Grid.datagrid('reload');
                });
            rows.forEach(function(row, i, arr) {
                _.defer(function() {
                    if (withoutDivision) {
                        $.ajax({
                            type: 'delete',
                            url: 'schedule/' + row._id,
                            data: {
                                withoutDivision: true
                            },
                            success: onProgress,
                            error: onProgress
                        });
                    }
                    else {
                        var user = new User({
                            _id: row._id
                        });
                        user.destroy({
                            success: onProgress,
                            error: onProgress
                        });
                    }
                });
            });
        },
        doRemove: function() {
            var selected = this.$Grid.datagrid('getSelections');
            if (!selected.length) return;
            var self = this;
            var dlg = $.messager.confirm({
                title: i18n.t('admin.remove.confirm.title'),
                msg: i18n.t('admin.remove.confirm.schedulesMessage'),
                buttons:[{
                    text: i18n.t('admin.remove.confirm.removeBtn'),
                    onClick: function() {
                        self.removeRows(selected, true);
                        dlg.dialog('close');
                    }
                }, {
                    text: i18n.t('admin.remove.confirm.divideBtn'),
                    onClick: function() {
                        self.removeRows(selected, false);
                        dlg.dialog('close');
                    }
                }, {
                    text: i18n.t('admin.remove.confirm.cancelBtn'),
                    onClick: function() {
                        dlg.dialog('close');
                    }
                }]
            });
        }
    });
    return View;
});
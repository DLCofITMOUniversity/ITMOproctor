//
// Admin: Inspectors view
//
define([
    "i18n",
    "text!templates/admin/inspectorsStats.html",
    "views/profile/viewer"
], function(i18n, template, ProfileViewer, PassportViewer) {
    console.log('views/admin/inspectorsStats.js');
    var View = Backbone.View.extend({
        events: {
            "click .inspector-btn": "doInspectorInfo",
            "click .inspectors-refresh-btn": "doRefresh"
        },
        initialize: function(options) {
            // Variables
            this.options = options || {};
            // Templates
            this.templates = _.parseTemplate(template);
            // Sub views
            this.view = {
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
            this.$Grid = this.$("#inspectors-grid");
            this.$Grid.datagrid({
                columns: [
                    [{
                        field: 'inspector',
                        title: i18n.t('admin.inspectorsStats.inspector'),
                        width: 250,
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
                        field: 'totalTime',
                        title: '<span title="' + i18n.t('admin.inspectorsStats.totalTimeTooltip') +'">' + i18n.t('admin.inspectorsStats.totalTime') + '</span>',
                        width: 100,
                        sortable: true,
                        sorter: self.examSorter,
                        formatter: self.formatValue
                    }, {
                        field: 'totalExams',
                        title: '<span title="' + i18n.t('admin.inspectorsStats.examsTooltip') +'">' + i18n.t('admin.inspectorsStats.totalExams') + '</span>',
                        width: 100,
                        sortable: true,
                        sorter: self.examSorter,
                        formatter: self.formatValue
                    }, {
                        field: 'totalAccepted',
                        title: '<span title="' + i18n.t('admin.inspectorsStats.examsTooltip') +'">' + i18n.t('admin.inspectorsStats.totalAccepted') + '</span>',
                        width: 100,
                        sortable: true,
                        sorter: self.examSorter,
                        formatter: self.formatValue
                    }, {
                        field: 'totalIntercepted',
                        title: '<span title="' + i18n.t('admin.inspectorsStats.examsTooltip') +'">' + i18n.t('admin.inspectorsStats.totalIntercepted') + '</span>',
                        width: 100,
                        sortable: true,
                        sorter: self.examSorter,
                        formatter: self.formatValue
                    }, {
                        field: 'totalMissed',
                        title: '<span title="' + i18n.t('admin.inspectorsStats.examsTooltip') +'">' + i18n.t('admin.inspectorsStats.totalMissed') + '</span>',
                        width: 100,
                        sortable: true,
                        sorter: self.examSorter,
                        formatter: self.formatValue
                    }, {
                        field: 'totalPlanned',
                        title: i18n.t('admin.inspectorsStats.totalPlanned'),
                        title: '<span title="' + i18n.t('admin.inspectorsStats.examsTooltip') +'">' + i18n.t('admin.inspectorsStats.totalPlanned') + '</span>',
                        width: 100,
                        sortable: true,
                        sorter: self.examSorter,
                        formatter: self.formatValue
                    }]
                ],
                remoteSort: false,
                rownumbers: true,
                ctrlSelect: true,
                url: 'admin/inspectorsStats',
                method: 'get',
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
        formatValue: function(val, row) {
            if (!val) return;
            var h = Math.floor(val.duration / 60);
            var m = Math.floor(val.duration - h * 60);
            if (m < 10) m = '0' + m;
            var time = h + ':' + m;
            if (val.num === undefined) return time;
            return i18n.t('admin.inspectorsStats.value', {
                time: time,
                exams: val.num
            });
        },
        examSorter: function(a, b) {
            if (!a || !b) return 0;
            if (a.num !== undefined && b.num !== undefined) {
                if (a.num != b.num) a.num > b.num ? 1 : -1;
            }
            if (a.duration == b.duration) return 0;
            return a.duration > b.duration ? 1 : -1;
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
        doRefresh: function(e) {
            this.doSearch();
        }
    });
    return View;
});
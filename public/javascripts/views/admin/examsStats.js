//
// Exams stats view
//
define([
    "i18n",
    "text!templates/admin/examsStats.html"
], function(i18n, template) {
    console.log('views/admin/examStats.js');
    var View = Backbone.View.extend({
        initialize: function() {
            // Templates
            this.templates = _.parseTemplate(template);
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
            
            this.$TotalExams = this.$("#total-exams");
            this.$TotalAccepted = this.$("#total-accepted");
            this.$TotalIntercepted = this.$("#total-intercepted");
            
            this.doSearch();
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
        doSearch: function() {
            var self = this;
            var dates = this.getDates();
            $.ajax({
                url: "admin/examsStats",
                data: {
                    from: dates.from,
                    to: dates.to,
                    text: self.$TextSearch.textbox('getValue').trim()
                },
                success: function(data) {
                    self.$TotalExams.html(data.totalExams);
                    self.$TotalAccepted.html(data.totalAccepted);
                    self.$TotalIntercepted.html(data.totalIntercepted);
                    self.openChart(data);
                }
            });
        },
        openChart: function(data) {
            var chartData = [
                {
                    x: [i18n.t('admin.examsStats.totalExams')],
                    y: [data.totalExams],
                    marker: {
                        color: '#1f77b4'
                    },
                    type: 'bar'
                }, {
                    x: [i18n.t('admin.examsStats.totalAccepted')],
                    y: [data.totalAccepted],
                    marker: {
                        color: 'green'
                    },
                    type: 'bar'
                }, {
                    x: [i18n.t('admin.examsStats.totalIntercepted')],
                    y: [data.totalIntercepted],
                    marker: {
                        color: 'purple'
                    },
                    type: 'bar'
                }, {
                    x: [i18n.t('admin.examsStats.totalMissed')],
                    y: [data.totalMissed],
                    marker: {
                        color: 'gray'
                    },
                    type: 'bar'
                }, {
                    x: [i18n.t('admin.examsStats.totalPlanned')],
                    y: [data.totalPlanned],
                    marker: {
                        color: 'teal'
                    },
                    type: 'bar'
                }
            ];
            
            var layout = {
                width: 650,
                height: 400,
                showlegend: false,
                xaxis: {
                    ticklen: 5,
                    tickcolor: 'rgba(0,0,0,0)'
                },
                yaxis: {
                    rangemode: 'nonnegative'
                },
                margin: {
                    l: 45,
                    r: 20,
                    b: 30,
                    t: 5
                }
            };
            Plotly.newPlot('exams-chart', chartData, layout, {displayModeBar: false, staticPlot: true});
        }
    });
    return View;
});
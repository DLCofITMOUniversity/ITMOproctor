var config = require('nconf');
process.env['NTBA_FIX_319'] = 1; // Promise cancellation fix for TelegramBot
var TelegramBot = require('node-telegram-bot-api');
var token = config.get('bots:telegram:token');
var chatId = config.get('bots:telegram:chatId');
var options = {};
if (config.get('bots:telegram:useProxy')) {
    var Agent = require('socks5-https-client/lib/Agent');
    options.request = {
        agentClass: Agent,
        agentOptions: {
            socksHost: config.get('bots:telegram:proxy:socksHost'),
            socksPort: config.get('bots:telegram:proxy:socksPort'),
            socksUsername: config.get('bots:telegram:proxy:socksUsername'),
            socksPassword: config.get('bots:telegram:proxy:socksPassword')
        }
    };
}
var bot = new TelegramBot(token, options);
module.exports.sendNotification = function(msg) {
    bot.sendMessage(chatId, msg);
};

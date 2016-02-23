'use strict';
let nodemailer = require('nodemailer');
var sendmailTransport = require('nodemailer-sendmail-transport');
let Q = require('q');
let config = require('config').email;

let emailConfig = {
  path: config.server,
  args: ['-t']
};


function sendEmail(options) {
  var transport = nodemailer.createTransport(sendmailTransport(emailConfig));
  var deferred = Q.defer();

  options.from = options.from || `Pirate Party <${config.membershipEmail}>`;

  transport.sendMail(options, function(error, result){
      if (error) {
          deferred.reject(error);
      } else {
          deferred.resolve(result);
      }
  });

  return deferred.promise;
}

var sendHtmlEmail = function (options) {
    if (!(options && options.to)) {
        throw new Error(`Invalid email parameters`);
    }

    let to = options.to instanceof Array ? options.to : [options.to];

    var emailOptions = {
        from: options.from,
        to: to,
        subject: options.subject,
        html: options.body
    };

    return sendEmail(emailOptions);
};


var sendPlainTextEmail = function (options) {
  let to = options.to instanceof Array ? options.to : [options.to];

  var emailOptions = {
    from: options.from,
    to: to,
    subject: options.subject,
    text: options.body
  };

  return sendEmail(emailOptions);
};

module.exports = {
  sendHtmlEmail: sendHtmlEmail,
  sendPlainTextEmail: sendPlainTextEmail
};
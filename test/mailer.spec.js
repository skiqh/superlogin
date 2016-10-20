'use strict';
var path = require('path');
var expect = require('chai').expect;

var Configure = require('../lib/configure');
var Mailer = require('../lib/mailer');

var mailerTestConfig = new Configure({
  testMode: {
    noEmail: true
  },
  mailer: {
    fromEmail: 'noreply@example.com'
  },
  emails: {
    confirmEmail: {
      subject: 'Please confirm your email',
      template: path.join(__dirname, '../templates/email/confirm-email.ejs'),
      format: 'text'
    }
  }
});

var req = {
  protocol: 'https',
  headers: {
    host: 'example.com'
  }
};

var theUser = {
  name: 'Super',
  unverifiedEmail: {
    token: 'abc123'
  }
};

var mailer = new Mailer(mailerTestConfig);

describe('Mailer', function() {
  it('should send a confirmation email', function() {
    return mailer.sendEmail('confirmEmail', 'super@example.com', {req: req, user: theUser})
      .then(function(result) {
        var response = result.response.toString();
        expect(response.search('From: noreply@example.com')).to.be.greaterThan(-1);
        expect(response.search('To: super@example.com')).to.be.greaterThan(-1);
        expect(response.search('Subject: Please confirm your email')).to.be.greaterThan(-1);
        expect(response.search('Hi Super,')).to.be.greaterThan(-1);
        expect(response.search('https://example.com/auth/confirm-email/abc123')).to.be.greaterThan(-1);
      });
  });

});


var Superlogin = require('../lib/index');

var BPromise = require('bluebird');

var customMailerTestConfig = {
  mailer: {
    fromEmail: 'noreply@example.com',
    customMailer: CustomMailer
  },
  emails: {
    confirmEmail: {
      subject: 'Please confirm your email',
      format: 'text'
    }
  }
};

function CustomMailer(config) {
  // implement custom sendEmail function
  this.sendEmail = function(templateName, email, locals) {
    // create some mail-doc, containing the given parameters in some meaningful way
    var doc = {
      to: email,
      from: config.getItem('mailer.fromEmail'),
      template: templateName,
      subject: config.getItem('emails.' + templateName + '.subject')
    };

    // improvise some async behaviour
    return new BPromise.Promise(function (resolve, reject) {
      setImmediate(function() {
        resolve(JSON.stringify(doc, null, '\t'));
      });
    });
  };
}

describe('Custom mailer', function() {
  it('should send mails via a custom mailer when given', function(done) {
    // instantiate superlogin with a config that contains a customMailer
    var superlogin = new Superlogin(customMailerTestConfig);
    // superlogin exposed that mailer via the sendEmail() method
    // so use it to invoke our custom mailer
    superlogin.sendEmail('confirmEmail', 'super@example.com', {req: req, user: theUser})
      .then(function(jsonstring) {
        // this is kind of arbitrary, but check if the function is actually called
        // and expect the parameters to appear in the JSON string
        expect(jsonstring.search('"from": "noreply@example.com"')).to.be.greaterThan(-1);
        expect(jsonstring.search('"to": "super@example.com"')).to.be.greaterThan(-1);
        expect(jsonstring.search('"subject": "Please confirm your email"')).to.be.greaterThan(-1);
        expect(jsonstring.search('"template": "confirmEmail"')).to.be.greaterThan(-1);
        done();
      });
  });
});
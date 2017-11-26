// This file is dual-licensed under MPL 2.0 and MIT - you can use the source form
// provided under the terms of either of those licenses.

var AWS = require('aws-sdk');
var https = require('https');
var util = require('util');
var llamaConfig = require('./config.json');

AWS.config.region = llamaConfig.region || 'eu-west-1';

exports.handler = function(event, context) {
console.log('Chaos Llama starting up');

if (llamaConfig.probability) {
  if (randomIntFromInterval(1,100) >= llamaConfig.probability && llamaConfig.probability != 100) {
    console.log('Probability says it is not chaos time');
    return context.done(null,null);
  }
}

var ec2 = new AWS.EC2();

ec2.describeInstances(function(err, data) {
  if (err) {
    return context.done(err, null);
  }

  if (!data || data.Reservations.length === 0) {
    console.log('No instances found, exiting.');
    return context.done(null, null);
  }

  var candidates = [];
  var asgNames = [];
  data.Reservations.forEach(function(res) {
    res.Instances.forEach(function(inst) {
      inst.Tags.forEach(function(tag) {
        if (tag.Key === 'aws:autoscaling:groupName') {
          // this instance is in an ASG
          if (llamaConfig.enableForASGs) {
            // this takes precedence - if defined we don't even look at disableForASGs
            if (llamaConfig.enableForASGs.indexOf(tag.Value) !== -1) {
              candidates.push(inst);
              asgNames.push(tag.Value);
            }
          } else {
            if (llamaConfig.disableForASGs) {
              if (llamaConfig.disableForASGs.indexOf(tag.Value) === -1) {
                candidates.push(inst);
                asgNames.push(tag.Value);
              }
            }
          }
        }
      });
    });
  });

  console.log('candidates: %j', candidates);
  var numInstances = candidates.length;

  if (numInstances === 0) {
    console.log('No suitable instances found');
    return context.done(null);
  }

  var random = Math.floor(Math.random() * numInstances);
  var target = candidates[random];
  var asgName = asgNames[random];

  console.log('Going to terminate instance with id = %s', target.InstanceId);

  if (llamaConfig.slackWebhook) {
    llamaConfig.slackWebhook.forEach(function(slack) {
      if ( (slack.channel === null || typeof slack.channel === 'undefined') || (slack.webhookId === null || typeof slack.webhookId === 'undefined')) {
        console.log('No channel or webhook specified. Slack message not sent.');
        return context.done(null);
      }

      if (slack.username === null || typeof slack.username === 'undefined') {
        slack.username = "Chaos Lambda";
      }

      // code taken from https://gist.github.com/stack72/ad97da2df376754e413a
      var slackMessage = [
        "*Event*: CHAOS_TERMINATION - ShutdownInstance",
        "*Description*: Going to terminate instance with id " + target.InstanceId + " (ASG *" + asgName + "*)",
        "*Cause*: At " + getTimestamp() + " Chaos Lambda struk again!",
      ].join("\n");

      var postData = {
        channel: slack.channel,
        username: slack.username,
        text: "*Chaos Lambda Termination Notification*",
        attachments: [{ text: slackMessage, mrkdwn_in: ["text"] }]
      };

      var options = {
        method: 'POST',
        hostname: 'hooks.slack.com',
        port: 443,
        path: '/services/' + slack.webhookId
      };

      var req = https.request(options, function(res) {
        res.setEncoding('utf8');
        if (res.statusCode !== "200") {
          console.log('HTTP status code: %s', res.statusCode);
          console.log('HTTP headers: %s', res.headers);
        }
        res.on('data', function (chunk) {
          context.done(null);
        });
      });

      req.on('error', function(e) {
        context.fail(e);
        console.log('request error: ' + e.message);
      });

      req.write(util.format("%j", postData));
      req.end();
    });
  }

  ec2.terminateInstances({InstanceIds:[target.InstanceId]}, function(err, data) {
    if (err) {
      return context.done(err, null);
    }

    console.log('Instance %s terminated', target.InstanceId);
    return context.done(null, data);
  });
});
};

function randomIntFromInterval(min,max) {
  return Math.floor(Math.random()*(max-min+1)+min);
}

function getTimestamp() {
  var date = new Date();

  var hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;

  var min  = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;

  var sec  = date.getSeconds();
  sec = (sec < 10 ? "0" : "") + sec;

  var year = date.getFullYear();

  var month = date.getMonth() + 1;
  month = (month < 10 ? "0" : "") + month;

  var day  = date.getDate();
  day = (day < 10 ? "0" : "") + day;

  return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec;
}

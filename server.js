var http = require('http');
var fs = require("fs");
var GitHubApi = require("github");

console.log('Starting server');

var server = http.createServer(function(req, res) {
  var index = "./sse.htm";
  var fileName;
  var interval;

  if (req.url === "/")
    fileName = index;
  else
    fileName = "." + req.url;

  if (fileName === "./stream") {
    res.writeHead(200, {"Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive"});
    res.write("retry: 10000\n");
    res.write("event: connecttime\n");

    var github = new GitHubApi({
      // required
      version: "3.0.0",
      // optional
      debug: true,
      protocol: "https",
      host: "api.github.com", // should be api.github.com for GitHub
      timeout: 5000,
      headers: {
          "user-agent": "LanguageSearch" // GitHub is happy with a unique user agent
      }
    });

    var github_secret = '';
    var outerRes = res;

    console.log('Loading secret');

    fs.readFile('./github_secret', 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
      github_secret = data;
      github_secret = github_secret.trim();

      console.log(github_secret);

      github.authenticate({
        type: "oauth",
        token: github_secret
      });

      interval = setInterval(function() {
        var githubData = github.search.repos({
          q: "node.js"
        }, function(err, res) {
          outerRes.write("data: " + JSON.stringify(res) + "\n\n");
        });
      }, 10000);
      req.connection.addListener("close", function () {
        clearInterval(interval);
      }, false);
    });

  } else if (fileName === index) {
    fs.exists(fileName, function(exists) {
      if (exists) {
        fs.readFile(fileName, function(error, content) {
          if (error) {
            res.writeHead(500);
            res.end();
          } else {
            res.writeHead(200, {"Content-Type":"text/html"});
            res.end(content, "utf-8");
          }
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});
server.listen(8080);



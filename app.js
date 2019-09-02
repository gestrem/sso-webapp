/*
 * Copyright 2016 Red Hat Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

 // set env var to allow self-signed cert validation
 process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"


 var Keycloak = require('keycloak-connect');
 var hogan = require('hogan-express');
 var express = require('express');
 var session = require('express-session');
 var jwtDecode = require('jwt-decode');
 var GitHub = require('github-api');
 const https = require('https')
 var app = express();
 var multipart = require('parse-multipart');
 const var_dump = require('var_dump')
 var jwt_decode = require('jwt-decode');

 var server = app.listen(3000, function () {
   var host = server.address().address;
   var port = server.address().port;
   console.log('Example app listening at http://%s:%s', host, port);
 });
 // Register '.mustache' extension with The Mustache Express
 app.set('view engine', 'html');
 app.set('views', require('path').join(__dirname, '/views'));
 app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));

 app.engine('html', hogan);
 
 // A normal un-protected public URL.
 
 app.get('/', function (req, res) {
   res.render('index');
 });
 
 var memoryStore = new session.MemoryStore();

app.use(session({
  secret: 'mySecret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

// Provide the session store to the Keycloak so that sessions
// can be invalidated from the Keycloak console callback.
//
// Additional configuration is read from keycloak.json file
// installed from the Keycloak web console.

var keycloak = new Keycloak({
  store: memoryStore,
  scope: 'user'
});

// Install the Keycloak middleware.
//
// Specifies that the user-accessible application URL to
// logout should be mounted at /logout
//
// Specifies that Keycloak console callbacks should target the
// root URL.  Various permutations, such as /k_logout will ultimately
// be appended to the admin URL.

/*
var gh = new GitHub({
  token:'74a98fd98b0160dee9b7ba4307428ecbd4f880da'
})
var repos
var me = gh.getUser('gestrem'); // no user specified defaults to the user for whom credentials were provided
me.listStarredRepos(function(err, repos) {
  try{

  console.log("test "+JSON.stringify(repos))
    }
  
  catch(e){
    console.log("error"+e)
  }
});

*/
app.use(keycloak.middleware({
  logout: '/logout',
  admin: '/'
}));

app.get('/login', keycloak.protect(), function (req, res) {
  getAccessToken(req,function(repos){
      console.log("here4")
      var JWT = JSON.parse(req.session['keycloak-token'])

      console.log("access "+JWT.access_token)
    var accessToken = jwt_decode(JWT.access_token)
    console.log("access_token "+ accessToken.name)
    res.render('index', {
        jwt: JSON.stringify(JSON.parse(req.session['keycloak-token']), null, 4),
        user: accessToken.name,
        repos: JSON.stringify(repos)
      });
  })
});
  

app.get('/loginRoleSpecial', keycloak.protect('special'), function (req, res) {
  res.render('index', {
    result: JSON.stringify(JSON.parse(req.session['keycloak-token']), null, 4),
    role: jwtDecode(req.session['keycloak-token'])
  });
});

app.get('/loginRoleNormal', keycloak.protect('normal'), function (req, res) {
  res.render('index', {
    result: JSON.stringify(JSON.parse(req.session['keycloak-token']), null, 4),
    event: ''
  });
});

/*
function authToGitHub(gh){

  gh = new GitHub({
       token: '73aa2f3ba931b39eb74e29bd7d215c4a1141c7ea'
       
 });
}
*/

function getAccessToken(req,callback) {

  var keycloakCookie = JSON.parse(req.session['keycloak-token'])
  var accessToken = keycloakCookie.access_token
  console.log("here 1")
  return getGitHubToken(accessToken,callback)
}



var getGitHubToken = function(accessToken,callback){
    console.log("here 2")
    var header = {headers:{ Authorization:'Bearer ' + accessToken}};
    console.log ("HEADER "+header)
    https.get('https://secure-sso-sso-72.ge-apps.openhybridcloud.io/auth/realms/github-sso/broker/github/token',header,
    (res) => {
      let data = '';
      res.on('data',(chunck) => {data += chunck; 
      
        console.log("DATA : "+data)
        var ghToken = data.substr(13,40)
        console.log("ACCESS TOKEN GITHUB : "+ghToken)
        return (getRepos(ghToken,callback))
        });

      res.on("error",(err) => {console.log("error : "+err)})
      
    })
}

var getRepos = function (ghToken,callback){

  var gh = new GitHub({
    token: ghToken
  })
  var repos
  var me = gh.getUser('gestrem'); 
  
  me.listStarredRepos(function(err, repos) {
    try{
        var repo_name = repos[0].full_name + " " + repos[1].full_name
        callback(repo_name,null)
      console.log("REPOS " + JSON.stringify(repo_name))
    }
    catch(e){
        callback(null,e)
    }
    })
}


var getEmails = function (ghToken,callback){

    var gh = new GitHub({
      token: ghToken
    })
   
    var me = gh.getUser('gestrem'); 

    
    me.listCommits(function(err, commits) {
      try{
          callback(JSON.stringify(repos),null)
        console.log("Email " + JSON.stringify(repos))
      }
      catch(e){
          callback(null,e)
      }
      })
  }
 // Create a session-store to be used by both the express-session
 // middleware and the keycloak middleware.

 
 
 
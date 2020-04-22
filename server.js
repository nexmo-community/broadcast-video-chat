require('dotenv').config();

const express = require("express");
const app = express();
const OpenTok = require("opentok");
const OT = new OpenTok(process.env.API_KEY, process.env.API_SECRET);

let sessions = {};
let broadcastData = {};

app.use(express.static("public"));
app.use(express.json());

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/landing.html");
});

app.get("/session/:room", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

app.get("/broadcast/:room", (request, response) => {
  response.sendFile(__dirname + "/views/broadcast.html");
});

app.get("/broadcast/hls/:room", (request, response) => {
  const roomName = request.params.room;
  if (sessions[roomName]) {
    response.status(200);
    response.send({ 
      hls: broadcastData.broadcastUrls.hls,
      status: broadcastData.status
    });
  } else {
    response.status(204);
  }
});

app.post("/session/:room", (request, response) => {
  const roomName = request.params.room;
  // Check if the session already exists
  if (sessions[roomName]) {
    // Generate the token
    generateToken(roomName, response);
  } else {
    // If the session does not exist, create one
    OT.createSession({ mediaMode: "routed" }, (error, session) => {
      if (error) {
        console.log("Error creating session:", error);
      } else {
        // Store the session in the sessions object
        sessions[roomName] = session.sessionId;
        // Generate the token
        generateToken(roomName, response);
      }
    });
  }
});

app.post("/broadcast/start", (request, response) => {
  const sessionId = request.body.sessionId;
  console.log(sessionId);

  const broadcastOptions = {
    outputs: {
      hls: {},
    },
  };

  OT.startBroadcast(sessionId, broadcastOptions, (error, broadcast) => {
    if (error) {
      console.log(error);
      response.status(503);
      response.send({ error });
    }
    broadcastData = broadcast;
    response.status(200);
    response.send({ broadcast: broadcast });
  });
});

app.post("/broadcast/stop", (request, response) => {
  const broadcastId = request.body.broadcastId;
  OT.stopBroadcast(broadcastId, (error, broadcast) => {
    if (error) console.log(error);
    response.status(200);
    response.send({
      status: broadcast.status
    });
  });
});

function generateToken(roomName, response) {
  // Configure token options
  const tokenOptions = {
    role: "publisher",
    data: `roomname=${roomName}`
  };
  // Generate token with the Video API Client SDK
  let token = OT.generateToken(sessions[roomName], tokenOptions);
  // Send the required credentials back to to the client
  // as a response from the fetch request
  response.status(200);
  response.send({
    sessionId: sessions[roomName],
    token: token,
    apiKey: process.env.API_KEY
  });
}

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
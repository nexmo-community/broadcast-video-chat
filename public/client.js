let session;
let broadcast;
const url = new URL(window.location.href);
const roomName = url.pathname.split("/")[2];

fetch(location.pathname, { method: "POST" })
  .then(res => {
    return res.json();
  })
  .then(res => {
    const apiKey = res.apiKey;
    const sessionId = res.sessionId;
    const token = res.token;
    initializeSession(apiKey, sessionId, token);
  })
  .catch(handleCallback);

registerListeners();

function initializeSession(apiKey, sessionId, token) {
  // Create a session object with the sessionId
  session = OT.initSession(apiKey, sessionId);

  // Create a publisher
  const publisher = OT.initPublisher(
    "publisher",
    {
      insertMode: "append",
      width: "100%",
      height: "100%"
    },
    handleCallback
  );

  // Connect to the session
  session.connect(token, error => {
    // If the connection is successful, initialize the publisher and publish to the session
    if (error) {
      handleCallback(error);
    } else {
      session.publish(publisher, handleCallback);
    }
  });

  // Subscribe to a newly created stream
  session.on("streamCreated", event => {
    session.subscribe(
      event.stream,
      "subscriber",
      {
        insertMode: "append",
        width: "100%",
        height: "100%"
      },
      handleCallback
    );
  });
}

// Callback handler
function handleCallback(error) {
  if (error) {
    console.log("error: " + error.message);
  } else {
    console.log("callback success");
  }
}

function registerListeners() {
  const startBroadcastBtn = document.getElementById("startBroadcast");
  const stopBroadcastBtn = document.getElementById("stopBroadcast");
  const copyLinkBtn = document.getElementById("copyLink");

  startBroadcastBtn.addEventListener("click", startBroadCast, false);
  stopBroadcastBtn.addEventListener("click", stopBroadCast, false);
  copyLinkBtn.addEventListener("click", copyHlsLink, false);
}

function startBroadCast() {
  pendingBtnState("start");

  fetch("/broadcast/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: session.sessionId })
  })
    .then(res => {
      return res.json();
    })
    .then(res => {
      broadcast = res.broadcast;
      activeBtnState("stop");
      composeHlsLink(res.broadcast.broadcastUrls.hls);
    })
    .catch(handleCallback);
}

function stopBroadCast() {
  pendingBtnState("stop");

  fetch("/broadcast/stop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ broadcastId: broadcast.id })
  })
    .then(res => {
      return res.json();
    })
    .then(res => {
      activeBtnState("start");
      hlsLinkState("stop");
    })
    .catch(handleCallback);
}

function pendingBtnState(statusString) {
  const btn = document.getElementById(statusString + "Broadcast");
  btn.classList.add("disabled");
  btn.setAttribute("data-original", btn.textContent);
  btn.textContent = "Processing…";
}

function activeBtnState(statusString) {
  const activeBtn =
    statusString === "start"
      ? document.getElementById("startBroadcast")
      : document.getElementById("stopBroadcast");
  const inactiveBtn =
    statusString === "stop"
      ? document.getElementById("startBroadcast")
      : document.getElementById("stopBroadcast");

  inactiveBtn.classList.remove("disabled");
  inactiveBtn.textContent = inactiveBtn.getAttribute("data-original");
  inactiveBtn.removeAttribute("data-original");
  inactiveBtn.classList.add("hidden");
  activeBtn.classList.remove("hidden");
}

function hlsLinkState(statusString) {
  if (statusString === "start") {
    document.getElementById("hlsLink").classList.remove("hidden");
    document.getElementById("copyLink").classList.remove("hidden");
  } else {
    document.getElementById("hlsLink").classList.add("hidden");
    document.getElementById("copyLink").classList.add("hidden");
  }
}

function composeHlsLink(link) {
  hlsLinkState("start");
  const hlsLinkUrl = location.host + "/broadcast/" + roomName + "?hls=" + link;
  const hlsLink = document.getElementById("hlsLink");
  const hlsCopyTarget = document.getElementById("hlsCopyTarget");
  hlsLink.href = hlsLinkUrl;
  hlsCopyTarget.innerHTML = hlsLinkUrl;
}

function copyHlsLink() {
  const hlsCopyTarget = document.getElementById("hlsCopyTarget");
  const range = document.createRange();
  range.selectNode(hlsCopyTarget);
  window.getSelection().addRange(range);

  try {
    const successful = document.execCommand("copy");
    const msg = successful ? "successful" : "unsuccessful";
    console.log("Copy command was " + msg);
  } catch (err) {
    console.log("Oops, unable to copy");
  }
  window.getSelection().removeAllRanges();
}

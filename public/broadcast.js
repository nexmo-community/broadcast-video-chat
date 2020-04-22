const url = new URL(window.location.href);
const roomName = url.pathname.split("/")[2];
const hlsLink = url.searchParams.get("hls");

fetch("/broadcast/hls/" + roomName)
  .then(res => {
    return res.json();
  })
  .then(res => {
    playStream(hlsLink);
  })
  .catch(error => console.error(error));

function playStream(hlsLink) {
  const video = document.getElementById("video");
  const videoSrc = hlsLink;

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(videoSrc);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, function() {
      video.play();
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = videoSrc;
    video.addEventListener("loadedmetadata", function() {
      video.play();
    });
  }
}

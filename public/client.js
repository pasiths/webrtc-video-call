const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let peerConnection;

// WebSocket for signaling
const ws = new WebSocket(`ws://${location.host}`);

ws.onmessage = (message) => {
    const data = JSON.parse(message.data);

    if (data.offer) {
        handleOffer(data.offer);
    } else if (data.answer) {
        handleAnswer(data.answer);
    } else if (data.candidate) {
        handleCandidate(data.candidate);
    }
};

// Get user media and start video call
async function startCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    // Initialize peer connection
    peerConnection = new RTCPeerConnection();
    peerConnection.addEventListener('icecandidate', handleIceCandidate);
    peerConnection.addEventListener('track', (event) => {
        remoteVideo.srcObject = event.streams[0];
    });

    localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));
}

// Handle ICE candidates
function handleIceCandidate(event) {
    if (event.candidate) {
        ws.send(JSON.stringify({ candidate: event.candidate }));
    }
}

// Handle offer from the other user
async function handleOffer(offer) {
    await startCall();
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    ws.send(JSON.stringify({ answer }));
}

// Handle answer from the other user
async function handleAnswer(answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

// Handle new ICE candidate
async function handleCandidate(candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

// Create offer to start the call
async function makeCall() {
    await startCall();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    ws.send(JSON.stringify({ offer }));
}

// Start the call when the page loads
makeCall();

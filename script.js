const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output');
const canvasCtx = canvasElement.getContext('2d');

// Set up the MediaPipe Hands instance
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,  // Detect only one hand
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

hands.onResults(onResults);

// Access the webcam and set up video feed
navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
        videoElement.srcObject = stream;
    })
    .catch((err) => {
        console.error('Error accessing webcam: ', err);
    });

videoElement.addEventListener('loadeddata', (event) => {
    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;
    canvasElement.width = width;
    canvasElement.height = height;

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: width,
        height: height
    });
    camera.start();
});

function onResults(results) {
    // Clear the canvas before drawing new frame
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Draw the video frame
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
            drawLandmarks(landmarks);
        }
    }

    canvasCtx.restore();
}

// Function to draw hand landmarks on the canvas
function drawLandmarks(landmarks) {
    canvasCtx.strokeStyle = '#00FF00';
    canvasCtx.lineWidth = 2;

    // Draw each point on the hand
    for (let i = 0; i < landmarks.length; i++) {
        const x = landmarks[i].x * canvasElement.width;
        const y = landmarks[i].y * canvasElement.height;
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
        canvasCtx.fillStyle = 'red';
        canvasCtx.fill();
    }

    // Optionally, connect some key landmarks with lines (for example, fingertips to palm)
    const fingers = [
        [0, 5], [5, 9], [9, 13], [13, 17], [17, 0], // Connections to the palm
        [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
        [5, 6], [6, 7], [7, 8], // Index finger
        [9, 10], [10, 11], [11, 12], // Middle finger
        [13, 14], [14, 15], [15, 16], // Ring finger
        [17, 18], [18, 19], [19, 20] // Pinky finger
    ];

    canvasCtx.beginPath();
    for (let i = 0; i < fingers.length; i++) {
        const [startIdx, endIdx] = fingers[i];
        const startX = landmarks[startIdx].x * canvasElement.width;
        const startY = landmarks[startIdx].y * canvasElement.height;
        const endX = landmarks[endIdx].x * canvasElement.width;
        const endY = landmarks[endIdx].y * canvasElement.height;
        canvasCtx.moveTo(startX, startY);
        canvasCtx.lineTo(endX, endY);
    }
    canvasCtx.stroke();
}

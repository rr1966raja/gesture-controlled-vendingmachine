const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output');
const canvasCtx = canvasElement.getContext('2d');

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

hands.onResults(onResults);

navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
        videoElement.srcObject = stream;
    })
    .catch((err) => {
        console.error('Error accessing webcam: ', err);
    });

videoElement.addEventListener('loadeddata', (event) => {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: videoElement.videoWidth,
        height: videoElement.videoHeight
    });
    camera.start();
});

let currentSection = 'sectionSelection';
let selectedItem = null;

function onResults(results) {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const indexFinger = landmarks[8];
        const x = indexFinger.x * canvasElement.width;
        const y = indexFinger.y * canvasElement.height;

        if (currentSection === 'sectionSelection') {
            checkSelectionGesture(x, y, document.querySelectorAll('.box'));
        } else if (currentSection === 'itemSelection') {
            checkSelectionGesture(x, y, document.querySelectorAll('.item'));
        }

        if (isPalmClosed(landmarks)) {
            confirmSelection();
        }
    }
}

function checkSelectionGesture(x, y, elements) {
    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom) {
            el.style.backgroundColor = '#ddd';
            selectedItem = el.innerText;
        } else {
            el.style.backgroundColor = '#e5ff00';
        }
    });
}

function confirmSelection() {
    if (currentSection === 'sectionSelection' && selectedItem) {
        showItems(selectedItem);
    } else if (currentSection === 'itemSelection' && selectedItem) {
        showTransactionPage(selectedItem);
    }
}

function isPalmClosed(landmarks) {
    const distance = Math.sqrt(
        Math.pow(landmarks[4].x - landmarks[8].x, 2) +
        Math.pow(landmarks[4].y - landmarks[8].y, 2)
    );
    return distance < 0.1;
}

function showItems(section) {
    currentSection = 'itemSelection';
    document.getElementById('sectionSelection').classList.add('hidden');
    document.getElementById('itemSelection').classList.remove('hidden');

    const items = document.getElementById('items');
    items.innerHTML = ''; // Clear previous items
    const itemList = getItemsForSection(section);
    itemList.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('box', 'item');
        itemDiv.innerText = item;
        items.appendChild(itemDiv);
    });
}

function getItemsForSection(section) {
    const sections = {
        'Cookies': ['Chocolate Chip', 'Oatmeal Raisin'],
        'Beverages': ['Soda', 'Juice'],
        'Snacks': ['Chips', 'Pretzels'],
        'Hot Meals': ['Pizza', 'Burger']
    };
    return sections[section] || [];
}

function showTransactionPage(item) {
    currentSection = 'transactionPage';
    document.getElementById('itemSelection').classList.add('hidden');
    document.getElementById('transactionPage').classList.remove('hidden');
    document.getElementById('selectedItemText').innerText = `Selected Item: ${item}`;
}

function showThankYouPage() {
    document.getElementById('transactionPage').classList.add('hidden');
    document.getElementById('thankYouPage').classList.remove('hidden');
}

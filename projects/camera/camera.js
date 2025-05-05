let video;
let canvas;
let ctx;
let model;
let stream;
let cameraSelect;
let isFrontCamera = false;

// Initialize the camera feed and detection
async function init() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    cameraSelect = document.getElementById('cameraSelect');

    // Set canvas size
    canvas.width = 640;
    canvas.height = 480;

    // Draw initial image
    const startImage = new Image();
    startImage.src = '../../images/icons/camera.png';
    startImage.onload = () => {
        // Draw background
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate image position to center it
        const scale = Math.min(canvas.width / startImage.width, canvas.height / startImage.height) * 0.5;
        const x = (canvas.width - startImage.width * scale) / 2;
        const y = (canvas.height - startImage.height * scale) / 2;

        // Draw image
        ctx.drawImage(startImage, x, y, startImage.width * scale, startImage.height * scale);

        // Add text
        ctx.fillStyle = '#333333';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click "Start Camera" to begin', canvas.width / 2, canvas.height - 50);
    };

    // Get available cameras
    await loadAvailableCameras();

    // Load COCO-SSD model
    try {
        model = await cocoSsd.load();
        console.log('Model loaded successfully');
    } catch (error) {
        console.error('Error loading model:', error);
    }

    // Add event listeners to buttons
    document.getElementById('startCamera').addEventListener('click', startCamera);
    document.getElementById('stopCamera').addEventListener('click', stopCamera);

    // Add flip camera button event listener
    const flipButton = document.getElementById('flipButton');
    if (flipButton) {
        flipButton.addEventListener('click', () => {
            isFrontCamera = !isFrontCamera;
            console.log('Camera view flipped:', isFrontCamera ? 'mirrored' : 'normal');
        });
    }
}

// Load available cameras
async function loadAvailableCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        // Clear and update camera selection dropdown
        cameraSelect.innerHTML = '';
        videoDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Camera ${cameraSelect.length + 1}`;
            cameraSelect.appendChild(option);
        });

        if (videoDevices.length === 0) {
            const option = document.createElement('option');
            option.text = 'No cameras found';
            cameraSelect.appendChild(option);
            document.getElementById('startCamera').disabled = true;
        }
    } catch (error) {
        console.error('Error loading cameras:', error);
    }
}

// Start the camera feed
async function startCamera() {
    try {
        const selectedCamera = cameraSelect.value;

        // Stop any existing stream
        if (stream) {
            stopCamera();
        }

        // Clear any existing black screen
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
                width: 640,
                height: 480
            }
        });
        video.srcObject = stream;
        video.play();

        // Check if this is a front-facing camera
        const tracks = stream.getVideoTracks();
        if (tracks && tracks.length > 0) {
            const settings = tracks[0].getSettings();
            // Most devices report 'user' for front camera and 'environment' for back camera
            if (settings.facingMode === 'user') {
                isFrontCamera = true;
            } else if (settings.facingMode === 'environment') {
                isFrontCamera = false;
            } else {
                // If facingMode is not reported, make an educated guess based on the label
                const label = tracks[0].label.toLowerCase();
                isFrontCamera = label.includes('front') ||
                    (!label.includes('back') && !label.includes('rear'));
            }

            console.log('Camera facing mode:', isFrontCamera ? 'front' : 'back');
        }

        // Start detection loop
        requestAnimationFrame(detect);
    } catch (error) {
        console.error('Error accessing camera:', error);
    }
}

// Stop the camera feed
function stopCamera() {
    if (stream) {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;

        // Create a fade effect
        let opacity = 0;
        const fadeInterval = setInterval(() => {
            opacity += 0.1;
            if (opacity >= 1) {
                clearInterval(fadeInterval);
                // After fade, show initial image again
                init();
            } else {
                // Draw semi-transparent black overlay
                ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }, 50); // 50ms interval for smooth animation
    }
}

// Detect objects in the video feed
async function detect() {
    if (video.srcObject) {
        // Save the current canvas state
        ctx.save();

        if (isFrontCamera) {
            // For front camera: flip horizontally
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        // Draw video frame on canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Restore canvas state
        ctx.restore();

        try {
            // Get predictions from model
            const predictions = await model.detect(video);

            // Draw predictions
            predictions.forEach(prediction => {
                // Get coordinates and dimensions
                let [x, y, width, height] = prediction.bbox;

                // Adjust coordinates for flipped front camera
                if (isFrontCamera) {
                    x = canvas.width - x - width;
                }

                // Draw bounding box
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, width, height);

                // Draw label
                ctx.fillStyle = '#00ff00';
                ctx.font = '16px Arial';
                ctx.fillText(
                    `${prediction.class} ${Math.round(prediction.score * 100)}%`,
                    x,
                    y - 5
                );
            });
        } catch (error) {
            console.error('Error during detection:', error);
        }

        // Continue detection loop
        requestAnimationFrame(detect);
    }
}

// Initialize when page loads
window.addEventListener('load', init);
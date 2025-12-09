document.addEventListener('DOMContentLoaded', () => {
    console.log('Ghostlines detector loaded, initializing...');

    // DOM elements
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const startButton = document.getElementById('startCamera');
    const stopButton = document.getElementById('stopCamera');
    const flipCameraButton = document.getElementById('flipCamera');
    const cameraSelect = document.getElementById('cameraSelect');
    const displayModeSelect = document.getElementById('displayModeSelect');
    const vectorColorSelect = document.getElementById('vectorColorSelect');
    const cameraFacing = document.getElementById('cameraFacing');

    // Slider elements
    const sensitivitySlider = document.getElementById('sensitivitySlider');
    const vectorScaleSlider = document.getElementById('vectorScaleSlider');
    const samplePointsSlider = document.getElementById('samplePointsSlider');
    const sensitivityValue = document.getElementById('sensitivityValue');
    const vectorScaleValue = document.getElementById('vectorScaleValue');
    const samplePointsValue = document.getElementById('samplePointsValue');

    // Status display elements
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const movementDisplay = document.getElementById('movementDisplay');
    const changePointsDisplay = document.getElementById('changePointsDisplay');
    const displayModeText = document.getElementById('displayModeText');
    const cameraFacingDisplay = document.getElementById('cameraFacingDisplay');

    // Configuration
    const config = {
        samplePoints: 50,
        changeThreshold: 30,
        vectorScale: 5.0,
        vectorColor: [255, 0, 0], // Red in RGB (default)
        changePointColor: [0, 255, 0], // Green in RGB
        colorMode: true, // true for color, false for grayscale
        isFrontCamera: true // true for front camera (mirrored)
    };

    // Color definitions
    const vectorColors = {
        red: [255, 0, 0],
        green: [0, 255, 0],
        grey: [128, 128, 128]
    };

    let stream = null;
    let animationFrameId = null;
    let isRunning = false;
    let prevImageData = null;
    let prevCenter = { x: 0, y: 0 };

    // Initialize canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
        canvas.width = 640;
        canvas.height = 480;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Click "Start Camera" to begin', canvas.width / 2, canvas.height / 2);
    }

    // Calculate center of mass of a grayscale image
    function findCenterOfMass(imageData) {
        const { width, height, data } = imageData;
        let totalMass = 0;
        let xSum = 0;
        let ySum = 0;

        // Process image data (RGBA format)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;

                // Convert to grayscale using luminance formula
                const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

                // Invert so black = high mass, white = low mass
                const mass = 255 - gray;

                totalMass += mass;
                xSum += x * mass;
                ySum += y * mass;
            }
        }

        // Calculate center of mass
        if (totalMass > 0) {
            return {
                x: Math.round(xSum / totalMass),
                y: Math.round(ySum / totalMass)
            };
        } else {
            // Default to center if no mass detected
            return {
                x: Math.round(width / 2),
                y: Math.round(height / 2)
            };
        }
    }

    // Calculate absolute difference between two image data arrays
    function calculateDifference(imageData1, imageData2) {
        const { width, height } = imageData1;
        const data1 = imageData1.data;
        const data2 = imageData2.data;
        const diffData = new Uint8ClampedArray(data1.length);
        const changePoints = [];

        for (let i = 0; i < data1.length; i += 4) {
            // Convert both pixels to grayscale
            const gray1 = data1[i] * 0.299 + data1[i + 1] * 0.587 + data1[i + 2] * 0.114;
            const gray2 = data2[i] * 0.299 + data2[i + 1] * 0.587 + data2[i + 2] * 0.114;

            // Calculate absolute difference
            const diff = Math.abs(gray1 - gray2);

            // Store difference in all channels
            diffData[i] = diff;     // R
            diffData[i + 1] = diff; // G
            diffData[i + 2] = diff; // B
            diffData[i + 3] = 255;  // A

            // If difference is above threshold, record the point
            if (diff > config.changeThreshold) {
                const pixelIndex = i / 4;
                const x = pixelIndex % width;
                const y = Math.floor(pixelIndex / width);
                changePoints.push({ x, y });
            }
        }

        return {
            imageData: new ImageData(diffData, width, height),
            changePoints: changePoints
        };
    }

    // Randomly sample points from an array
    function samplePoints(points, numSamples) {
        if (points.length <= numSamples) {
            return points;
        }

        const sampled = [];
        const indices = new Set();

        while (sampled.length < numSamples) {
            const randomIndex = Math.floor(Math.random() * points.length);
            if (!indices.has(randomIndex)) {
                indices.add(randomIndex);
                sampled.push(points[randomIndex]);
            }
        }

        return sampled;
    }

    // Draw an arrow from start to end point
    function drawArrow(ctx, startX, startY, endX, endY, color, lineWidth = 1) {
        const headlen = 8; // length of head in pixels
        const dx = endX - startX;
        const dy = endY - startY;
        const angle = Math.atan2(dy, dx);

        // Set color
        ctx.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        ctx.lineWidth = lineWidth;

        // Draw the line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Draw the arrow head
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }

    // Draw a circle at the specified point
    function drawCircle(ctx, x, y, radius, color, filled = true) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        if (filled) {
            ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            ctx.fill();
        } else {
            ctx.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            ctx.stroke();
        }
    }

    // Process and display a single frame
    function processFrame() {
        if (!isRunning || video.readyState !== video.HAVE_ENOUGH_DATA) {
            return;
        }

        const { videoWidth, videoHeight } = video;

        // Update canvas dimensions if needed
        if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
            canvas.width = videoWidth;
            canvas.height = videoHeight;
        }

        // Clear canvas and draw current video frame with mirroring if front camera
        ctx.clearRect(0, 0, videoWidth, videoHeight);

        if (config.isFrontCamera) {
            // Save the current context state
            ctx.save();
            // Flip horizontally for front camera (mirror effect)
            ctx.scale(-1, 1);
            ctx.drawImage(video, -videoWidth, 0, videoWidth, videoHeight);
            ctx.restore();
        } else {
            // Draw normally for back camera
            ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        }

        // Get current frame image data
        const currentImageData = ctx.getImageData(0, 0, videoWidth, videoHeight);

        // Find center of mass for current frame
        const currentCenter = findCenterOfMass(currentImageData);

        let changePoints = [];
        let centerMovement = { x: 0, y: 0 };

        // If we have a previous frame, calculate differences
        if (prevImageData) {
            const diffResult = calculateDifference(prevImageData, currentImageData);
            changePoints = diffResult.changePoints;

            // Calculate center movement
            centerMovement = {
                x: currentCenter.x - prevCenter.x,
                y: currentCenter.y - prevCenter.y
            };

            // Sample change points if we have too many
            const sampledPoints = samplePoints(changePoints, config.samplePoints);

            // Redraw the frame (color or grayscale based on mode) with proper mirroring
            if (config.colorMode) {
                // Color mode - draw video directly
                if (config.isFrontCamera) {
                    ctx.save();
                    ctx.scale(-1, 1);
                    ctx.drawImage(video, -videoWidth, 0, videoWidth, videoHeight);
                    ctx.restore();
                } else {
                    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
                }
            } else {
                // Grayscale mode - convert current image data to grayscale
                // Note: currentImageData is already mirrored for front camera, so no need to flip again
                const grayscaleData = ctx.createImageData(videoWidth, videoHeight);
                for (let i = 0; i < currentImageData.data.length; i += 4) {
                    const gray = currentImageData.data[i] * 0.299 +
                        currentImageData.data[i + 1] * 0.587 +
                        currentImageData.data[i + 2] * 0.114;
                    grayscaleData.data[i] = gray;     // R
                    grayscaleData.data[i + 1] = gray; // G
                    grayscaleData.data[i + 2] = gray; // B
                    grayscaleData.data[i + 3] = 255;  // A
                }
                ctx.putImageData(grayscaleData, 0, 0);
            }

            // Draw change points and vectors
            sampledPoints.forEach(point => {
                // Draw circle at change point
                drawCircle(ctx, point.x, point.y, 2, config.changePointColor);

                // Draw vector from change point in direction of center movement
                const endX = point.x + centerMovement.x * config.vectorScale;
                const endY = point.y + centerMovement.y * config.vectorScale;

                // Only draw arrow if movement is significant
                if (Math.abs(centerMovement.x) > 1 || Math.abs(centerMovement.y) > 1) {
                    drawArrow(ctx, point.x, point.y, endX, endY, config.vectorColor);
                }
            });
        }

        // Draw movement info on canvas
        ctx.fillStyle = 'white';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Movement: (${centerMovement.x}, ${centerMovement.y})`, 10, 25);
        ctx.fillText(`Display: ${config.colorMode ? 'Color' : 'Grayscale'}`, 10, 45);
        ctx.fillText(`Change Points: ${changePoints.length}`, 10, 65);
        ctx.fillText(`Vector Color: ${vectorColorSelect.value.charAt(0).toUpperCase() + vectorColorSelect.value.slice(1)}`, 10, 85);

        // Update status display
        updateStatusDisplay(centerMovement, changePoints.length);

        // Store current frame data for next iteration
        prevImageData = currentImageData;
        prevCenter = currentCenter;

        // Continue animation loop
        animationFrameId = requestAnimationFrame(processFrame);
    }

    // Update the status display panel
    function updateStatusDisplay(movement, changePointCount) {
        if (movementDisplay) {
            movementDisplay.textContent = `(${movement.x}, ${movement.y})`;
        }
        if (changePointsDisplay) {
            changePointsDisplay.textContent = changePointCount.toString();
        }
        if (displayModeText) {
            displayModeText.textContent = config.colorMode ? 'Color' : 'Grayscale';
        }
        if (cameraFacingDisplay) {
            cameraFacingDisplay.textContent = config.isFrontCamera ? 'Front (Mirrored)' : 'Back (Normal)';
        }
    }

    // Update display mode
    function updateDisplayMode(mode) {
        config.colorMode = (mode === 'color');
        console.log('Updated display mode to:', mode);
    }

    // Update vector color
    function updateVectorColor(colorName) {
        if (vectorColors[colorName]) {
            config.vectorColor = [...vectorColors[colorName]];
            // Also update change point color to complement the vector color
            if (colorName === 'red') {
                config.changePointColor = [255, 0, 0]; // Green dots for red vectors
            } else if (colorName === 'green') {
                config.changePointColor = [0, 255, 0]; // Red dots for green vectors
            } else if (colorName === 'grey') {
                config.changePointColor = [255, 255, 255]; // White dots for grey vectors
            }
            console.log('Updated vector color to:', colorName, config.vectorColor);
        }
    }

    // Get available cameras
    async function getCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            cameraSelect.innerHTML = '';
            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Camera ${index + 1}`;
                cameraSelect.appendChild(option);
            });

            cameraSelect.disabled = videoDevices.length <= 1;
            return videoDevices.length > 0;
        } catch (error) {
            console.error('Error enumerating devices:', error);
            cameraSelect.innerHTML = '<option value="">No cameras found</option>';
            return false;
        }
    }

    // Start the camera
    async function startCamera() {
        try {
            if (stream) {
                stopCamera(false);
            }

            const constraints = {
                video: {
                    deviceId: cameraSelect.value ? { exact: cameraSelect.value } : undefined,
                    facingMode: config.isFrontCamera ? 'user' : 'environment',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            };

            stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;

            video.onloadedmetadata = () => {
                video.play().then(() => {
                    isRunning = true;
                    prevImageData = null; // Reset previous frame
                    processFrame();

                    // Update UI
                    startButton.disabled = true;
                    stopButton.disabled = false;
                    flipCameraButton.disabled = false;
                    displayModeSelect.disabled = false;
                    vectorColorSelect.disabled = false;
                    statusIndicator.className = 'status-indicator status-active';
                    statusText.textContent = 'Active';
                }).catch(err => {
                    console.error('Error playing video:', err);
                    alert('Could not play video: ' + err.message);
                });
            };

            if (cameraSelect.options.length <= 1) {
                getCameras();
            }
        } catch (error) {
            console.error('Error starting camera:', error);
            alert('Could not access camera: ' + error.message);
        }
    }

    // Stop the camera
    function stopCamera(updateUI = true) {
        isRunning = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
            video.srcObject = null;
        }

        if (updateUI) {
            startButton.disabled = false;
            stopButton.disabled = true;
            flipCameraButton.disabled = true;
            displayModeSelect.disabled = true;
            vectorColorSelect.disabled = true;
            statusIndicator.className = 'status-indicator status-inactive';
            statusText.textContent = 'Inactive';

            // Clear canvas
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Camera stopped', canvas.width / 2, canvas.height / 2);
        }
    }

    // Flip between front and back camera
    function flipCamera() {
        config.isFrontCamera = !config.isFrontCamera;
        cameraFacing.textContent = config.isFrontCamera ? 'front' : 'back';
        console.log('Switched to', config.isFrontCamera ? 'front' : 'back', 'camera');

        // If camera is currently running, restart it with new facing mode
        if (stream) {
            startCamera();
        }
    }

    // Update configuration from sliders
    function updateSensitivity(value) {
        config.changeThreshold = parseInt(value);
        console.log('Updated sensitivity to:', value);
    }

    function updateVectorScale(value) {
        config.vectorScale = parseFloat(value);
        console.log('Updated vector scale to:', value);
    }

    function updateSamplePoints(value) {
        config.samplePoints = parseInt(value);
        console.log('Updated sample points to:', value);
    }

    // Event listeners
    startButton.addEventListener('click', startCamera);
    stopButton.addEventListener('click', () => stopCamera(true));
    flipCameraButton.addEventListener('click', flipCamera);

    if (cameraSelect) {
        cameraSelect.addEventListener('change', () => {
            if (stream) {
                startCamera();
            }
        });
    }

    // Color and mode selection listeners
    if (displayModeSelect) {
        displayModeSelect.addEventListener('change', () => {
            updateDisplayMode(displayModeSelect.value);
        });
    }

    if (vectorColorSelect) {
        vectorColorSelect.addEventListener('change', () => {
            updateVectorColor(vectorColorSelect.value);
        });
    }

    // Slider event listeners
    if (sensitivitySlider) {
        sensitivitySlider.addEventListener('input', () => {
            const value = sensitivitySlider.value;
            sensitivityValue.textContent = value;
            updateSensitivity(value);
        });
    }

    if (vectorScaleSlider) {
        vectorScaleSlider.addEventListener('input', () => {
            const value = vectorScaleSlider.value;
            vectorScaleValue.textContent = value;
            updateVectorScale(value);
        });
    }

    if (samplePointsSlider) {
        samplePointsSlider.addEventListener('input', () => {
            const value = samplePointsSlider.value;
            samplePointsValue.textContent = value;
            updateSamplePoints(value);
        });
    }

    // Initial state
    stopButton.disabled = true;
    flipCameraButton.disabled = true;
    displayModeSelect.disabled = true;
    vectorColorSelect.disabled = true;

    // Initialize slider values
    updateSensitivity(sensitivitySlider.value);
    updateVectorScale(vectorScaleSlider.value);
    updateSamplePoints(samplePointsSlider.value);

    // Initialize color and mode settings
    updateDisplayMode(displayModeSelect.value);
    updateVectorColor(vectorColorSelect.value);

    // Load cameras
    getCameras().catch(error => {
        console.error('Error getting cameras:', error);
    });
});
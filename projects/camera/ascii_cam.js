document.addEventListener('DOMContentLoaded', () => {
    console.log('Camera script loaded, initializing...');

    // DOM elements
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const startButton = document.getElementById('startCamera');
    const stopButton = document.getElementById('stopCamera');
    const flipButton = document.getElementById('flipButton');
    const cameraSelect = document.getElementById('cameraSelect');
    const contrastSelect = document.getElementById('contrastSelect');
    const colorSchemeSelect = document.getElementById('colorSchemeSelect');
    const saveButton = document.getElementById('saveButton');
    const cameraModeIndicator = document.getElementById('cameraMode');

    const takePhotoButton = document.getElementById('takePhotoButton');
    const shutterSound = new Audio('sounds/shutter.mp3');



    // Slider elements
    const contrastSlider = document.getElementById('contrastSlider');
    const charSizeSlider = document.getElementById('charSizeSlider');
    const hueSlider = document.getElementById('hueSlider');
    const contrastValue = document.getElementById('contrastValue');
    const charSizeValue = document.getElementById('charSizeValue');
    const hueValue = document.getElementById('hueValue');

    // Check if AsciiUtils is available
    if (!window.AsciiUtils) {
        console.error('AsciiUtils not found! Make sure ascii.js is loaded before camera.js');
        alert('Error: ASCII utilities not loaded. Please refresh the page or check the console for details.');
        return;
    }

    // Configuration - Now with additional slider-controlled options
    const asciiConfig = {
        chars: [' ', '.', ':', '#', '@'],  // Default character set
        cellSize: 8,  // Default cell size controlled by slider
        fontSize: 8,  // Default font size that matches cell size
        backgroundColor: 'black',
        textColor: 'white',
        contrast: 50,  // Default contrast percentage (0-100)
        hue: 0         // Default hue rotation in degrees (0-360)
    };

    let stream = null;
    let animationFrameId = null;
    let isFrontCamera = true;
    let isRunning = false;

    // Initialize canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = asciiConfig.backgroundColor;
        ctx.fillRect(0, 0, canvas.width || 300, canvas.height || 150);
        ctx.fillStyle = 'white';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Click "Start Camera" to begin', (canvas.width || 300) / 2, (canvas.height || 150) / 2);
    }

    // Get available cameras
    async function getCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            // Clear the select options
            cameraSelect.innerHTML = '';

            // Add options for each camera
            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Camera ${index + 1}`;
                cameraSelect.appendChild(option);
            });

            // Enable the select if multiple cameras are available
            cameraSelect.disabled = videoDevices.length <= 1;

            return videoDevices.length > 0;
        } catch (error) {
            console.error('Error enumerating devices:', error);
            cameraSelect.innerHTML = '<option value="">No cameras found</option>';
            return false;
        }
    }

    // Apply contrast settings
    function applyContrastSetting(contrastLevel) {
        console.log('Applying contrast setting:', contrastLevel);
        if (window.AsciiUtils && typeof window.AsciiUtils.getAsciiChars === 'function') {
            // Get new character set
            const newChars = window.AsciiUtils.getAsciiChars(contrastLevel);

            // Customize character sets with your requested characters
            let customChars;
            switch(contrastLevel) {
                case 'low':
                    customChars = [' ', '.', ':', '+', '#'];  // Minimal set
                    break;
                case 'high':
                    customChars = [' ', '.', ':', '+', '#', '%', '&', '*', '^', '$', '?', '@'];  // Full detailed set
                    break;
                default: // normal
                    customChars = [' ', '.', ':', '+', '#', '@'];  // Default balanced set
            }

            // Update config with our custom chars
            asciiConfig.chars = customChars;
            console.log('Applied contrast setting. New chars:', asciiConfig.chars);
            return true;
        } else {
            console.error('AsciiUtils.getAsciiChars not available for contrast setting');
            return false;
        }
    }

    // Apply color scheme
    function applyColorScheme(scheme) {
        console.log('Applying color scheme:', scheme);
        if (window.AsciiUtils && typeof window.AsciiUtils.getColorScheme === 'function') {
            // Get new color scheme
            const colors = window.AsciiUtils.getColorScheme(scheme);

            // Update config
            if (colors && colors.backgroundColor && colors.textColor) {
                asciiConfig.backgroundColor = colors.backgroundColor;
                asciiConfig.textColor = colors.textColor;
                console.log('Applied color scheme. New colors:', colors);
                return true;
            } else {
                console.error('Invalid color scheme received from AsciiUtils');
                return false;
            }
        } else {
            console.error('AsciiUtils.getColorScheme not available for color scheme');
            return false;
        }
    }

    // Process image data to ASCII with contrast and hue adjustments
    function processImageData(imageData) {
        const { width, height, data } = imageData;
        const { chars, cellSize, fontSize, contrast, hue } = asciiConfig;

        // Clear canvas with background color
        ctx.fillStyle = asciiConfig.backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Set text properties
        ctx.font = `${fontSize}px monospace`;

        // Apply hue rotation to text color
        if (hue !== 0) {
            // Start with white or the current text color
            let baseColor = asciiConfig.textColor;

            // Only apply hue rotation if not using a named color or hex code
            if (baseColor === 'white') {
                baseColor = `hsl(${hue}, 100%, 50%)`;
            } else if (baseColor.startsWith('#')) {
                // Convert hex to hsl (simplified - not perfect conversion)
                baseColor = `hsl(${hue}, 100%, 50%)`;
            }

            ctx.fillStyle = baseColor;
        } else {
            ctx.fillStyle = asciiConfig.textColor;
        }

        ctx.textAlign = 'left';

        // Process image in cell-sized chunks
        for (let y = 0; y < height; y += cellSize) {
            for (let x = 0; x < width; x += cellSize) {
                let totalBrightness = 0;
                let samples = 0;

                // Sample pixels in the current cell
                for (let dy = 0; dy < cellSize && y + dy < height; dy++) {
                    for (let dx = 0; dx < cellSize && x + dx < width; dx++) {
                        const i = ((y + dy) * width + (x + dx)) * 4;
                        // Calculate perceived brightness using ITU-R BT.601 coefficients
                        const brightness = (
                            data[i] * 0.299 +      // Red
                            data[i + 1] * 0.587 +  // Green
                            data[i + 2] * 0.114    // Blue
                        );

                        totalBrightness += brightness;
                        samples++;
                    }
                }

                // Calculate average brightness and map to ASCII character
                let averageBrightness = totalBrightness / samples;

                // Apply contrast adjustment
                // Map contrast from 0-100 to 0.5-1.5 range for gamma correction
                const contrastFactor = 0.5 + (contrast / 100);

                // Apply contrast as gamma correction
                averageBrightness = Math.pow(averageBrightness / 255, 1/contrastFactor) * 255;

                // Ensure brightness stays in valid range
                averageBrightness = Math.max(0, Math.min(255, averageBrightness));

                const charIndex = Math.floor((averageBrightness / 255) * (chars.length - 1));

                // Draw the character
                ctx.fillText(chars[charIndex], x, y + fontSize);
            }
        }
    }

    // Capture and process a single frame
    function captureAndProcess() {
        if (!isRunning) {
            return; // Stop if camera should be stopped
        }

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            const { videoWidth, videoHeight } = video;

            // Update canvas dimensions if needed
            if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
                canvas.width = videoWidth;
                canvas.height = videoHeight;
                // Maintain background color when canvas is resized
                ctx.fillStyle = asciiConfig.backgroundColor;
                ctx.fillRect(0, 0, videoWidth, videoHeight);
            }

            // Clear the canvas with background color
            ctx.fillStyle = asciiConfig.backgroundColor;
            ctx.fillRect(0, 0, videoWidth, videoHeight);

            // Apply mirror effect for front camera
            if (isFrontCamera) {
                ctx.save();
                ctx.scale(-1, 1); // Flip horizontally
                ctx.drawImage(video, -videoWidth, 0, videoWidth, videoHeight);
                ctx.restore();
            } else {
                ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
            }

            // Get image data from canvas
            const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight);

            // Process image data to ASCII
            processImageData(imageData);
        }

        // Continue animation loop
        animationFrameId = requestAnimationFrame(captureAndProcess);
    }

    // Start the camera with the selected device
    async function startCamera() {
        try {
            // Stop any existing stream
            if (stream) {
                stopCamera(false); // Stop without updating UI
            }

            // Get selected camera or use default
            const constraints = {
                video: {
                    deviceId: cameraSelect.value ? { exact: cameraSelect.value } : undefined,
                    facingMode: isFrontCamera ? 'user' : 'environment',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            };

            console.log('Starting camera with constraints:', JSON.stringify({
                deviceId: cameraSelect.value ? 'selected' : 'default',
                facingMode: isFrontCamera ? 'user' : 'environment'
            }));

            // Get media stream
            stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Connect stream to video element
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play().then(() => {
                    // Start processing frames
                    console.log('Video playing, starting ASCII conversion');
                    isRunning = true;
                    captureAndProcess();

                    // Update UI
                    startButton.disabled = true;
                    stopButton.disabled = false;
                    flipButton.disabled = false;
                }).catch(err => {
                    console.error('Error playing video:', err);
                    alert('Could not play video: ' + err.message);
                });
            };

            // If we haven't already enumerated cameras, do it now
            if (cameraSelect.options.length <= 1) {
                getCameras();
            }
        } catch (error) {
            console.error('Error starting camera:', error);
            alert('Could not access camera: ' + error.message + '. Make sure camera permissions are granted.');
        }
    }

    // Stop the camera and animation
    function stopCamera(updateUI = true) {
        // Stop animation
        isRunning = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        // Stop video tracks
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
            video.srcObject = null;
        }

        // Update UI
        if (updateUI) {
            startButton.disabled = false;
            stopButton.disabled = true;
            flipButton.disabled = true;

            // Clear canvas
            ctx.fillStyle = asciiConfig.backgroundColor;
            ctx.fillRect(0, 0, canvas.width || 300, canvas.height || 150);
            ctx.fillStyle = 'white';
            ctx.font = '16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Camera stopped', (canvas.width || 300) / 2, (canvas.height || 150) / 2);
        }
    }

    // Toggle between front and back camera
    function flipCamera() {
        console.log('Flipping camera from', isFrontCamera ? 'front' : 'back', 'to', !isFrontCamera ? 'front' : 'back');
        isFrontCamera = !isFrontCamera;

        // Update the camera mode indicator
        if (cameraModeIndicator) {
            cameraModeIndicator.textContent = isFrontCamera ? 'front' : 'back';
        }

        // Disable the flip button temporarily to prevent multiple clicks
        if (flipButton) {
            flipButton.disabled = true;
            flipButton.textContent = 'Flipping...';
        }

        // If camera is active, restart it with new facing mode
        if (stream) {
            console.log('Stopping current camera stream...');
            // We need to explicitly stop all tracks first
            stream.getTracks().forEach(track => {
                console.log('Stopping track:', track.kind, track.label);
                track.stop();
            });
            stream = null;
            video.srcObject = null;

            // Show a message on the canvas that we're switching cameras
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Switching camera...', canvas.width / 2, canvas.height / 2);

            // Force a small delay before restarting to ensure resources are released
            setTimeout(() => {
                console.log('Restarting camera with new facing mode...');
                startCamera();

                // Re-enable the flip button
                if (flipButton) {
                    flipButton.textContent = `Flip Camera (${isFrontCamera ? 'front' : 'back'})`;
                    // The button will be re-enabled when the camera starts
                }
            }, 500);
        } else {
            // If no active stream, just update the button state
            if (flipButton) {
                flipButton.disabled = false;
                flipButton.textContent = `Flip Camera (${isFrontCamera ? 'front' : 'back'})`;
            }
        }
    }

    // Update character size and font size
    function updateCharSize(size) {
        asciiConfig.cellSize = parseInt(size);
        asciiConfig.fontSize = parseInt(size);
        console.log('Updated character size to:', size);
    }

    // Update contrast value
    function updateContrast(value) {
        asciiConfig.contrast = parseInt(value);
        console.log('Updated contrast to:', value);
    }

    // Update hue value
    function updateHue(value) {
        asciiConfig.hue = parseInt(value);
        console.log('Updated hue to:', value);
    }

    // Save ASCII image
    function saveImage() {
        if (canvas) {
            try {
                const link = document.createElement('a');
                link.download = 'ascii-image.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (error) {
                console.error('Error saving image:', error);
                alert('Could not save image: ' + error.message);
            }
        }
    }

// Add this function to handle taking a photo
    function takePhoto() {
        // Only proceed if camera is running
        if (!isRunning || !canvas) {
            alert('Please start the camera first');
            return;
        }

        // Create a flash effect
        const flashOverlay = document.createElement('div');
        flashOverlay.style.position = 'absolute';
        flashOverlay.style.top = '0';
        flashOverlay.style.left = '0';
        flashOverlay.style.width = '100%';
        flashOverlay.style.height = '100%';
        flashOverlay.style.pointerEvents = 'none'; // Don't block user interaction
        flashOverlay.className = 'flash';

        // Add flash overlay to the video container
        const videoContainer = canvas.parentElement;
        videoContainer.style.position = 'relative'; // Ensure positioning context
        videoContainer.appendChild(flashOverlay);

        // Play camera shutter sound (optional)
        const shutterSound = new Audio('https://freesound.org/data/previews/244/244982_4484600-lq.mp3');
        shutterSound.play().catch(error => {
            // Silently fail if audio can't be played (e.g., browser restrictions)
            console.log('Could not play shutter sound:', error);
        });

        // Generate a timestamp for the filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        // Save the current canvas as an image
        try {
            const link = document.createElement('a');
            link.download = `ascii-photo-${timestamp}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            // Show success message
            const message = document.createElement('div');
            message.textContent = 'Photo saved!';
            message.style.position = 'absolute';
            message.style.bottom = '20px';
            message.style.left = '50%';
            message.style.transform = 'translateX(-50%)';
            message.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            message.style.color = 'white';
            message.style.padding = '10px 20px';
            message.style.borderRadius = '20px';
            message.style.fontWeight = 'bold';
            message.style.zIndex = '1000';

            videoContainer.appendChild(message);

            // Remove the message after 2 seconds
            setTimeout(() => {
                message.style.opacity = '0';
                message.style.transition = 'opacity 0.5s';
                setTimeout(() => message.remove(), 500);
            }, 2000);

        } catch (error) {
            console.error('Error saving photo:', error);
            alert('Could not save photo: ' + error.message);
        }

        // Remove the flash overlay after animation completes
        setTimeout(() => {
            flashOverlay.remove();
        }, 500);
    }

// Add this event listener setup with the other button listeners
    if (takePhotoButton) {
        takePhotoButton.addEventListener('click', takePhoto);
    }

    // Event listeners for camera controls
    startButton.addEventListener('click', startCamera);
    stopButton.addEventListener('click', () => stopCamera(true));
    flipButton.addEventListener('click', flipCamera);

    if (cameraSelect) {
        cameraSelect.addEventListener('change', () => {
            if (stream) {
                startCamera();
            }
        });
    }

    // Event listeners for color scheme and contrast dropdowns
    if (contrastSelect) {
        contrastSelect.addEventListener('change', () => {
            console.log('Contrast preset changed to:', contrastSelect.value);
            applyContrastSetting(contrastSelect.value);
        });
    }

    if (colorSchemeSelect) {
        colorSchemeSelect.addEventListener('change', () => {
            console.log('Color scheme changed to:', colorSchemeSelect.value);
            applyColorScheme(colorSchemeSelect.value);
        });
    }

    // Event listeners for sliders
    if (contrastSlider) {
        contrastSlider.addEventListener('input', () => {
            const value = contrastSlider.value;
            contrastValue.textContent = value;
            updateContrast(value);
        });
    }

    if (charSizeSlider) {
        charSizeSlider.addEventListener('input', () => {
            const value = charSizeSlider.value;
            charSizeValue.textContent = value;
            updateCharSize(value);
        });
    }

    if (hueSlider) {
        hueSlider.addEventListener('input', () => {
            const value = hueSlider.value;
            hueValue.textContent = value;
            updateHue(value);
        });
    }

    if (saveButton) {
        saveButton.addEventListener('click', saveImage);
    }

    // Initial state
    stopButton.disabled = true;
    flipButton.disabled = true;

    // Initialize sliders with default values
    if (contrastSlider && contrastValue) {
        updateContrast(contrastSlider.value);
        contrastValue.textContent = contrastSlider.value;
    }

    if (charSizeSlider && charSizeValue) {
        updateCharSize(charSizeSlider.value);
        charSizeValue.textContent = charSizeSlider.value;
    }

    if (hueSlider && hueValue) {
        updateHue(hueSlider.value);
        hueValue.textContent = hueSlider.value;
    }

    // Initial contrast and color settings from dropdowns
    if (contrastSelect && contrastSelect.value) {
        console.log('Setting initial contrast from select:', contrastSelect.value);
        applyContrastSetting(contrastSelect.value);
    }

    if (colorSchemeSelect && colorSchemeSelect.value) {
        console.log('Setting initial color scheme from select:', colorSchemeSelect.value);
        applyColorScheme(colorSchemeSelect.value);
    }

    // Try to enumerate cameras on load
    getCameras().catch(error => {
        console.error('Error getting cameras:', error);
        cameraSelect.innerHTML = '<option value="">No cameras found</option>';
    });
});
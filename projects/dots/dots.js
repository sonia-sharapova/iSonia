class DotToDotGenerator {
    constructor() {
        this.canvas = document.getElementById('imageCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.imageInput = document.getElementById('imageInput');
        this.processBtn = document.getElementById('processBtn');
        this.toggleViewBtn = document.getElementById('toggleViewBtn');
        this.placeholder = document.querySelector('.placeholder'); // Add reference to placeholder
        this.originalImage = null;
        this.points = [];
        this.maxPoints = 150; // Increased for more detail
        this.maxConnectionDistance = 40; // Reduced for finer connections
        this.minConnections = 1; // Reduced to allow endpoint features
        this.edgeThreshold = 20; // Reduced threshold for more edge detection
        this.hasProcessed = false;
        this.showFaded = true;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        this.processBtn.addEventListener('click', () => this.processImage());
        this.toggleViewBtn.addEventListener('click', () => this.toggleView());
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            this.originalImage = img;

            // Set canvas size maintaining aspect ratio
            const maxWidth = 800;
            const maxHeight = 600;
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (maxHeight / height) * width;
                height = maxHeight;
            }

            this.canvas.width = width;
            this.canvas.height = height;

            // Show canvas and hide placeholder
            this.canvas.style.display = 'block';
            this.placeholder.style.display = 'none';

            this.ctx.drawImage(img, 0, 0, width, height);
            this.processBtn.disabled = false;
            this.hasProcessed = false;
        };
    }

    async processImage() {
        if (this.hasProcessed) return;

        // Get image data
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        // Enhanced edge detection
        const edges = this.detectEdges(imageData);

        // Find initial feature points
        this.points = this.findFeaturePoints(edges);

        // Add additional feature points for better detail
        this.addDetailPoints(edges);

        // Optimize point distribution
        this.optimizePoints();

        // Draw the initial view
        this.drawResult();
        this.hasProcessed = true;
        this.toggleViewBtn.disabled = false;
    }

    toggleView() {
        this.showFaded = !this.showFaded;
        this.drawResult();
    }

    drawResult() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.showFaded) {
            // Draw faded original image
            this.ctx.globalAlpha = 0.2;
            this.ctx.drawImage(this.originalImage, 0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalAlpha = 1;
        }

        // Draw outline
        this.drawOutline();
    }

    detectEdges(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const edges = new Uint8ClampedArray(width * height);
        const blurred = this.gaussianBlur(data, width, height);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;

                // Compute Sobel
                const gx = this.sobelX(blurred, idx, width);
                const gy = this.sobelY(blurred, idx, width);

                // Compute gradient magnitude
                const magnitude = Math.sqrt(gx * gx + gy * gy);
                edges[y * width + x] = magnitude > this.edgeThreshold ? 255 : 0;
            }
        }

        return edges;
    }

    sobelX(data, idx, width) {
        return (
            -1 * data[idx - 4 - width * 4] +
            -2 * data[idx - 4] +
            -1 * data[idx - 4 + width * 4] +
            1 * data[idx + 4 - width * 4] +
            2 * data[idx + 4] +
            1 * data[idx + 4 + width * 4]
        ) / 8;
    }

    sobelY(data, idx, width) {
        return (
            -1 * data[idx - width * 4 - 4] +
            -2 * data[idx - width * 4] +
            -1 * data[idx - width * 4 + 4] +
            1 * data[idx + width * 4 - 4] +
            2 * data[idx + width * 4] +
            1 * data[idx + width * 4 + 4]
        ) / 8;
    }

    findFeaturePoints(edges) {
        const points = [];
        const width = this.canvas.width;
        const height = this.canvas.height;
        const gridSize = Math.floor(Math.sqrt((width * height) / this.maxPoints));

        // Sample points along edges using a grid
        for (let y = 0; y < height; y += gridSize) {
            for (let x = 0; x < width; x += gridSize) {
                let maxEdgeStrength = 0;
                let strongestPoint = null;

                // Find strongest edge point in this grid cell
                for (let dy = 0; dy < gridSize && y + dy < height; dy++) {
                    for (let dx = 0; dx < gridSize && x + dx < width; dx++) {
                        const strength = edges[(y + dy) * width + (x + dx)];
                        if (strength > maxEdgeStrength) {
                            maxEdgeStrength = strength;
                            strongestPoint = { x: x + dx, y: y + dy };
                        }
                    }
                }

                if (strongestPoint && maxEdgeStrength > 100) {
                    points.push(strongestPoint);
                }
            }
        }

        return points;
    }

    optimizePoints() {
        // Remove points that are too close to each other
        const minDistance = this.maxConnectionDistance * 0.3;

        for (let i = this.points.length - 1; i >= 0; i--) {
            for (let j = i - 1; j >= 0; j--) {
                if (this.distance(this.points[i], this.points[j]) < minDistance) {
                    this.points.splice(i, 1);
                    break;
                }
            }
        }
    }

    distance(p1, p2) {
        return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    }

    gaussianBlur(data, width, height) {
        const kernel = [
            [1, 2, 1],
            [2, 4, 2],
            [1, 2, 1]
        ];
        const kernelSum = 16;
        const result = new Uint8ClampedArray(data.length);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                for (let c = 0; c < 3; c++) {
                    let sum = 0;
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            const pidx = ((y + ky) * width + (x + kx)) * 4;
                            sum += data[pidx + c] * kernel[ky + 1][kx + 1];
                        }
                    }
                    result[idx + c] = sum / kernelSum;
                }
                result[idx + 3] = data[idx + 3];
            }
        }

        return result;
    }

    addDetailPoints(edges) {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Add points along strong edges
        for (let y = 0; y < height; y += 10) {
            for (let x = 0; x < width; x += 10) {
                if (edges[y * width + x] > 200) {
                    // Check surrounding area for edge strength
                    let avgStrength = 0;
                    for (let dy = -2; dy <= 2; dy++) {
                        for (let dx = -2; dx <= 2; dx++) {
                            const ny = y + dy;
                            const nx = x + dx;
                            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                                avgStrength += edges[ny * width + nx];
                            }
                        }
                    }
                    avgStrength /= 25;

                    if (avgStrength > 150) {
                        this.points.push({ x, y });
                    }
                }
            }
        }
    }

    findConnections() {
        const connections = new Map();
        const maxDist = this.maxConnectionDistance;

        // Initialize connection arrays
        this.points.forEach((_, i) => connections.set(i, []));

        // Create a grid for faster neighbor lookup
        const gridSize = maxDist;
        const grid = new Map();

        this.points.forEach((point, i) => {
            const gridX = Math.floor(point.x / gridSize);
            const gridY = Math.floor(point.y / gridSize);
            const key = `${gridX},${gridY}`;
            if (!grid.has(key)) grid.set(key, []);
            grid.get(key).push(i);
        });

        // Find connections using grid
        this.points.forEach((point, i) => {
            const gridX = Math.floor(point.x / gridSize);
            const gridY = Math.floor(point.y / gridSize);

            // Check neighboring grid cells
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const key = `${gridX + dx},${gridY + dy}`;
                    if (grid.has(key)) {
                        for (const j of grid.get(key)) {
                            if (i !== j) {
                                const dist = this.distance(point, this.points[j]);
                                if (dist < maxDist) {
                                    // Check if connection crosses existing connections
                                    if (!this.crossesExistingConnections(point, this.points[j], connections)) {
                                        connections.get(i).push(j);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        return connections;
    }
    crossesExistingConnections(p1, p2, connections) {
        for (const [i, connectedPoints] of connections.entries()) {
            for (const j of connectedPoints) {
                const p3 = this.points[i];
                const p4 = this.points[j];
                if (this.lineSegmentsIntersect(p1, p2, p3, p4)) {
                    return true;
                }
            }
        }
        return false;
    }

    lineSegmentsIntersect(p1, p2, p3, p4) {
        const ccw = (A, B, C) => {
            return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
        };

        return ccw(p1, p3, p4) !== ccw(p2, p3, p4) &&
            ccw(p1, p2, p3) !== ccw(p1, p2, p4);
    }

    drawOutline() {
        const connections = this.findConnections();

        // Draw connections
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 1;

        connections.forEach((connectedPoints, i) => {
            const point = this.points[i];
            connectedPoints.forEach(j => {
                const connectedPoint = this.points[j];
                this.ctx.moveTo(point.x, point.y);
                this.ctx.lineTo(connectedPoint.x, connectedPoint.y);
            });
        });

        this.ctx.stroke();

        // Draw points
        this.points.forEach((point) => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
            this.ctx.fillStyle = 'black';
            this.ctx.fill();
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new DotToDotGenerator();
});
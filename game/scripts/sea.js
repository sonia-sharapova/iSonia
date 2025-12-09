// Get canvas context
const canvas = document.getElementById('mathCanvas');
const ctx = canvas.getContext('2d');

// Set canvas background
ctx.fillStyle = '#f0f0f0';
ctx.fillRect(0, 0, 400, 400);

// Function to draw a spiral
function drawSpiral() {
    ctx.beginPath();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;

    let centerX = 200;
    let centerY = 200;
    let radius = 0;

    for(let angle = 0; angle < 8 * Math.PI; angle += 0.1) {
        radius = angle * 5;
        let x = centerX + radius * Math.cos(angle);
        let y = centerY + radius * Math.sin(angle);

        if(angle === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.stroke();
}

// Function to draw a rose curve
function drawRose() {
    ctx.beginPath();
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;

    let centerX = 200;
    let centerY = 200;
    let radius = 100;
    let n = 5; // number of petals

    for(let angle = 0; angle < 2 * Math.PI; angle += 0.01) {
        let r = radius * Math.cos(n * angle);
        let x = centerX + r * Math.cos(angle);
        let y = centerY + r * Math.sin(angle);

        if(angle === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.stroke();
}

// Draw both patterns
drawSpiral();
drawRose();
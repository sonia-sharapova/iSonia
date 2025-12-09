let cracks = [];
let synth;
let audioStarted = false;

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('sketch-holder');
    background(0, 0);

    // Initialize Tone.js synth for glass breaking sound
    synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
            type: 'sine'
        },
        envelope: {
            attack: 0.001,
            decay: 0.35,
            sustain: 0,
            release: 0.5
        }
    }).toDestination();
}

function draw() {
    // Redraw all cracks
    background(0, 0);
    for (let crack of cracks) {
        crack.display();
    }
}

function mousePressed() {
    // Start audio context on first interaction
    if (!audioStarted) {
        Tone.start();
        audioStarted = true;
    }

    createCrackPattern(mouseX, mouseY);
    return false; // Prevent default
}

function touchStarted() {
    // Start audio context on first interaction
    if (!audioStarted) {
        Tone.start();
        audioStarted = true;
    }

    if (touches.length > 0) {
        createCrackPattern(touches[0].x, touches[0].y);
    }
    return false; // Prevent default
}

function createCrackPattern(x, y) {
    // Create fewer main crack lines radiating from the touch point
    let numCracks = random(2, 4);

    for (let i = 0; i < numCracks; i++) {
        let angle = random(TWO_PI);
        let length = random(100, 300);
        let crack = new Crack(x, y, angle, length);
        cracks.push(crack);
    }

    // Play glass breaking sound
    playGlassSound();
}

function playGlassSound() {
    // Create multiple frequencies for realistic glass breaking sound
    let frequencies = [
        random(500, 1000),
        random(1500, 2000),
        random(2500, 3500),
        random(4000, 5000)
    ];

    let now = Tone.now();
    frequencies.forEach((freq, index) => {
        synth.triggerAttackRelease(freq, '0.1', now + index * 0.01);
    });
}

class Crack {
    constructor(x, y, angle, length, generation = 0) {
        this.startX = x;
        this.startY = y;
        this.angle = angle;
        this.length = length;
        this.generation = generation;
        this.endX = x + cos(angle) * length;
        this.endY = y + sin(angle) * length;
        this.branches = [];
        this.generateBranches();
    }

    generateBranches() {
        // Only create branches if not too deep and crack is long enough
        if (this.generation >= 3 || this.length < 40) {
            return;
        }

        // Create 1-3 branch points along this straight crack
        let numBranchPoints = floor(random(1, 2));

        for (let i = 0; i < numBranchPoints; i++) {
            // Place branch point randomly along the crack (not too close to ends)
            let t = random(0.2, 0.8);
            let branchX = lerp(this.startX, this.endX, t);
            let branchY = lerp(this.startY, this.endY, t);

            // Create 1-2 branches at this point
            let numBranches = random() < 0.6 ? 1 : 2;

            for (let j = 0; j < numBranches; j++) {
                // Branch at acute angle (20-70 degrees)
                let angleOffset = random(PI/9, PI/2.5) * (random() < 0.5 ? 1 : -1);
                let branchAngle = this.angle + angleOffset;

                // Branch length decreases with generation
                let branchLength = random(40, 100) * (1 - this.generation * 0.25);

                let branch = new Crack(
                    branchX,
                    branchY,
                    branchAngle,
                    branchLength,
                    this.generation + 1
                );
                this.branches.push(branch);
            }
        }
    }

    display() {
        // Vary stroke weight by generation - thinner for branches
        let weight = map(this.generation, 0, 3, 2, 0.8);
        stroke(255, 255, 255, 200);
        strokeWeight(weight);

        // Draw the straight crack line
        line(this.startX, this.startY, this.endX, this.endY);

        // Display all branches recursively
        for (let branch of this.branches) {
            branch.display();
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
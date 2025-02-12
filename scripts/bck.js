const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
script.onload = function() {
    init();
};
document.head.appendChild(script);

function init() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.id = 'background-canvas';
    document.body.insertBefore(renderer.domElement, document.body.firstChild);

    const curves = [];
    const numCurves = 3;  // Reduced number of curves for subtlety

    for(let i = 0; i < numCurves; i++) {
        const numPoints = 5;
        const points = [];
        for(let j = 0; j < numPoints; j++) {
            points.push(new THREE.Vector3(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 30
            ));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        curves.push({
            curve: curve,
            speed: Math.random() * 0.0005 + 0.0002,  // Slower movement
            phase: Math.random() * Math.PI * 2
        });

        const geometry = new THREE.BufferGeometry().setFromPoints(
            curve.getPoints(50)
        );
        const material = new THREE.LineBasicMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.3, 0.6),
            transparent: true,
            opacity: 0.3  // More transparent
        });
        const curveObject = new THREE.Line(geometry, material);
        scene.add(curveObject);
        curves[i].line = curveObject;
    }

    function animate() {
        requestAnimationFrame(animate);

        curves.forEach(curveData => {
            curveData.curve.points.forEach((point, index) => {
                point.x += Math.sin(Date.now() * curveData.speed + index + curveData.phase) * 0.1;
                point.y += Math.cos(Date.now() * curveData.speed + index + curveData.phase) * 0.1;
            });

            curveData.line.geometry.setFromPoints(
                curveData.curve.getPoints(50)
            );
            curveData.line.geometry.attributes.position.needsUpdate = true;
        });

        renderer.render(scene, camera);
    }

    window.addEventListener('resize', onWindowResize, false);

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate();
}
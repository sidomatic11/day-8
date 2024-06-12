import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

//SECTION - Scene Setup

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Sizes
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

window.addEventListener("resize", () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Update camera
	// camera.aspect = sizes.width / sizes.height; // for Perspective camera
	const aspectRatio = sizes.width / sizes.height;
	camera.left = -fov * aspectRatio;
	camera.right = fov * aspectRatio;
	camera.top = fov;
	camera.bottom = -fov;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener("dblclick", () => {
	if (!document.fullscreenElement) {
		console.log("go full");
		renderer.domElement.requestFullscreen();
	} else {
		console.log("leave full");
		document.exitFullscreen();
	}
});

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(-5, 10, 5);
scene.add(directionalLight);

// Camera

const aspectRatio = sizes.width / sizes.height;
const fov = 6;

const camera = new THREE.OrthographicCamera(
	-fov * aspectRatio,
	fov * aspectRatio,
	fov,
	-fov,
	0.1,
	100
);
camera.position.x = 5;
camera.position.y = 5;
camera.position.z = 5;
scene.add(camera);

// const camera = new THREE.PerspectiveCamera(
// 	75,
// 	sizes.width / sizes.height,
// 	0.1,
// 	100
// );
// camera.position.x = 8;
// camera.position.y = 8;
// camera.position.z = 8;
// scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Renderer
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//SECTION - Objects
// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

let cubes = [];
for (let i = 0; i < 11; i++) {
	for (let j = 0; j < 11; j++) {
		const xCoordinate = i - 5;
		const zCoordinate = j - 5;
		// let ySize = 5;
		// if (Math.abs(xCoordinate) > Math.abs(zCoordinate)) {
		// 	ySize -= Math.abs(xCoordinate);
		// } else {
		// 	ySize -= Math.abs(zCoordinate);
		// }
		const ySize =
			(10 - Math.abs(xCoordinate) - Math.abs(zCoordinate)) ** 2 / 20;
		// console.log(ySize);
		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshPhongMaterial({
			color: `hsl(${-ySize * 25 + 240}, 100%, 80%)`,
			wireframe: false,
		});

		const cube = new THREE.Mesh(geometry, material);
		cube.position.x = xCoordinate;
		cube.position.y = 0;
		cube.position.z = zCoordinate;
		cube.userData.random = Math.random();
		cube.userData.scaleFactor = ySize;
		cubes.push(cube);
		scene.add(cube);
	}
}

//SECTION - Animate
const clock = new THREE.Clock();

/* const tick = (t) => {
	const elapsedTime = clock.getElapsedTime();

	// cube.scale.y = Math.sin(elapsedTime);
	// cubes.forEach((cube) => {
	// 	cube.scale.y = Math.sin(elapsedTime * cube.userData.random);
	// });
	cubes.forEach((cube) => {
		cube.scale.y =
			Math.abs(Math.sin(elapsedTime * 3)) * cube.userData.scaleFactor + 0.05;
	});

	// Update controls
	controls.update();

	// Render
	renderer.render(scene, camera);

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
}; */

cubes.forEach((cube) => {
	cube.scale.y = 0.1;
});
renderer.render(scene, camera);

// tick();

//SECTION - Audio

// Get the audio and start button elements from the DOM
const audio = document.getElementById("audio");
const startButton = document.getElementById("startButton");

// Add an event listener to the start button that triggers when clicked
startButton.addEventListener("click", () => {
	// Create a new audio context (compatible with both webkit and standard browsers)
	const audioContext = new (window.AudioContext || window.webkitAudioContext)({
		latencyHint: "interactive",
	});

	// Create a media source from the audio element
	const source = audioContext.createMediaElementSource(audio);

	// Create an analyser to process the audio data
	const analyser = audioContext.createAnalyser();

	// Connect the source to the analyser, and the analyser to the audio destination
	source.connect(analyser);
	analyser.connect(audioContext.destination);

	// Set the Fast Fourier Transform (FFT) size to 256
	analyser.fftSize = 256;

	// Get the buffer length (half of the FFT size)
	const bufferLength = analyser.frequencyBinCount;

	// Create a Uint8Array to store the frequency data
	const dataArray = new Uint8Array(bufferLength);

	// Define a function to analyze the audio data
	function analyzeAudio() {
		// Get the byte frequency data from the analyser
		analyser.getByteFrequencyData(dataArray);

		// Calculate the average bass frequency (first 10 values)
		const bass = dataArray.slice(0, 20).reduce((a, b) => a + b, 0) / 10;

		// Animate the cubes
		const elapsedTime = clock.getElapsedTime();
		cubes.forEach((cube) => {
			cube.scale.y =
				(cube.userData.scaleFactor * bass) / 256 +
				Math.sin(elapsedTime * 1.7 * cube.userData.random) / 4;
		});

		// Update controls
		controls.update();

		// Render
		renderer.render(scene, camera);

		// Request the next frame to continue the animation
		requestAnimationFrame(analyzeAudio);
	}

	// Resume the audio context and play the audio when ready
	if (audioContext.state === "suspended") {
		audioContext.resume().then(() => {
			audio.play();
			analyzeAudio();
		});
	} else {
		audio.play();
		analyzeAudio();
	}
});

//////////////////////////////////////////////////////////////////////////////////
//		Init
//////////////////////////////////////////////////////////////////////////////////

// init renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});
renderer.setClearColor(new THREE.Color('lightgrey'), 0)
renderer.setSize(window.innerWidth * 2, window.innerHeight * 2);

document.body.appendChild(renderer.domElement);

// array of functions for the rendering loop
let onRenderFcts = [];

// init scene and camera
const scene = new THREE.Scene();

//////////////////////////////////////////////////////////////////////////////////
//		Initialize a basic camera
//////////////////////////////////////////////////////////////////////////////////

// Create a camera
const camera = new THREE.Camera();
scene.add(camera);

////////////////////////////////////////////////////////////////////////////////
//          handle arToolkitSource
////////////////////////////////////////////////////////////////////////////////

const arToolkitSource = new THREEx.ArToolkitSource({
  // to read from the webcam
  sourceType: 'webcam',
})

arToolkitSource.init(function onReady() {
  onResize()
})

// handle resize
window.addEventListener("load", function () {
  onResize()
})

window.addEventListener('resize', function () {
  onResize()
})
function onResize() {
  arToolkitSource.onResizeElement()
  arToolkitSource.copyElementSizeTo(renderer.domElement)
  if (arToolkitContext.arController !== null) {
    arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas)
  }
}
////////////////////////////////////////////////////////////////////////////////
//          initialize arToolkitContext
////////////////////////////////////////////////////////////////////////////////


// create atToolkitContext
var arToolkitContext = new THREEx.ArToolkitContext({
  debug: true,
  cameraParametersUrl: THREEx.ArToolkitContext.baseURL + '../data/data/camera_para.dat',
  detectionMode: 'mono',
  maxDetectionRate: 60,
})
// initialize it
arToolkitContext.init(function onCompvared() {
  // copy projection matrix to camera
  camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
})

// update artoolkit on every frame
onRenderFcts.push(function () {
  if (arToolkitSource.ready === false) return

  arToolkitContext.update(arToolkitSource.domElement)

  // update scene.visible if the marker is seen
  scene.visible = camera.visible
})

////////////////////////////////////////////////////////////////////////////////
//          Create a ArMarkerControls
////////////////////////////////////////////////////////////////////////////////

// init controls for camera
var markerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
  type: 'pattern',
  //patternUrl: '../arjs-three/data/cybersecurity.patt',
  patternUrl: THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
  // as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
  changeMatrixMode: 'cameraTransformMatrix'
})
// as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
scene.visible = false

//////////////////////////////////////////////////////////////////////////////////
//		add an object in the scene
//////////////////////////////////////////////////////////////////////////////////

// add a torus knot
const geometry = new THREE.BoxGeometry(4, 2, 4);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);


//////////////////////////////////////////////////////////////////////////////////
//		render the whole thing on the page
//////////////////////////////////////////////////////////////////////////////////

// render the scene
onRenderFcts.push(function () {
  renderer.render(scene, camera);
})

// run the rendering loop
var lastTimeMsec = null
requestAnimationFrame(function animate(nowMsec) {
  // keep looping
  requestAnimationFrame(animate);
  // measure time
  lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60
  var deltaMsec = Math.min(200, nowMsec - lastTimeMsec)
  lastTimeMsec = nowMsec
  // call each update function
  onRenderFcts.forEach(function (onRenderFct) {
    onRenderFct(deltaMsec / 1000, nowMsec / 1000)
  })
})
function GUI() {
    this.markerTypeString = "AR";
    this.markerType = 1;
    return this;
  }
  // Global variables
  var vrDisplay;
  var vrControls;
  var arView;
  
  var canvas;
  var camera;
  var scene;
  var renderer;
  
  var stats;
  var cameraOrtho, cameraScene, renderer, cameraMesh;
  var vrDisplay = null;
  var scene, cameraPersp, model = null;
  var MODEL_SIZE_IN_METERS = 0.2;
  var vrControls = null;
  var gui;
  var scale = new THREE.Vector3();
  
  var MARKER_SIZE_IN_METERS = 0.06;
  
  /**
   * Use the `getARDisplay()` utility to leverage the WebVR API
   * to see if there are any AR-capable WebVR VRDisplays. Returns
   * a valid display if found. Otherwise, display the unsupported
   * browser message.
   */
  THREE.ARUtils.getARDisplay().then(function (display) {
    if (display) {
      if (display.getMarkers) {
        vrDisplay = display;
        init();
      } else {
        THREE.ARUtils.displayUnsupportedMessage("This prototype browser app for WebAR does not support marker detection yet.");
      }
    } else {
      THREE.ARUtils.displayUnsupportedMessage();
    }
  });
  
  
  function init() {
    // Initialize the dat.GUI.
    var datGUI = new dat.GUI();
    gui = new GUI();
    datGUI.add(gui, "markerTypeString", ["AR", "QRCODE"]).onFinishChange(function(value) {
      if (!vrDisplay) {
        return;
      }
      if (value === "QRCODE") {
        gui.markerType = vrDisplay.MARKER_TYPE_QRCODE;
      }
      else if (value === "AR") {
        gui.markerType = vrDisplay.MARKER_TYPE_AR;
      }
    }).name("Marker type");
  
    // Setup the three.js rendering environment
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    canvas = renderer.domElement;
    document.body.appendChild(canvas);
    scene = new THREE.Scene();
  
    // Creating the ARView, which is the object that handles
    // the rendering of the camera stream behind the three.js
    // scene
    arView = new THREE.ARView(vrDisplay, renderer);
  
    // The ARPerspectiveCamera is very similar to THREE.PerspectiveCamera,
    // except when using an AR-capable browser, the camera uses
    // the projection matrix provided from the device, so that the
    // perspective camera's depth planes and field of view matches
    // the physical camera on the device.
    camera = new THREE.ARPerspectiveCamera(vrDisplay, 60, window.innerWidth / window.innerHeight, 0.01, 100);
  
    // Create a model to be placed in the world using picking
    model = new THREE.Mesh(new THREE.ConeBufferGeometry(
        MODEL_SIZE_IN_METERS / 2, MODEL_SIZE_IN_METERS),
        new THREE.MeshLambertMaterial( {color: 0x888888 } ));
  
    // Apply a rotation to the model so it faces in the direction of the
    // normal of the plane when the picking based reorientation is done
    model.geometry.applyMatrix(
        new THREE.Matrix4().makeTranslation(0, MODEL_SIZE_IN_METERS / 2, 0));
    model.geometry.applyMatrix(
        new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(90)));
    model.position.set(0, 0, -1);
    scene.add(model);
    // Add some lighting
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);
  
    // VRControls is a utility from three.js that applies the device's
    // orientation/position to the perspective camera, keeping our
    // real world and virtual world in sync.
    vrControls = new THREE.VRControls(camera);
  
    // Correctly handle window resize events
    window.addEventListener( 'resize', onWindowResize, false );
  
    update();
  }
  
  /**
   * On window resize, update the perspective camera's aspect ratio,
   * and call `updateProjectionMatrix` so that we can get the latest
   * projection matrix provided from the device
   */
  function onWindowResize () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  function update() {
    // Render the device's camera stream on screen first of all.
    // It allows to get the right pose synchronized with the right frame.
    arView.render();
  
    // Update our camera projection matrix in the event that
    // the near or far planes have updated
    camera.updateProjectionMatrix();
  
    // Update our perspective camera's positioning
    vrControls.update();
  
    // Render our three.js virtual scene
    renderer.clearDepth();
    renderer.render(scene, camera);
  
    var markers = vrDisplay.getMarkers(gui.markerType, MARKER_SIZE_IN_METERS);
    if (markers.length > 0) {
      model.matrix.fromArray(markers[0].modelMatrix);
      model.matrix.decompose(model.position, model.quaternion, scale);
    }
  
    // Kick off the requestAnimationFrame to call this function
    // when a new VRDisplay frame is rendered
    vrDisplay.requestAnimationFrame(update);
  }
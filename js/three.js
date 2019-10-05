if (!Detector.webgl) {

    Detector.addGetWebGLMessage();
    document.getElementById('container').innerHTML = "";

}

var container, stats;
var camera, scene, renderer, light;
var controls, water, sphere, cubeMap;
var zoomIn = false;

var parameters = {
    oceanSide: 2000,
    size: 1.0,
    distortionScale: 3.7,
    alpha: 1.0
};

var waterNormals;

init();
animate();

function init() {

    container = document.getElementById('container');

    //

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    //

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xaabbbb, 0.001);

    //

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(30, 30, 100);

    //

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set(0, 10, 0);
    controls.enablePan = false;
    controls.minDistance = 40.0;
    controls.maxDistance = 200.0;
    camera.lookAt(controls.target);

    setLighting();

    //

    setWater();

    //

    setSkybox();

    //

    var geometry = new THREE.IcosahedronGeometry(20, 2);

    for (var i = 0, j = geometry.faces.length; i < j; i++) {

        geometry.faces[i].color.setHex(Math.random() * 0xffffff);

    }

    var material = new THREE.MeshPhongMaterial({
        vertexColors: THREE.FaceColors,
        shininess: 10,
        envMap: cubeMap,
        side: THREE.DoubleSide
    });

    // sphere = new THREE.Mesh(geometry, material);
    // sphere.castShadow = true;
    // scene.add(sphere);


    var loader = new THREE.OBJLoader();

    // load a resource
    loader.load(
        // resource URL
        'dolphin.obj',
        // 'diver.obj',
        // 'glasses.obj',
        // called when resource is loaded
        function (object) {
            sphere = object;
            sphere.castShadow = true;
            scene.add(sphere);

        },
        // called when loading is in progresses
        function (xhr) {

            console.log((xhr.loaded / xhr.total * 100) + '% loaded');

        },
        // called when loading has errors
        function (error) {

            console.log('An error happened');

        }
    );



    // stats = new Stats();
    // container.appendChild(stats.dom);

    //

    // gui = new dat.GUI();

    // gui.add(parameters, 'distortionScale', 0, 8, 0.1);
    // gui.add(parameters, 'size', 0.1, 10, 0.1);
    // gui.add(parameters, 'alpha', 0.9, 1, .001);

    //

    window.addEventListener('resize', onWindowResize, false);

}

function setWater() {

    water = new THREE.Water(
        parameters.oceanSide * 5,
        parameters.oceanSide * 5, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            alpha: parameters.alpha,
            sunDirection: light.position.clone().normalize(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: parameters.distortionScale,
            fog: scene.fog != undefined
        }
    );

    water.rotation.x = -Math.PI / 2;
    water.receiveShadow = true;

    scene.add(water);

}

function setSkybox() {

    cubeMap = new THREE.CubeTexture([]);
    cubeMap.format = THREE.RGBFormat;

    var loader = new THREE.ImageLoader();
    loader.load('textures/skyboxsun25degtest.png', function (image) {

        var getSide = function (x, y) {

            var size = 1024;

            var canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;

            var context = canvas.getContext('2d');
            context.drawImage(image, -x * size, -y * size);

            return canvas;

        };

        cubeMap.images[0] = getSide(2, 1); // px
        cubeMap.images[1] = getSide(0, 1); // nx
        cubeMap.images[2] = getSide(1, 0); // py
        cubeMap.images[3] = getSide(1, 2); // ny
        cubeMap.images[4] = getSide(1, 1); // pz
        cubeMap.images[5] = getSide(3, 1); // nz
        cubeMap.needsUpdate = true;

    });

    var cubeShader = THREE.ShaderLib['cube'];
    cubeShader.uniforms['tCube'].value = cubeMap;

    var skyBoxMaterial = new THREE.ShaderMaterial({
        fragmentShader: cubeShader.fragmentShader,
        vertexShader: cubeShader.vertexShader,
        uniforms: cubeShader.uniforms,
        side: THREE.BackSide
    });

    var skyBox = new THREE.Mesh(
        new THREE.BoxGeometry(parameters.oceanSide * 5 + 100, parameters.oceanSide * 5 + 100, parameters.oceanSide * 5 +
            100),
        skyBoxMaterial
    );

    scene.add(skyBox);

}

function setLighting() {

    renderer.shadowMap.enabled = true;

    light = new THREE.DirectionalLight(0xffffbb, 1);
    light.position.set(-30, 30, -30);
    light.castShadow = true;
    light.shadow.camera.top = 45;
    light.shadow.camera.right = 40;
    light.shadow.camera.left = light.shadow.camera.bottom = -40;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 200;

    scene.add(light, new THREE.AmbientLight(0x888888));

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    requestAnimationFrame(animate);
    if (sphere) {
        render();
    }
    // stats.update();

}
var mainContainer = document.querySelector('#info'),
    triggerCtrl = mainContainer.querySelector('.button--trigger');
var fov = camera.fov,
    zoom = 1.0,
    inc = -0.01;
triggerCtrl.addEventListener('click', function () {
    var isOpen = mainContainer.classList.contains('landing-layout--open');

    if (!isOpen) {
        console.log("zoom");
        zoomIn = true;
        setTimeout(function () {
            document.getElementById("container").style.display = "none";
        }, 1000);
    } else {
        parameters.size = 1;
        zoomIn = false;
    }
});

function render() {

    var time = performance.now() * 0.001;
    // sphere.scale.set(1.4, 1.4, 1.4);
    sphere.scale.set(0.1, 0.1, 0.1);
    sphere.position.y = Math.sin(time) * 20 + 5;
    sphere.rotation.x = time * 0.7;
    sphere.rotation.z = time * 0.51;

    water.material.uniforms.time.value += 1.0 / 60.0;
    water.material.uniforms.size.value = parameters.size;
    water.material.uniforms.distortionScale.value = parameters.distortionScale;
    water.material.uniforms.alpha.value = 0.9;
    // water.material.uniforms.alpha.value = parameters.alpha;

    if (zoomIn) {
        camera.fov = fov * zoom;
        camera.updateProjectionMatrix();

        zoom += inc;
        // if (zoom <= 0.2 || zoom >= 1.0) {
        //     inc = -inc;
        // }
    } else {
        zoom = 1;
        camera.fov = fov * zoom;
        camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);

}
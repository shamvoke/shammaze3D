var ballImage = new Image();
ballImage.src = document.getElementById("ball").src;
var floorImage = new Image();
floorImage.src = document.getElementById("floor").src;
var brickImage = new Image();
brickImage.src = document.getElementById("brick").src;
var ballTexture = new THREE.Texture(ballImage);
var floorTexture = new THREE.Texture(floorImage);
var brickTexture = new THREE.Texture(brickImage);
ballTexture.needsUpdate = true;
floorTexture.needsUpdate = true;
brickTexture.needsUpdate = true;
var doneSound = document.getElementById("done");
var resetScore = document.getElementById("resetBtn");
resetBtn.addEventListener("click", confirmReset);
var camera = void 0,
  scene = void 0,
  renderer = void 0,
  light = void 0,
  mouseX = void 0,
  mouseY = void 0,
  maze = void 0,
  mazeMesh = void 0,
  mazeDimension = 11,
  planeMesh = void 0,
  ballMesh = void 0,
  ballRadius = 0.25,
  keyAxis = [0, 0],
  gameState = void 0,
  b2World = Box2D.Dynamics.b2World,
  b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
  b2BodyDef = Box2D.Dynamics.b2BodyDef,
  b2Body = Box2D.Dynamics.b2Body,
  b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
  b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
  b2Settings = Box2D.Common.b2Settings,
  b2Vec2 = Box2D.Common.Math.b2Vec2,
  wWorld = void 0,
  wBall = void 0;
var rollSound = document.getElementById("roll");
var rolling = false;
function adjustSound(speed) {
  var minSpeed = 0.5;
  var maxSpeed = 4.5;
  var minPitch = 0.5;
  var maxPitch = 2.0;
  var minVolume = 0.1;
  var maxVolume = 1.0;
  var pitch = mapRange(speed, minSpeed, maxSpeed, minPitch, maxPitch);
  var volume = mapRange(speed, minSpeed, maxSpeed, minVolume, maxVolume);
  rollSound.playbackRate = pitch;
  rollSound.volume = volume;
}
function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
function playRollSound() {
  rollSound.currentTime = 0;
  rollSound.play();
}
function stopRollSound() {
  rollSound.pause();
  rollSound.currentTime = 0;
}
function createPhysicsWorld() {
  wWorld = new b2World(new b2Vec2(0, 0), !0);
  var e = new b2BodyDef();
  (e.type = b2Body.b2_dynamicBody),
    e.position.Set(1, 1),
    (wBall = wWorld.CreateBody(e));
  var i = new b2FixtureDef();
  (i.density = 1),
    (i.friction = 0),
    (i.restitution = 0.6),
    (i.shape = new b2CircleShape(ballRadius)),
    wBall.CreateFixture(i),
    (e.type = b2Body.b2_staticBody),
    (i.shape = new b2PolygonShape()),
    i.shape.SetAsBox(0.5, 0.5);
  for (var t = 0; t < maze.dimension; t++)
    for (var n = 0; n < maze.dimension; n++)
      maze[t][n] &&
        ((e.position.x = t),
          (e.position.y = n),
          wWorld.CreateBody(e).CreateFixture(i));
  var listener = new Box2D.Dynamics.b2ContactListener();
  listener.BeginContact = function (contact) {
    var bodyA = contact.GetFixtureA().GetBody();
    var bodyB = contact.GetFixtureB().GetBody();
    if (bodyA === wBall || bodyB === wBall) {
      var velocity = wBall.GetLinearVelocity().Length();
      if (velocity > 4.5) {
        var hitSound = document.getElementById("hit");
        hitSound.currentTime = 0;
        hitSound.play();
      }
    }
  };
  setInterval(function () {
    var velocity = wBall.GetLinearVelocity().Length();
    if (velocity > 0.6 && !rolling) {
      adjustSound(velocity);
      playRollSound();
      rolling = true;
    } else if (velocity < 0.5 && rolling) {
      stopRollSound();
      rolling = false;
    }
  }, 100);
  rollSound.addEventListener("ended", playRollSound);
  wWorld.SetContactListener(listener);
}
function generate_maze_mesh(e) {
  for (var i = new THREE.Geometry(), t = 0; t < e.dimension; t++)
    for (var n = 0; n < e.dimension; n++)
      if (e[t][n]) {
        var a = new THREE.CubeGeometry(1, 1, 1, 1, 1, 1),
          o = new THREE.Mesh(a);
        (o.position.x = t),
          (o.position.y = n),
          (o.position.z = 0.5),
          THREE.GeometryUtils.merge(i, o);
      }
  var s = new THREE.MeshPhongMaterial({ map: brickTexture });
  return new THREE.Mesh(i, s);
}
function createRenderWorld() {
  (scene = new THREE.Scene()),
    (light = new THREE.PointLight(16777215, 1)).position.set(1, 1, 1.3),
    scene.add(light),
    (g = new THREE.SphereGeometry(ballRadius, 32, 16)),
    (m = new THREE.MeshPhongMaterial({ map: ballTexture })),
    (ballMesh = new THREE.Mesh(g, m)).position.set(1, 1, ballRadius),
    scene.add(ballMesh);
  var e = window.innerWidth / window.innerHeight;
  (camera = new THREE.PerspectiveCamera(63, e, 1, 1e3)).position.set(
    1,
    1,
    5
  ),
    scene.add(camera),
    (mazeMesh = generate_maze_mesh(maze)),
    scene.add(mazeMesh),
    (g = new THREE.PlaneGeometry(
      10 * mazeDimension,
      10 * mazeDimension,
      mazeDimension,
      mazeDimension
    )),
    (floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping),
    floorTexture.repeat.set(5 * mazeDimension, 5 * mazeDimension),
    (m = new THREE.MeshPhongMaterial({ map: floorTexture })),
    (planeMesh = new THREE.Mesh(g, m)).position.set(
      (mazeDimension - 1) / 2,
      (mazeDimension - 1) / 2,
      0
    ),
    planeMesh.rotation.set(Math.PI / 2, 0, 0),
    scene.add(planeMesh);
}
function updatePhysicsWorld() {
  var e = wBall.GetLinearVelocity();
  e.Multiply(0.95), wBall.SetLinearVelocity(e);
  var i = new b2Vec2(
    keyAxis[0] * wBall.GetMass() * 0.25,
    keyAxis[1] * wBall.GetMass() * 0.25
  );
  wBall.ApplyImpulse(i, wBall.GetPosition()),
    (keyAxis = [0, 0]),
    wWorld.Step(1 / 60, 8, 3);
}
function updateRenderWorld() {
  var e = wBall.GetPosition().x - ballMesh.position.x,
    i = wBall.GetPosition().y - ballMesh.position.y;
  (ballMesh.position.x += e), (ballMesh.position.y += i);
  var t = new THREE.Matrix4();
  t.makeRotationAxis(new THREE.Vector3(0, 1, 0), e / ballRadius),
    t.multiplySelf(ballMesh.matrix),
    (ballMesh.matrix = t),
    (t = new THREE.Matrix4()).makeRotationAxis(
      new THREE.Vector3(1, 0, 0),
      -i / ballRadius
    ),
    t.multiplySelf(ballMesh.matrix),
    (ballMesh.matrix = t),
    ballMesh.rotation.getRotationFromMatrix(ballMesh.matrix),
    (camera.position.x +=
      0.1 * (ballMesh.position.x - camera.position.x)),
    (camera.position.y +=
      0.1 * (ballMesh.position.y - camera.position.y)),
    (camera.position.z += 0.1 * (5 - camera.position.z)),
    (light.position.x = camera.position.x),
    (light.position.y = camera.position.y),
    (light.position.z = camera.position.z - 3.3);
}
function confirmReset(event) {
  event.preventDefault();
  if (confirm("Are you sure you want to reset your high score?")) {
    resetHighScore();
  }
  return false;
}
function resetHighScore() {
  localStorage.removeItem("highScore");
  $("#highScore").html("High Score cleared!");
  resetButton.removeEventListener("click", confirmReset);
  resetButton.addEventListener("click", confirmReset);
}
function gameLoop() {
  switch (gameState) {
    case "initialize":
      ((maze = generateSquareMaze(mazeDimension))[mazeDimension - 1][
        mazeDimension - 2
      ] = !1),
        createPhysicsWorld(),
        createRenderWorld(),
        camera.position.set(5, 5, 20),
        light.position.set(1, 1, 9),
        (light.intensity = 0);
      var e = Math.floor((mazeDimension - 1) / 2 - 4);
      $("#level").html("Level: " + e);
      var highScore = localStorage.getItem("highScore");
      if (highScore === null) {
        highScore = e;
      } else {
        highScore = parseInt(highScore);
        if (e > highScore) {
          highScore = e;
        }
      }
      localStorage.setItem("highScore", highScore);
      $("#highScore").html("Current best: Level " + highScore);
      gameState = "fade in";
      break;
    case "fade in":
      (light.intensity += 0.1 * (1 - light.intensity)),
        renderer.render(scene, camera),
        Math.abs(light.intensity - 1) < 0.05 &&
        ((light.intensity = 1.1), (gameState = "play"));
      break;
    case "play":
      updatePhysicsWorld();
      updateRenderWorld();
      renderer.render(scene, camera);
      var i = Math.floor(ballMesh.position.x + 0.5);
      var t = Math.floor(ballMesh.position.y + 0.5);
      if (i == mazeDimension && t == mazeDimension - 2) {
        doneSound.currentTime = 0;
        doneSound.play();
        mazeDimension += 2;
        gameState = "fade out";
      }
      break;
    case "fade out":
      updatePhysicsWorld(),
        updateRenderWorld(),
        (light.intensity += 0.1 * (0 - light.intensity)),
        renderer.render(scene, camera),
        Math.abs(light.intensity - 0) < 0.1 &&
        ((light.intensity = 0),
          renderer.render(scene, camera),
          (gameState = "initialize"));
  }
  requestAnimationFrame(gameLoop);
}
function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight),
    (camera.aspect = window.innerWidth / window.innerHeight),
    camera.updateProjectionMatrix();
}
function onMoveKey(e) {
  keyAxis = e.slice(0);
}
(jQuery.fn.centerv = function () {
  return (
    (wh = window.innerHeight),
    (h = this.outerHeight()),
    this.css("position", "absolute"),
    this.css("top", Math.max(0, (wh - h) / 2) + "px"),
    this
  );
}),
  (jQuery.fn.centerh = function () {
    return (
      (ww = window.innerWidth),
      (w = this.outerWidth()),
      this.css("position", "absolute"),
      this.css("left", Math.max(0, (ww - w) / 2) + "px"),
      this
    );
  }),
  (jQuery.fn.center = function () {
    return this.centerv(), this.centerh(), this;
  }),
  $(document).ready(function () {
      (renderer = new THREE.WebGLRenderer()).setSize(
        window.innerWidth,
        window.innerHeight
      ),
      document.body.appendChild(renderer.domElement),
      KeyboardJS.bind.axis("left", "right", "down", "up", onMoveKey),
      KeyboardJS.bind.axis("a", "d", "s", "w", onMoveKey),
      $(window).resize(onResize),
      (gameState = "initialize"),
      requestAnimationFrame(gameLoop);
  });
class JoystickController {
  constructor(e, i, t) {
    this.id = e;
    let n = document.getElementById(e);
    let joystickContainer = document.getElementById("shamstick"); // Get the joystick container
    (this.dragStart = null),
      (this.touchId = null),
      (this.active = !1),
      (this.value = { x: 0, y: 0 });
    let a = this;
    function o(e) {
      // Only activate if it's a touch event or a left mouse click
      if (e.type === 'touchstart' || (e.type === 'mousedown' && e.button === 0)) {
        e.preventDefault(); // Prevent default to avoid scrolling/zooming
        a.active = true;
        n.style.transition = "0s";
        joystickContainer.style.transition = "0s"; // No transition when appearing

        let clientX, clientY;
        if (e.changedTouches) {
          clientX = e.changedTouches[0].clientX;
          clientY = e.changedTouches[0].clientY;
          a.touchId = e.changedTouches[0].identifier;
        } else {
          clientX = e.clientX;
          clientY = e.clientY;
        }

        a.dragStart = { x: clientX, y: clientY };

        // Position the joystick container at the touch/click location
        joystickContainer.style.display = "flex"; // Make it visible
        joystickContainer.style.opacity = "1"; // Fade in
        joystickContainer.style.left = `${clientX - joystickContainer.offsetWidth / 2}px`;
        joystickContainer.style.top = `${clientY - joystickContainer.offsetHeight / 2}px`;
      }
    }
    function s(e) {
      if (!a.active) return;
      let o = null;
      if (e.changedTouches) {
        for (let i = 0; i < e.changedTouches.length; i++)
          a.touchId == e.changedTouches[i].identifier &&
            ((o = i),
              (e.clientX = e.changedTouches[i].clientX),
              (e.clientY = e.changedTouches[i].clientY));
        if (null == o) return;
      }
      const s = e.clientX - a.dragStart.x,
        r = e.clientY - a.dragStart.y,
        l = Math.atan2(r, s),
        d = Math.min(i, Math.hypot(s, r)),
        c = d * Math.cos(l),
        h = d * Math.sin(l);
      n.style.transform = `translate3d(${c}px, ${h}px, 0px)`;
      const m = Math.min(d, i); /* Clamp d to i (max visual radius) */
        const u = m * Math.cos(l),
        p = m * Math.sin(l),
        y = parseFloat((u / i).toFixed(4)), /* Scale by i (max visual radius) */
        x = parseFloat((p / i).toFixed(4));
      a.value = { x: y, y: x };
    }
    function r(e) {
      if (a.active) {
        if (e.changedTouches && a.touchId != e.changedTouches[0].identifier) {
          return;
        }
        n.style.transition = ".2s";
        n.style.transform = "translate3d(0px, 0px, 0px)";
        a.value = { x: 0, y: 0 };
        a.touchId = null;
        a.active = false;

        // Fade out and hide the joystick container
        joystickContainer.style.transition = "opacity 0.3s ease-out";
        joystickContainer.style.opacity = "0";
        setTimeout(() => {
          joystickContainer.style.display = "none";
        }, 300); // Hide after transition
      }
    }
    document.addEventListener("mousedown", o), // Listen on document for initial touch/click
    document.addEventListener("touchstart", o),
    document.addEventListener("mousemove", s, { passive: !1 }),
    document.addEventListener("touchmove", s, { passive: !1 }),
    document.addEventListener("mouseup", r),
    document.addEventListener("touchend", r);
  }
}
let joystick = new JoystickController("shamstickgear", 58, 2);

// Hide the joystick container initially
document.getElementById("shamstick").style.display = "none";
function update() {
  joystick.active &&
    (joystick.value.x > 0.5
      ? (keyAxis[0] = 1)
      : joystick.value.x < -0.5
        ? (keyAxis[0] = -1)
        : (keyAxis[0] = 0),
      joystick.value.y > 0.5
        ? (keyAxis[1] = -1)
        : joystick.value.y < -0.5
          ? (keyAxis[1] = 1)
          : (keyAxis[1] = 0)),
    requestAnimationFrame(update);
}
update();
const settingsModal = document.getElementById("settings-modal");
const settingsButton = document.getElementById("settings-button");
const closeSettingsButton = document.getElementById("close-settings-button");

settingsButton.addEventListener("click", () => {
    settingsModal.style.display = "block";
});

closeSettingsButton.addEventListener("click", () => {
    settingsModal.style.display = "none";
});

window.addEventListener("click", (event) => {
    if (event.target == settingsModal) {
        settingsModal.style.display = "none";
    }
});


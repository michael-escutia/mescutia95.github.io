/**
 * @file program.js
 * 
 * Program 6 - Lighting
 *
 * Referenced from source matsuda.
 * @author Michael Escutia
 */

// Vertex Shader Program
var SOLID_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +   // Model matrix
  'uniform mat4 u_NormalMatrix;\n' +   // Transformation matrix of the normal
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightColor_p1;\n' +     // Light color
  'uniform vec3 u_LightColor_p2;\n' +     // Light color
  'uniform vec3 u_LightPosition;\n' + // Position of the light source (in the world coordinate system)
  'uniform vec3 u_LightPosition_2;\n' + // Position of the light source (in the world coordinate system)
  'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
  'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  // Calculate world coordinate of vertex
  '  vec4 vertexPosition = u_ModelMatrix * a_Position;\n' +
     // Recalculate the normal based on the model matrix and make its length 1.
  '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  // Calculate the light direction and make it 1.0 in length
  '  vec3 p_lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n' +
  '  vec3 p_lightDirection_2 = normalize(u_LightPosition_2 - vec3(vertexPosition));\n' +
     // Calculate the dot product of the light direction and the orientation of a surface (the normal)
  '  float nDotL = max(dot(normal, u_LightDirection), 0.0);\n' +
  '  float p_nDotL = max(dot(normal, p_lightDirection), 0.0);\n' +
  '  float p_nDotL_2 = max(dot(normal, p_lightDirection_2), 0.0);\n' +
     // Calculate the color due to diffuse reflection
  '  vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
  '  vec3 p_diffuse = u_LightColor_p1 * a_Color.rgb * p_nDotL;\n' +
  '  vec3 p_diffuse_2 = u_LightColor_p2 * a_Color.rgb * p_nDotL_2;\n' +
     // Calculate the color due to ambient reflection
  '  vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +
     // Add the surface colors due to diffuse reflection and ambient reflection
  '  v_Color = vec4(diffuse + ambient + p_diffuse + p_diffuse_2, a_Color.a);\n' +
  '}\n';

// Fragment shader program
var SOLID_FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';

// Vertex Shader Program
var TEX_VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec2 a_TexCoord;\n' +
    'varying vec2 v_TexCoord;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '  v_TexCoord = a_TexCoord;\n' +
    '}\n';

// Fragment Shader Program
var TEX_FSHADER_SOURCE = 
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'uniform sampler2D u_Sampler;\n' +
    'varying vec2 v_TexCoord;\n' +
    'void main() {\n' +
    '  vec4 color = texture2D(u_Sampler, v_TexCoord);\n' +
    '  gl_FragColor = vec4(color.rgb, color.a);\n' +
    '}\n';

/* Matrices */
var g_normalMatrix = new Matrix4();
var g_projMatrix   = new Matrix4(); // Projection matrix
var g_viewMatrix   = new Matrix4(); // View matrix
var g_modelMatrix  = new Matrix4(); // Model matrix
var g_mvpMatrix    = new Matrix4(); // Model view projection matrix

/* Camera Movements */
var cam = {
  angle : 270.0,
  eyeX : 0.0,
  eyeY : 0.0,
  eyeZ : -15.0,
  lookX : 0.0,
  lookY : 0.0,
  lookZ : 0.0,
  turn_speed : 0.12,
  move_speed : 0.02
}

/* Other */
var curKey = {}; // Key Code Array
var g_last2 = Date.now();
var light_1 = 1;
var light_2 = 1;

/**
 * @function main()
 * Main function program.
 */
function main() 
{
  // Get the canvas element
  var canvas = document.getElementById('webgl');

  // Get the rendering context.
  var gl = getWebGLContext(canvas);
  if(!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  var solidProgram = createProgram(gl, SOLID_VSHADER_SOURCE, SOLID_FSHADER_SOURCE);
  var texProgram = createProgram(gl, TEX_VSHADER_SOURCE, TEX_FSHADER_SOURCE);

  // Get storage locations of attribute and uniform variables in program object for single color drawing
  solidProgram.a_Position = gl.getAttribLocation(solidProgram, 'a_Position');
  solidProgram.a_Normal = gl.getAttribLocation(solidProgram, 'a_Normal');
  solidProgram.a_Color = gl.getAttribLocation(solidProgram, 'a_Color');
  solidProgram.u_NormalMatrix = gl.getUniformLocation(solidProgram, 'u_NormalMatrix');
  solidProgram.u_MvpMatrix = gl.getUniformLocation(solidProgram, 'u_MvpMatrix');
  solidProgram.u_ModelMatrix = gl.getUniformLocation(solidProgram, 'u_ModelMatrix');
  solidProgram.u_LightColor = gl.getUniformLocation(solidProgram, 'u_LightColor');
  solidProgram.u_LightColor_p1 = gl.getUniformLocation(solidProgram, 'u_LightColor_p1');
  solidProgram.u_LightColor_p2 = gl.getUniformLocation(solidProgram, 'u_LightColor_p2');
  solidProgram.u_LightDirection = gl.getUniformLocation(solidProgram, 'u_LightDirection');
  solidProgram.u_AmbientLight = gl.getUniformLocation(solidProgram, 'u_AmbientLight');
  solidProgram.u_LightPosition = gl.getUniformLocation(solidProgram, 'u_LightPosition');
  solidProgram.u_LightPosition_2 = gl.getUniformLocation(solidProgram, 'u_LightPosition_2');
  
  // Get storage locations of attribute and uniform variables in program object for texture drawing
  texProgram.a_Position = gl.getAttribLocation(texProgram, 'a_Position');
  texProgram.a_TexCoord = gl.getAttribLocation(texProgram, 'a_TexCoord');
  texProgram.u_MvpMatrix = gl.getUniformLocation(texProgram, 'u_MvpMatrix');
  texProgram.u_Sampler = gl.getUniformLocation(texProgram, 'u_Sampler');
  
  // Init Buffers
  var cube = initCube(gl, 1.0, 0.0, 0.0);
  var light = initCube(gl, 1.0, 1.0, 1.0);
  var triangle = initPyramid(gl, 0.0, 1.0, 0.0);
  
  gl.useProgram(solidProgram);
  
  // Set the light color
  gl.uniform3f(solidProgram.u_LightColor, 1.0, 1.0, 1.0);
  gl.uniform3f(solidProgram.u_LightColor_p1, 1.0, 0.0, 0.0);
  gl.uniform3f(solidProgram.u_LightColor_p2, 1.0, 1.0, 1.0);
  
  // Set the light direction (in the world coordinate)
  var lightDirection = new Vector3([1.0, 1.0, 1.0]);
  lightDirection.normalize();     // Normalize
  gl.uniform3fv(solidProgram.u_LightDirection, lightDirection.elements);
  gl.uniform3f(solidProgram.u_LightPosition, 0.0, 2.0, 0.0);
  gl.uniform3f(solidProgram.u_LightPosition_2, 6.0, 1.0, -5);

  // Set the ambient light
  gl.uniform3f(solidProgram.u_AmbientLight, 0.2, 0.2, 0.2);


  // Init Texture
  var texture = initTextures(gl, texProgram);

  // Set clear color and enable the depth test
  gl.clearColor(0.0, 0.6, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);  

  // Calculate the view matrix and the projection matrix
  g_projMatrix.setPerspective(75.0, canvas.width/canvas.height, 1.0, 100.0);
  
  // Set camera look coordinates.
  cam.lookX = Math.cos(degToRad(cam.angle));
  cam.lookZ = -(Math.sin(degToRad(cam.angle)));

  // Up/Down Key Handlers
  document.onkeydown = function(e){ keyDown(e) };
  document.onkeyup = function(e){ keyUp(e) }; 

  // Animate
  var tick = function() {
    
    keyHandler();
    
    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Set initial camera direction.
    g_viewMatrix.setLookAt(cam.eyeX, 0, cam.eyeZ, cam.eyeX+cam.lookX, 0, cam.eyeZ+cam.lookZ, 0, 1, 0);

    // Draw Objects
    drawBuildings(gl, solidProgram, cube);
    drawLights(gl, solidProgram, light);
    drawMountain(gl, solidProgram, triangle);
    drawFloor(gl, texProgram, cube, texture);

    window.requestAnimationFrame(tick, canvas);
  };
  tick();
}

/**
 * @function initVertexBuffers
 * Initialize Vertices.
 * @param gl - WebGL context.
 */
function initCube(gl, r, g, b) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  
  var vertices = new Float32Array([   // Vertex coordinates
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
  ]);
  
  var normals = new Float32Array([   // Normal
     0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,     // v0-v1-v2-v3 front
     1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,     // v0-v3-v4-v5 right
     0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,     // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,     // v1-v6-v7-v2 left
     0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,     // v7-v4-v3-v2 down
     0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0      // v4-v7-v6-v5 back
  ]);

  // Colors
  var colors = new Float32Array([
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v1-v2-v3 front
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v3-v4-v5 right
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v5-v6-v1 up
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v1-v6-v7-v2 left
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v7-v4-v3-v2 down
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v4-v7-v6-v5 back
 ]);
  
  var texCoords = new Float32Array([   // Texture coordinates
     50.0, 50.0,   0.0, 50.0,   0.0, 0.0,   50.0, 0.0,
     0.0, 50.0,   0.0, 0.0,   50.0, 0.0,   50.0, 50.0,
     50.0, 0.0,   50.0, 50.0,   0.0, 50.0,   0.0, 0.0,
     50.0, 50.0,   0.0, 50.0,   0.0, 0.0,   50.0, 0.0,
     0.0, 0.0,   50.0, 0.0,   50.0, 50.0,   0.0, 50.0,
     0.0, 0.0,   50.0, 0.0,   50.0, 50.0,   0.0, 50.0 
  ]);

  var indices = new Uint8Array([        // Indices of the vertices
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);

  var o = new Object(); // Utilize Object to to return multiple buffer objects together

  // Write vertex information to buffer object
  o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
  o.colorBuffer = initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);
  o.normalBuffer = initArrayBufferForLaterUse(gl, normals, 3, gl.FLOAT);
  o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
  o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);

  o.numIndices = indices.length;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}

/**
 * @function initVertexBuffers
 * Initialize Vertices.
 * @param gl - WebGL context.
 */
function initPyramid(gl, r, g, b) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  
  var vertices = new Float32Array([   // Vertex coordinates
     0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
     0.0, 1.0, 0.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   0.0, 1.0, 0.0,    // v0-v3-v4-v5 right
     0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,    // v0-v5-v6-v1 up
     0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0     // v4-v7-v6-v5 back
  ]);
  
  var normals = new Float32Array([   // Normal
     0.0, 0.5, 1.0,   0.0, 0.5, 1.0,   0.0, 0.5, 1.0,   0.0, 0.5, 1.0,     // v0-v1-v2-v3 front
     1.0, 0.5, 0.0,   1.0, 0.5, 0.0,   1.0, 0.5, 0.0,   1.0, 0.5, 0.0,     // v0-v3-v4-v5 right
     0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,     // v0-v5-v6-v1 up
    -1.0, 0.5, 0.0,  -1.0, 0.5, 0.0,  -1.0, 0.5, 0.0,  -1.0, 0.5, 0.0,     // v1-v6-v7-v2 left
     0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,     // v7-v4-v3-v2 down
     0.0, 0.5,-1.0,   0.0, 0.5,-1.0,   0.0, 0.5,-1.0,   0.0, 0.5,-1.0      // v4-v7-v6-v5 back
  ]);

  // Colors
  var colors = new Float32Array([
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v1-v2-v3 front
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v3-v4-v5 right
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v5-v6-v1 up
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v1-v6-v7-v2 left
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v7-v4-v3-v2 down
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v4-v7-v6-v5 back
 ]);
  
  var texCoords = new Float32Array([   // Texture coordinates
     50.0, 50.0,   0.0, 50.0,   0.0, 0.0,   50.0, 0.0,
     0.0, 50.0,   0.0, 0.0,   50.0, 0.0,   50.0, 50.0,
     50.0, 0.0,   50.0, 50.0,   0.0, 50.0,   0.0, 0.0,
     50.0, 50.0,   0.0, 50.0,   0.0, 0.0,   50.0, 0.0,
     0.0, 0.0,   50.0, 0.0,   50.0, 50.0,   0.0, 50.0,
     0.0, 0.0,   50.0, 0.0,   50.0, 50.0,   0.0, 50.0 
  ]);

  var indices = new Uint8Array([        // Indices of the vertices
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);

  var o = new Object(); // Utilize Object to to return multiple buffer objects together

  // Write vertex information to buffer object
  o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
  o.colorBuffer = initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);
  o.normalBuffer = initArrayBufferForLaterUse(gl, normals, 3, gl.FLOAT);
  o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
  o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);

  o.numIndices = indices.length;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}

/**
 * @function initTexture
 * Initialize Texture.
 * @param gl - WebGL context.
 * @param program - shader program.
 */
function initTextures(gl, program) {
  var texture = gl.createTexture(); // Create a texture object

  var image = new Image();  // Create a image object
  if (!image) {
    console.log('Failed to create the image object');
    return null;
  }
  // Register the event handler to be called when image loading is completed
  image.onload = function() {
    // Write the image data to texture object
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image Y coordinate
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // Pass the texure unit 0 to u_Sampler
    gl.useProgram(program);
    gl.uniform1i(program.u_Sampler, 0);

    gl.bindTexture(gl.TEXTURE_2D, null); // Unbind texture
  };

  // Tell the browser to load an Image
  image.src = '../resource/grass.jpg';

  return texture;
}

/**
 * @function degToRad
 * Converts degrees to radians.
 * @param degree - The degree amount.
 */
function degToRad(degree) 
{
  return degree * Math.PI / 180;
}

/**
 * Key Press Down
 */
function keyDown (event) 
{
  curKey[event.keyCode] = true;
  
  // 1 key
  if (curKey[49]) {
    light_1 *= (-1);
  }
  
  // 2 key
  if (curKey[50]) {
    light_2 *= (-1);
  }
}

/**
 * Key Press Up
 */
function keyUp (event) 
{
  curKey[event.keyCode] = false;
}


/**
 * @function keyHandler
 * Handles key events.
 */
function keyHandler()
{
  var now = Date.now();
  var elapsed = now - g_last2;
  g_last2 = now;
  
  // Left key
  if (curKey[37]) {
    cam.angle = ((cam.turn_speed*elapsed) + cam.angle)%360;
    cam.lookX = Math.cos(degToRad(cam.angle));
    cam.lookZ = -(Math.sin(degToRad(cam.angle)));
  } 
  // Right key
  else if (curKey[39]) {
    cam.angle = ((-(cam.turn_speed)*elapsed) + cam.angle)%360;
    cam.lookX = Math.cos(degToRad(cam.angle));
    cam.lookZ = -(Math.sin(degToRad(cam.angle)));
  } 

  // Up key
  if (curKey[38]) {
    cam.eyeX += cam.lookX*(cam.move_speed*elapsed);
    cam.eyeZ += cam.lookZ*(cam.move_speed*elapsed);
  } 
  // Down key
  else if (curKey[40]) {
    cam.eyeX += -cam.lookX*(cam.move_speed*elapsed);
    cam.eyeZ += -cam.lookZ*(cam.move_speed*elapsed);
  }
}


var g_last = Date.now();
var cur_Angle = 0.0;
var ANGLE_STEP = 45;

/**
 * @function drawBuildings
 * Draws building objects to the screen.
 * @param gl - WebGL context.
 * @param program - Shader program.
 * @param o - Object.
 */
function drawBuildings(gl, program, o) {
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  cur_Angle = (cur_Angle + (ANGLE_STEP*elapsed)/1000.0) % 360;
  
  gl.useProgram(program);   // Tell that this program object is used
  
  if(light_1 == 1)
    gl.uniform3f(program.u_LightColor_p1, 1.0, 1.0, 1.0);
  else
    gl.uniform3f(program.u_LightColor_p1, 0.0, 0.0, 0.0);

  if(light_2 == 1)
    gl.uniform3f(program.u_LightColor_p2, 1.0, 1.0, 1.0);
  else
    gl.uniform3f(program.u_LightColor_p2, 0.0, 0.0, 0.0);

  // Assign the buffer objects and enable the assignment
  initAttributeVariable(gl, program.a_Position, o.vertexBuffer); // Vertex coordinates
  initAttributeVariable(gl, program.a_Color, o.colorBuffer); // Colors
  initAttributeVariable(gl, program.a_Normal, o.normalBuffer);   // Normal
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);  // Bind indices
  
  /** Building 1 **/
  g_modelMatrix.setTranslate(6.0, 0.5, 2.0);
  g_modelMatrix.scale(2.0, 2.0, 2.0);
  g_modelMatrix.rotate(cur_Angle, 0, 1, 0);
  gl.uniformMatrix4fv(program.u_ModelMatrix, false, g_modelMatrix.elements);
  g_normalMatrix.setInverseOf(g_modelMatrix);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(program.u_NormalMatrix, false, g_normalMatrix.elements);
  drawCube(gl, program, o, 36, 0);
}

/**
 * @function drawMountains
 * Draws mountain object to the screen.
 * @param gl - WebGL context.
 * @param program - Shader program.
 * @param o - Object.
 */
function drawMountain(gl, program, o) {
  gl.useProgram(program);   // Tell that this program object is used

  // Assign the buffer objects and enable the assignment
  initAttributeVariable(gl, program.a_Position, o.vertexBuffer); // Vertex coordinates
  initAttributeVariable(gl, program.a_Color, o.colorBuffer); // Colors
  //initAttributeVariable(gl, program.a_Normal, o.normalBuffer);   // Normal
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);  // Bind indices
  
  /** Building 1 **/
  g_modelMatrix.setTranslate(-6.0, 2.0, 2.0);
  g_modelMatrix.scale(3.0, 3.0, 3.0);
  g_modelMatrix.rotate(cur_Angle, 0, 1, 0);
  gl.uniformMatrix4fv(program.u_ModelMatrix, false, g_modelMatrix.elements);
  g_normalMatrix.setInverseOf(g_modelMatrix);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(program.u_NormalMatrix, false, g_normalMatrix.elements);
  drawCube(gl, program, o, 36, 0);
}

/**
 * @function drawLights
 * Draws mountain object to the screen.
 * @param gl - WebGL context.
 * @param program - Shader program.
 * @param o - Object.
 */
function drawLights(gl, program, o) {
  gl.useProgram(program);   // Tell that this program object is used

  // Assign the buffer objects and enable the assignment
  initAttributeVariable(gl, program.a_Position, o.vertexBuffer); // Vertex coordinates
  initAttributeVariable(gl, program.a_Color, o.colorBuffer); // Colors
  initAttributeVariable(gl, program.a_Normal, o.normalBuffer);   // Normal
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);  // Bind indices
  
  /** Light 1 **/
  g_modelMatrix.setTranslate(0.0, 2.0, 0.0);
  if(light_1 == 1)
    g_modelMatrix.scale(0.5, 0.5, 0.5);
  else
    g_modelMatrix.scale(0.1, 0.1, 0.1);
  gl.uniformMatrix4fv(program.u_ModelMatrix, false, g_modelMatrix.elements);
  g_normalMatrix.setInverseOf(g_modelMatrix);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(program.u_NormalMatrix, false, g_normalMatrix.elements);
  drawCube(gl, program, o, 36, 0);
  
  /** Light 2 **/
  g_modelMatrix.setTranslate(6.0, 1.0, -5);
  if(light_2 == 1)
    g_modelMatrix.scale(0.5, 0.5, 0.5);
  else
    g_modelMatrix.scale(0.1, 0.1, 0.1);
  gl.uniformMatrix4fv(program.u_ModelMatrix, false, g_modelMatrix.elements);
  g_normalMatrix.setInverseOf(g_modelMatrix);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(program.u_NormalMatrix, false, g_normalMatrix.elements);
  drawCube(gl, program, o, 36, 0);
}

/**
 * @function drawFloor
 * Draw floor.
 * @param gl - WebGL context.
 * @param program - Shader Program.
 * @param o - Object.
 * @param texture - Texture object.
 */
function drawFloor(gl, program, o, texture) {
  gl.useProgram(program);   // Tell that this program object is used

  // Assign the buffer objects and enable the assignment
  initAttributeVariable(gl, program.a_Position, o.vertexBuffer);  // Vertex coordinates
  initAttributeVariable(gl, program.a_TexCoord, o.texCoordBuffer);// Texture coordinates
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer); // Bind indices

  // Bind texture object to texture unit 0
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  /** Floor **/
  g_modelMatrix.setTranslate(0.0, -1.6, 0.0);
  g_modelMatrix.scale(100.0, 0.01, 100.0);
  drawCube(gl, program, o, 36, 0);

  //drawCube(gl, program, o, 36, 0);
}

/**
 * @function initAttributeVariable
 * Assign the buffer objects and enable the assignment.
 * @param gl - WebGL context.
 * @param a_attribute - Attribute.
 * @param buffer - Buffer object.
 */
function initAttributeVariable(gl, a_attribute, buffer) 
{
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
}

/**
 * @function drawCube
 * Rendering function.
 * @param gl - WebGL context.
 * @param program - Shader Program.
 * @param o - Object.
 * @param n - Number of vertices.
 * @param i - Index of vertice array.
 */
function drawCube(gl, program, o, n, i) 
{
  g_mvpMatrix.set(g_projMatrix);
  g_mvpMatrix.multiply(g_viewMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

  gl.drawElements(gl.TRIANGLES, n, o.indexBuffer.type, i);   // Draw
}

/**
 * @function initArrayBufferForLaterUse
 * Create array buffer for later use.
 * @param gl - WebGL context.
 * @param data - Date being added to array.
 * @param num - Num.
 * @param type - Data type.
 */
function initArrayBufferForLaterUse(gl, data, num, type) {
  var buffer = gl.createBuffer();   // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Keep the information necessary to assign to the attribute variable later
  buffer.num = num;
  buffer.type = type;

  return buffer;
}

/**
 * @function initArrayBufferForLaterUse
 * Create element array buffer for later use.
 * @param gl - WebGL context.
 * @param data - Date being added to array.
 * @param type - Data type.
 */
function initElementArrayBufferForLaterUse(gl, data, type) {
  var buffer = gl.createBuffer();　  // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

  buffer.type = type;

  return buffer;
}
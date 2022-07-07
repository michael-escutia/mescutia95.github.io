/**
 * @file program.js
 * 
 * Object 1:
 * - Can increase the number of sides to n-poly shapes.
 * - Can shade the object to give it a 3D effect.
 *
 * Object 2:
 * - Star shape with random color and random drawing type.
 *
 * Referenced from source matsuda.
 * @author Michael Escutia
 */

// Vertex Shader Program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'void main() {\n' +
    '   gl_Position = a_Position;\n' +
    '   gl_PointSize = 10.0;\n' +
    '}\n';

// Fragment Shader Program
var FSHADER_SOURCE = 
    'precision mediump float;\n' +
    'uniform vec4 u_FragColor;\n' +
    'void main() {\n' +
    '   gl_FragColor = u_FragColor;\n' +
    '}\n';

// Buffers
var shapeBuffer_1;
var circleBuffer;

// Vertices
var circle  = new Float32Array(6);
var shape_1 = new Float32Array([
  0.0,-0.35,-0.32,-0.5,-0.26,-0.15,-0.5,0.11,-0.16,0.18,
  0.0,0.5,0.16,0.18,0.5,0.11,0.26,-0.15,0.32,-0.5
]);

// Other variables
var numSides = 3; // Number of sides for the circle.
var radius = 0.5; // Radius
var drawType = 1;
var R = 0.0; // Red
var G = 0.0; // Green
var B = 0.0; // Blue
var intensity = document.getElementById('intensity').value;


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
  if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  // Init App
  var n = initApp(gl);
  if(n < 0) {
    console.log('Failed to set up app.');
    return;
  }
  
  // App 2 Button
  var app_2_btn = document.getElementById('app_2_btn');
  var app_2 = function(){
    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawApp_2(gl);
  }
  app_2_btn.onclick = app_2;

  // Increase Side Button
  var inc_btn = document.getElementById('inc_btn');
  var inc_sides = function(){
    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    numSides++;
    drawApp_1(gl);
  }
  inc_btn.onclick = inc_sides; 

  // Decrease Side Button
  var dec_btn = document.getElementById('dec_btn');
  var dec_sides = function(){
    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    numSides--;
    drawApp_1(gl);
  }
  dec_btn.onclick = dec_sides;
  
  // Reset Button
  var reset_btn = document.getElementById('reset_btn');
  var app_1_btn = document.getElementById('app_1_btn');
  var reset = function(){
    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    numSides = 3;
    drawType = 1;
    drawApp_1(gl);
  }
  reset_btn.onclick = reset;
  app_1_btn.onclick = reset;
  
  // Mid Button
  var mid_btn = document.getElementById('mid_btn');
  var mid = function(){
    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawType = 1;
    drawApp_1(gl);
  }
  mid_btn.onclick = mid;
  
  // Top Button
  var top_btn = document.getElementById('top_btn');
  var top = function(){
    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawType = 2;
    drawApp_1(gl);
  }
  top_btn.onclick = top;
  
  // Update
  var update_btn = document.getElementById('update_btn');
  var update_vals = function(){
    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    intensity = document.getElementById('intensity').value;
    drawApp_1(gl);
  }
  update_btn.onclick = update_vals; 
}

/**
 * @function initApp
 * Sets up both appication demos.
 * Creates default drawing to screen.
 * @param gl - WebGL context.
 */
function initApp(gl)
{
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Init Buffer
  initBuffer(gl);

  // Default Circle.
  drawApp_1(gl);
}

/**
 * @function initBuffer
 * Initialize buffers.
 * @param gl - WebGL context.
 */
function initBuffer(gl)
{
  circleBuffer = gl.createBuffer();
  if (!circleBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  shapeBuffer_1 = gl.createBuffer();
  if (!circleBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBuffer_1);

  // Write data into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, shape_1, gl.STATIC_DRAW);

  return;
}

/**
 * @function drawApp_1
 * Drawing first application.
 * @param gl - WebGL context.
 */
function drawApp_1(gl)
{
  var decShade;

  R = 1.0;
  G = 0.0;
  B = 0.0;

  if(drawType == 1){
    decShade = (intensity/numSides);
    circle[0] = 0.0;
    circle[1] = 0.0;

    for(i=1; i <= numSides; ++i){
      for(n=i, x=2; n < i+2; ++n, x+=2){
        var coordArray = divideCircle(n, numSides, radius);
        circle[x] = coordArray[0];
        circle[x+1] = coordArray[1];
      }
      
      // Bind the buffer object to target
      gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer);

      // Update into the buffer object
      gl.bufferData(gl.ARRAY_BUFFER, circle, gl.STATIC_DRAW);
      
      draw(gl, 3, gl.TRIANGLE_FAN);
      R-=decShade;
    }
  }
  
  if(drawType == 2){
    decShade = (intensity/(numSides-2));
    var coordArray = divideCircle(1, numSides, radius);
    circle[0] = coordArray[0];
    circle[1] = coordArray[1];

    for(i=2; i <= numSides; ++i){
      for(n=i, x=2; n < i+2; ++n, x+=2){
        var coordArray_2 = divideCircle(n, numSides, radius);
        circle[x] = coordArray_2[0];
        circle[x+1] = coordArray_2[1];
      }
      
      // Bind the buffer object to target
      gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer);

      // Updata data into the buffer object
      gl.bufferData(gl.ARRAY_BUFFER, circle, gl.STATIC_DRAW);
      
      draw(gl, 3, gl.TRIANGLE_FAN);
      R-=decShade;
    }
  }
}


/**
 * @function divideCircle
 *
 * Math function that divides a circle into equal parts.
 *
 * @param n - Point index.
 * @param k - Number of sides.
 * @param r - Radius.
 * @return The (x,y) coordinates of n point.
 */
function divideCircle(n, k, r)
{
  var coord = [0.0,0.0]; // (x,y)

  // Calculate the x,y coordinates
  var theta = (2*n*Math.PI)/k;  // radians
  coord[0] = r*Math.sin(theta); // x
  coord[1] = r*Math.cos(theta); // y

  return coord;
}

/**
 * @function drawApp_2
 * Drawing Second application.
 * @param gl - WebGL context.
 */
function drawApp_2(gl)
{
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBuffer_1);
  
  var drawType = Math.floor(Math.random() * (7 - 1 + 1)) + 1; // 1-7

  // Randomize RGB value.
  R = (Math.floor(Math.random() * (100 - 10 + 1)) + 10)*0.01; // 0.01 - 1.00
  G = (Math.floor(Math.random() * (100 - 10 + 1)) + 10)*0.01; // 0.01 - 1.00
  B = (Math.floor(Math.random() * (100 - 10 + 1)) + 10)*0.01; // 0.01 - 1.00
  
  starPoints = 10; // Number of points on the star
  
  // Different drawing types.
  if(drawType == 1){
    draw(gl, starPoints, gl.POINTS);
  }
  
  if(drawType == 2){
    draw(gl, starPoints, gl.LINES);
  }
  
  if(drawType == 3){
    draw(gl, starPoints, gl.LINE_STRIP);
  }
  
  if(drawType == 4){
    draw(gl, starPoints, gl.LINE_LOOP);
  }
  
  if(drawType == 5){
    draw(gl, starPoints, gl.TRIANGLES);
  }
  
  if(drawType == 6){
    draw(gl, starPoints, gl.TRIANGLE_STRIP);
  }
  
  if(drawType == 7){
    draw(gl, starPoints, gl.TRIANGLE_FAN);
  }
  
  return;
}

/**
 * @function draw
 * Drawing buffer to screen.
 * @param gl - WebGL context.
 * @param num - Number range.
 * @param type - Type of drawing method.
 */
function draw(gl, num, type)
{
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  // Get Storage location of u_FragColor
  var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if(!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return -1;
  }

  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  gl.uniform4f(u_FragColor, R, G, B, 1);

  gl.drawArrays(type, 0, num);
}
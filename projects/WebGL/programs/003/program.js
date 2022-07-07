/**
 * @file program.js
 * 
 * Tug of RPS.
 * Simple game of rock paper scissors with tug of war visuals.
 *
 * Referenced from source matsuda.
 * @author Michael Escutia
 */

// Vertex Shader Program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform mat4 u_xformMatrix;\n' +
    'void main() {\n' +
    '   gl_Position = u_xformMatrix * a_Position;\n' +
    '}\n';

// Fragment Shader Program
var FSHADER_SOURCE = 
    'precision mediump float;\n' +
    'uniform vec4 u_FragColor;\n' +
    'void main() {\n' +
    '   gl_FragColor = u_FragColor;\n' +
    '}\n';

/* Buffers */
var mud_Buffer;
var floor_Buffer;
var rope_Buffer;
var person1_Buffer;
var person2_Buffer;

// Player Movements
var player_Angle = 0.0;
var player_Tx = -0.3;
var player_Ty = -0.34;

// AI Movements
var ai_Angle = 0.0;
var ai_Tx = 0.3;
var ai_Ty = -0.34;

// Rope Movements
var rope_Tx = 0.0;
var rope_Ty = -0.34;

/* Other */
var score = 0;

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
  
  var xformMatrix = new Matrix4(); // Transform matrix.

  // Init App
  var n = initApp(gl, xformMatrix);
  if(n < 0) {
    console.log('Failed to set up app.');
    return;
  }
  
  var direction; // Direction where characters will move.
  
  // Rock Button
  var rock_btn = document.getElementById('rock_btn');
  var rock = function(){
    if(score < 3 && score > -3){
      direction = playGame(1);
      tick();
    }
    if(score == 3 || score == -3) 
      endGame();
  }
  rock_btn.onclick = rock;

  // Paper Button
  var paper_btn = document.getElementById('paper_btn');
  var paper = function(){
    if(score < 3 && score > -3){
      direction = playGame(2);
      tick();
    }
    if(score == 3 || score == -3) 
      endGame();
  }
  paper_btn.onclick = paper; 

  // Scissor Button
  var scissor_btn = document.getElementById('scissor_btn');
  var scissor = function(){
    if(score < 3 && score > -3){
      direction = playGame(3);
      tick();
    }
    if(score == 3 || score == -3)
      endGame();
  }
  scissor_btn.onclick = scissor;
  
  // Animation ticker.
  var cur_moves = 10;
  
  // Start drawing
  var tick = function() {
    animate_1(direction);
    drawApp(gl, xformMatrix);
    --cur_moves;
    if(cur_moves>0)
      requestAnimationFrame(tick); // Request that the browser calls tick
    else
      cur_moves = 10;
  };
  
  var winner; // Store who the winner is.
  // End game text.
  var endGame = function() {
    if(score == 3){
      document.getElementById('handsPlayed').innerHTML = "Player WINS!";
      winner = 0;
    }
    else{
      document.getElementById('handsPlayed').innerHTML = "AI WINS!";
      winner = 1;
    }
    endGame_Animation();      
  };
  
  // End Game animation.
  var endGame_Animation = function() {
    animate_2(winner); 
    drawApp(gl, xformMatrix);
    requestAnimationFrame(endGame_Animation);
  };
}

/**
 * @function initApp
 * Sets up both appication demos.
 * Creates default drawing to screen.
 * @param gl - WebGL context.
 */
function initApp(gl, xformMatrix)
{
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.7, 1.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Init Buffer
  initBuffer(gl);
  
  // Draw the visuals
  drawApp(gl, xformMatrix);
}

/**
 * @function initBuffer
 * Initialize buffers.
 * @param gl - WebGL context.
 */
function initBuffer(gl)
{
  
  // Create vertice data.
  var mud = new Float32Array([-0.8,-0.47,-0.47,-0.6,-0.13,-0.67,
                              0.13,-0.67,0.47,-0.6,0.8,-0.47]);
  
  var floor = new Float32Array([-1.0,-0.47,1.0,-0.47,
                              -1.0,-1.0,1.0,-1.0]);
  
  var person = new Float32Array([-0.05, 0.13, 0.05, 0.13,
                                 -0.05, -0.13, 0.05, -0.13]);
  
  var rope = new Float32Array([-0.26,0.015,0.26,0.015,
                               -0.26,-0.015,0.26,-0.015]);
  
  /* Make Mud Buffer */
  mud_Buffer = gl.createBuffer();
  if (!mud_Buffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, mud_Buffer);

  // Write data into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, mud, gl.STATIC_DRAW);

  
  /* Make Floor Buffer */
  floor_Buffer = gl.createBuffer();
  if (!floor_Buffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, floor_Buffer);

  // Write data into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, floor, gl.STATIC_DRAW);

  /* Make Rope Buffer */
  rope_Buffer = gl.createBuffer();
  if (!rope_Buffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, rope_Buffer);

  // Write data into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, rope, gl.STATIC_DRAW);

  /* Make Player Buffer */
  person1_Buffer = gl.createBuffer();
  if (!person1_Buffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, person1_Buffer);

  // Write data into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, person, gl.STATIC_DRAW);
  
  /* Make AI Buffer */
  person2_Buffer = gl.createBuffer();
  if (!person2_Buffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, person2_Buffer);

  // Write data into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, person, gl.STATIC_DRAW);

  return;
}

/**
 * @function drawApp_1
 * Drawing first application.
 * @param gl - WebGL context.
 * @param xformMatrix - transform matrix.
 */
function drawApp(gl, xformMatrix)
{
 // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.7, 1.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // Default matrix for background.
  xformMatrix.setTranslate(0,0,0);
  
  // Pass the rotation matrix to the vertex shader
  var u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  
  // Draw Floor
  gl.bindBuffer(gl.ARRAY_BUFFER, floor_Buffer);
  draw(gl, 4, gl.TRIANGLE_STRIP, 0.3, 0.8, 0.2);
  
  // Draw Mud
  gl.bindBuffer(gl.ARRAY_BUFFER, mud_Buffer);
  draw(gl, 6, gl.TRIANGLE_FAN, 0.6, 0.4, 0);
  
  // Draw Rope
  gl.bindBuffer(gl.ARRAY_BUFFER, rope_Buffer);
  xformMatrix.setTranslate(rope_Tx,rope_Ty,0);
  var u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  draw(gl, 4, gl.TRIANGLE_STRIP, 1, 0.8, 0);
  
  // Draw Player
  gl.bindBuffer(gl.ARRAY_BUFFER, person1_Buffer);
  xformMatrix.setTranslate(player_Tx,player_Ty,0);
  xformMatrix.rotate(player_Angle,0,0,1);
  u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  draw(gl, 4, gl.TRIANGLE_STRIP, 0, 0, 1);
  
  // Draw AI
  gl.bindBuffer(gl.ARRAY_BUFFER, person2_Buffer);
  xformMatrix.setTranslate(ai_Tx,ai_Ty,0);
  xformMatrix.rotate(ai_Angle,0,0,1);
  u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');
  gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);
  draw(gl, 4, gl.TRIANGLE_STRIP, 1, 0, 0);
}

/**
 * @function draw
 * Drawing buffer to screen.
 * @param gl - WebGL context.
 * @param num - Number range.
 * @param type - Type of drawing method.
 * @param R - Red.
 * @param G - Green.
 * @param B - Blue.
 */
function draw(gl, num, type, R, G, B)
{
  // Get storage location of a_Position
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

/**
 * @function playGame
 * Game of rock paper scissors.
 * @param hand - player hand.
 */
function playGame(hand)
{
  // 1 = rock
  // 2 = paper
  // 3 = scissor
  
  // Let AI randomly choose a hand.
  var ai_hand = Math.floor(Math.random() * (3 - 1 + 1)) + 1; // 1-3
  
  // Store the name of the each players hand.
  var hand_name1;
  var hand_name2;
  
  var return_val = 0;
  
  // Player Hand Names
  if (hand == 1)
    hand_name1 = "ROCK";
  if (hand == 2)
    hand_name1 = "PAPER";
  if (hand == 3)
    hand_name1 = "SCISSOR";
  
  // AI Hand Names 
  if (ai_hand == 1)
    hand_name2 = "ROCK";
  if (ai_hand == 2)
    hand_name2 = "PAPER";
  if (ai_hand == 3)
    hand_name2 = "SCISSOR";
  
  // if player wins
  if(hand == 1 && ai_hand == 3){
    score++;
    return_val = -1;
  }
  else if(hand == 2 && ai_hand == 1){
    score++;
    return_val = -1;
  }
  else if(hand == 3 && ai_hand == 2){
    score++;
    return_val = -1;
  }
  
  // if AI wins
  if(hand == 3 && ai_hand == 1){
    score--;
    return_val = 1;
  }
  else if(hand == 1 && ai_hand == 2){
    score--;
    return_val = 1;
  }
  else if(hand == 2 && ai_hand == 3){
    score--;
    return_val =  1;
  }
  
  // else it is a tie
  
  // Print text.
  document.getElementById('handsPlayed').innerHTML = hand_name1 + " vs " + hand_name2;
  document.getElementById('Scoreboard').innerHTML = "Score: " + score;
  
  return return_val;
}

/**
 * @function animate_1
 * Tugging animation.
 * @param direction - direction players will move.
 */
function animate_1(direction)
{
  if(direction != 0){
    player_Tx = player_Tx + (direction*0.01);
    ai_Tx = ai_Tx + (direction*0.01);
    rope_Tx = rope_Tx + (direction*0.01);   
  }
}

var g_last = Date.now();
var shift = 0; // shift the loser and rope to ground.
/**
 * @function animate_2
 * Victory animation.
 * @param winner - Boolean that decides which winner to rotate.
 */
function animate_2(winner)
{
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  // Player wins
  if(winner == 0){
    player_Angle = (player_Angle + (180 * elapsed) / 1000.0)%360;
    if(shift == 0){
      ai_Angle = ai_Angle + 90;
      ai_Ty = ai_Ty - 0.09;
      rope_Ty = rope_Ty - 0.115;
      shift = 1;
    }
  }
  
  // AI wins
  if(winner == 1){
    ai_Angle = (ai_Angle + (180 * elapsed) / 1000.0)%360;
    if(shift == 0){
      player_Angle = player_Angle + 90;
      player_Ty = player_Ty - 0.09;
      rope_Ty = rope_Ty - 0.115;
      shift = 1;
    }
  }
}
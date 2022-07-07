/**
 * program.js
 * @fileoverview Simple "drawing" program. Can change color and brush size.
 * Referenced from source matsuda.
 * @author Michael Escutia
 */

// Vertex Shader Program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_Size;\n' +
  'void main() {\n' +
  '   gl_Position = a_Position;\n' +
  '   gl_PointSize = u_Size;\n' +
  '}\n';

// Fragment Shader Program
var FSHADER_SOURCE = 
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '   gl_FragColor = u_FragColor;\n' +
  '}\n';

var r = document.getElementById('red').value;
var g = document.getElementById('green').value;
var b = document.getElementById('blue').value;
var ps = document.getElementById('pointSize').value;

function main() {
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

  // Get Storage location of a_Position
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get Storage location of u_Size
  var u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if(!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }

  // Get Storage location of u_FragColor
  var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if(!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Create update function.
  var update_btn = document.getElementById('update_btn');
  var update_vals = function(){
    r = document.getElementById('red').value;
    g = document.getElementById('green').value;
    b = document.getElementById('blue').value;
    ps = document.getElementById('pointSize').value;
  }
  update_btn.onclick = update_vals; 

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function(ev){ click(ev, gl, canvas, a_Position, u_FragColor, u_Size); };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

}



var g_points = [];  // The array for the position of a mouse press
var g_colors = [];  // The array to store the color of a point
var g_sizes = [];   // The array to store the size of a point

// Click event function.
function click(ev, gl, canvas, a_Position, u_FragColor, u_Size) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  // Store the coordinates to g_points array
  g_points.push([x, y]);

  // Store the color of the point
  g_colors.push([r, g, b, 1.0]);

  // Store the size of the point
  g_sizes.push([ps]);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_points.length;
  for(var i = 0; i < len; i++) 
  {
    var xy = g_points[i];
    var rgba = g_colors[i];
    var p_size = g_sizes[i];

    // Pass the position of a point to a_Position variable
    gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
    
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    
    // Pass the size of a point to u_Size variable
    gl.uniform1f(u_Size, p_size);
    
    // Draw
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

import { initShaders, vec4, flatten } from "./helperfunctions.js";
"use strict";
//we will want references to our WebGL objects
let gl;
let canvas;
let program;
let color;
let ucolor;
let numSquares;
let motion = 0; //variable to set the motion
let myTimer;
let speed = 0.01;
let squares = [];
//program setup
window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) {
        alert("WebGL isn't available");
    }
    //compile vertex and fragment shader into shader program
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    color = new vec4(1, 1, 1, 1); //white
    ucolor = gl.getUniformLocation(program, "color");
    gl.uniform4fv(ucolor, color.flatten());
    //keyboard listener
    window.addEventListener("keydown", function (event) {
        switch (event.key) {
            case "m":
                if (motion === 0) { //if not in motion change motion to moving and animate squares
                    motion = 1;
                    myTimer = window.setInterval(moveTarget, 16);
                }
                else { //else if it is in motion, stop animation
                    motion = 0;
                    window.clearInterval(myTimer);
                }
                break;
        }
        //send main memory value over as uniform value
        requestAnimationFrame(render); //new frame and call render() for drawing
    });
    makeSquaresAndBuffer(8); //creates initial squares of 8
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    requestAnimationFrame(render);
    canvas.addEventListener('click', checkHit);
    canvas.style.cursor = 'crosshair';
    // event listener that resets games, when clicked it will call resetGame method
    const resetButton = document.getElementById("resetButton");
    resetButton.addEventListener('click', resetGame);
};
// Method to make squares move by changing their positions
//Also account for boarder collision
function moveTarget() {
    let sideLength = 0.1; //setting size of square
    let allSquarePoints = []; // Array to keep updated square points
    //iterate thru each square in the square array
    for (let i = 0; i < squares.length; i++) {
        let square = squares[i];
        // Update position
        square.centerX += square.dx * speed;
        square.centerY += square.dy * speed;
        // Handle for bouncing off the borders (Horizontal position)
        if (square.centerX - sideLength <= -1 || square.centerX + sideLength >= 1) {
            square.dx = -square.dx;
        }
        // Handle for bouncing off the borders (Vertical position)
        if (square.centerY - sideLength <= -1 || square.centerY + sideLength >= 1) {
            square.dy = -square.dy;
        }
        // Update the square's vertex data
        allSquarePoints.push(new vec4(square.centerX - sideLength, square.centerY + sideLength, 0, 1));
        allSquarePoints.push(new vec4(square.centerX + sideLength, square.centerY + sideLength, 0, 1));
        allSquarePoints.push(new vec4(square.centerX + sideLength, square.centerY - sideLength, 0, 1));
        allSquarePoints.push(new vec4(square.centerX + sideLength, square.centerY - sideLength, 0, 1));
        allSquarePoints.push(new vec4(square.centerX - sideLength, square.centerY - sideLength, 0, 1));
        allSquarePoints.push(new vec4(square.centerX - sideLength, square.centerY + sideLength, 0, 1));
    }
    // Update WebGL buffer
    let bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(allSquarePoints), gl.DYNAMIC_DRAW);
    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    requestAnimationFrame(render);
}
function makeSquaresAndBuffer(numTargets) {
    squares = []; // Clear the squares array if not adds more squares to canvas
    numSquares = numTargets;
    let allSquarePoints = [];
    let sideLength = 0.1; // adjust as needed
    function addSquare(centerX, centerY) {
        // Top-left triangle of the square
        allSquarePoints.push(new vec4(centerX - sideLength, centerY + sideLength, 0, 1));
        allSquarePoints.push(new vec4(centerX + sideLength, centerY + sideLength, 0, 1));
        allSquarePoints.push(new vec4(centerX + sideLength, centerY - sideLength, 0, 1));
        // Bottom-right triangle of the square
        allSquarePoints.push(new vec4(centerX + sideLength, centerY - sideLength, 0, 1));
        allSquarePoints.push(new vec4(centerX - sideLength, centerY - sideLength, 0, 1));
        allSquarePoints.push(new vec4(centerX - sideLength, centerY + sideLength, 0, 1));
    }
    for (let i = 0; i < numTargets; i++) {
        let centerX = rand(-1 + sideLength, 1 - sideLength);
        let centerY = rand(-1 + sideLength, 1 - sideLength);
        addSquare(centerX, centerY);
        // Initialize squares with random direction and speed
        squares.push({
            centerX: centerX,
            centerY: centerY,
            dx: rand(-1, 1),
            dy: rand(-1, 1)
        });
    }
    //Provides a random num in between the min and max values
    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }
    let bufferId = gl.createBuffer(); //create a new buffer object and store its ID in bufferId
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(allSquarePoints), gl.STATIC_DRAW);
    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}
//check if a mouse click event hit any square on the canvas
function checkHit(event) {
    let rect = canvas.getBoundingClientRect();
    let canvasX = (event.clientX - rect.left) / canvas.clientWidth * 2 - 1;
    let canvasY = 1 - (event.clientY - rect.top) / canvas.clientHeight * 2;
    let sideLength = 0.1; // adjust as needed
    // Iterate through the squares to see if the click hit any of them
    for (let i = 0; i < squares.length; i++) {
        let square = squares[i];
        // Check if the click is within the bounds of the current square.
        if (canvasX >= square.centerX - sideLength && canvasX <= square.centerX + sideLength && canvasY >= square.centerY - sideLength && canvasY <= square.centerY + sideLength) {
            // The click is within the square, so this square (target) is hit
            squares.splice(i, 1); // remove this square
            console.log("Hit target at", canvasX, canvasY);
            if (squares.length > 0) {
                showFeedback(`Alien Down! Great Shot! Targets remaining: ${squares.length}`);
            }
            else {
                showFeedback("You've hit all the Aliens! And Saved the Universe!");
            }
            break;
        }
    }
    // Call a function to re-upload square data to the GPU and re-render
    makeSquaresAndBuffer(squares.length);
}
function showFeedback(message) {
    console.log(message); //display message
    //also display message so User can see it
    const feedbackElem = document.getElementById("feedback");
    feedbackElem.textContent = message;
}
function resetGame() {
    squares = [];
    makeSquaresAndBuffer(8);
    showFeedback("Game reset!");
}
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    for (let i = 0; i < numSquares; i++) {
        gl.drawArrays(gl.TRIANGLES, i * 6, 6); // Draw each square with 2 triangles
    }
}
//# sourceMappingURL=targetfunctions.js.map
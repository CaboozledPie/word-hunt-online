const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let mouseX = 400, mouseY = 400;
let mouseIsClicked = false;

// grab mouseX, mouseY
canvas.addEventListener("mousemove",
    e => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    }
);

// handle mouseIsClicked
canvas.addEventListener("mousedown", () => mouseIsClicked = true);
canvas.addEventListener("mouseup", () => mouseIsClicked = false);

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    if (mouseIsClicked) {
        ctx.fillStyle = "blue";
    }
    else {
        ctx.fillStyle = "red";
    }
    ctx.fillRect(mouseX, mouseY, 50, 50);
    ctx.fill();
    ctx.closePath();
}

function loop() {
    draw();
    requestAnimationFrame(loop);
}

loop();

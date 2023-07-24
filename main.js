const fs = require('fs');
const config=require("./config.json");

const log_file="log/main.log";
const {
	frameBufferLength,
	frameBufferPath,
	screen_height,
	screen_width,
}=config;

function getPos(x,y){
	let posX=x;
	let posY=y*screen_width;
	let pos=posX+posY;
	let offset=pos*4;
	/*log({
		x,
		y,
		posX,
		posY,
		pos,
		offset,
		offset_other: (x+y*screen_width)*4, // chatGPT
	});*/
	return offset;
}
function writePixelPos(x,y,...rgba){
	const offset=getPos(x,y);
	writePixel_offset(offset,...rgba);
}
function writePixel_offset(offset,...rgba){
	buffer.writeUInt8(rgba[0],offset);
	buffer.writeUInt8(rgba[1],offset+1);
	buffer.writeUInt8(rgba[2],offset+2);
	buffer.writeUInt8(255,offset+3);
}
function writeFrame(){return new Promise(resolve=>{
	// write into framebuffer
	fs.write(frameBufferAddress,buffer,0,frameBufferLength,0,resolve);
})}
function changePlayerPos(x,y){
	const newPlayerPos=[x,y];

	for(let y=playerPos[1]; y<playerPos[1]+20; y+=1){
		for(let x=playerPos[0]; x<playerPos[0]+20; x+=1){
			writePixelPos(x,y,...bgColor);
		}
	}
	playerPos=newPlayerPos;

	if(playerPos[0]-20<0) playerPos[0]=0;
	else if(playerPos[0]+20>screen_width-1) playerPos[0]=(screen_width-1)-20;

	if(playerPos[1]-20<0) playerPos[1]=0;
	else if(playerPos[1]+20>screen_height-1) playerPos[1]=(screen_height-1)-20;

	for(let y=playerPos[1]; y<playerPos[1]+20; y+=1){
		for(let x=playerPos[0]; x<playerPos[0]+20; x+=1){
			writePixelPos(x,y,...playerColor);
		}
	}
}
function log(data){
	fs.appendFile(log_file,String(data)+"\n",()=>{});
}

log(`Video-Memory: ${frameBufferLength} Bytes.`);
log(`Display: ${screen_width}x${screen_height}.`);
log(`Using "${frameBufferPath}"`);

const buffer=Buffer.alloc(frameBufferLength);

const frameBufferAddress=fs.openSync(frameBufferPath,"r+"); // open framebuffer as write mode

let bgColor=[255,255,255];

let playerColor=[255,0,0];
let playerPos=[Math.round(screen_width/2)-10,Math.round(screen_height/2)-10];
let playerStep=50;

for(let y=0; y<screen_height-1; y+=1){
	for(let x=0; x<screen_width-1; x+=1){
		writePixelPos(x,y,...bgColor);
	}
}

changePlayerPos(...playerPos);

process.stdin.setRawMode(true); // no enter required
process.stdin.on("data",keyBuffer=>{
	const byte=keyBuffer[0];
	log(byte);

	if(byte===119){ 	// "W" pressed
		changePlayerPos(playerPos[0],playerPos[1]-playerStep);
	}
	else if(byte===97){ // "A" pressed
		changePlayerPos(playerPos[0]-playerStep,playerPos[1]);
	}
	else if(byte===115){ // "S" pressed
		changePlayerPos(playerPos[0],playerPos[1]+playerStep);
	}
	else if(byte===100){ // "D" pressed
		changePlayerPos(playerPos[0]+playerStep,playerPos[1]);
	}

	if( // quit game
		byte===3||
		byte===17
		//byte===27
	){
		buffer.fill(0);
		writeFrame();
		fs.close(frameBufferAddress);

		log("Game Quit!");
		process.exit(0);
	}

	writeFrame();


});

writeFrame();

#!/usr/bin/env node
const config=require("./config");
const fs=require("fs");

const {
	frameBufferLength,
	frameBufferPath="/dev/fb0",
	screen_height,
	screen_width,
}=config;


function writeFrame(){return new Promise(resolve=>{
	// write into framebuffer
	fs.write(fd,buffer,0,frameBufferLength,0,resolve);
})}
function writePixel_offset(offset,...rgba){
	buffer.writeUInt8(rgba[0],offset);
	buffer.writeUInt8(rgba[1],offset+1);
	buffer.writeUInt8(rgba[2],offset+2);
	buffer.writeUInt8(255,offset+3);
}
function getPos(x,y){
	let posX=x;
	let posY=y*screen_width;
	let pos=posX+posY;
	let offset=pos*4;
	console.log({
		x,
		y,
		posX,
		posY,
		pos,
		offset,
		offset_other: (x+y*screen_width)*4, // chatGPT
	});
	return offset;
}

console.log(`Creating framebuffer with ${frameBufferLength} Bytes...`);
const buffer=Buffer.alloc(frameBufferLength,255);

const fd=fs.openSync(frameBufferPath,"r+");
let nextFrame=screen_width*4;
for(let i=0; i<frameBufferLength; i+=4){
	writePixel_offset(i,0,255,0);
	if(nextFrame<i){
		nextFrame=i+screen_width*4
		writeFrame();
	}
}
writeFrame()
//process.exit();


while(true){
	//break;
	for(let index=0; index<frameBufferLength; index+=4){
		const rgba=[
			Math.min(255,Math.round(Math.random()*255)),
			Math.min(255,Math.round(Math.random()*255)),
			Math.min(255,Math.round(Math.random()*255)),
			255,
		];
		buffer.writeUInt8(rgba[0],index);		// R
		buffer.writeUInt8(rgba[1],index+1);		// G
		buffer.writeUInt8(rgba[2],index+2);		// B
		buffer.writeUInt8(rgba[3],index+3);		// A
	}
	writeFrame();
}
fs.close(fd);

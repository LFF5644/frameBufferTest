const fs = require('fs');
const config=require("./config.json");

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
	/*console.log({
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

console.log(`Video-Memory: ${frameBufferLength} Bytes.`);
console.log(`Display: ${screen_width}x${screen_height}.`);
console.log(`Using "${frameBufferPath}"`);

const buffer=Buffer.alloc(frameBufferLength);

const frameBufferAddress=fs.openSync(frameBufferPath,"r+"); // open framebuffer as write mode

for(let y=Math.round(screen_height/2)-10; y<Math.round(screen_height/2); y+=1){
	for(let x=Math.round(screen_width/2)-10; x<Math.round(screen_width/2); x+=1){
		writePixelPos(x,y,255,0,0);
	}
}
writeFrame();

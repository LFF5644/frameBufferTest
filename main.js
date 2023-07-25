let chars=require("./chars.json");
const config=require("./config.json");
const fs = require('fs');

const cursor_hide="\u001B[?25l";
const cursor_show="\u001B[?25h";
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
function writeText(startX,startY,size,content,...rgba){
	const letterSpacing=10;
	for(let index=0; index<content.length; index+=1){
		const char=content[index];
		const currentX=startX+index*(8*size+letterSpacing);
		//writePixelPos(currentX,startY,...rgba);

		let charMap=chars[char];
		if(!charMap||size===0) continue;
		if(size>1){
			let newCharMap=[];

			for(let counterRow=0; counterRow<8; counterRow+=1){
				const row=[];
				for(let counterColumn=0; counterColumn<8; counterColumn+=1){
					const pixelIndex=counterRow*8+counterColumn;
					const byte=charMap[pixelIndex];

					for(let i=0; i<size; i+=1){
						row.push(byte);
					}
				}
				for(let i=0; i<size; i+=1){
					newCharMap=[
						...newCharMap,
						...row,
					];
				}
			}

			charMap=newCharMap;
		}
		
		for(let row=0; row<8*size; row+=1){
			for(let column=0; column<8*size; column+=1){
				const pixelIndex=(row*8*size)+column;
				const writePixel=charMap[pixelIndex];
				if(!writePixel) continue;
				const x=currentX+column;
				const y=startY+row;
				writePixelPos(x,y,...rgba);
			}
		}
	}
}
function log(data){
	fs.appendFile(log_file,String(data)+"\n",()=>{});
}

log(`Video-Memory: ${frameBufferLength} Bytes.`);
log(`Display: ${screen_width}x${screen_height}.`);
log(`Using "${frameBufferPath}"`);

process.stdout.write(cursor_hide); // hide the cursor in console

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
	const char=keyBuffer.toString("utf-8");

	let makeNewFrame=false;
	switch(char){
		case "\u001b[A": // Arrow up /\
		case "w":
			changePlayerPos(playerPos[0],playerPos[1]-playerStep);
			makeNewFrame=true;
			break;

		case "\u001b[D": // Arrow left <-
		case "a":
			changePlayerPos(playerPos[0]-playerStep,playerPos[1]);
			makeNewFrame=true;
			break;

		case "\u001b[B": // Arrow down \/
		case "s":
			changePlayerPos(playerPos[0],playerPos[1]+playerStep);
			makeNewFrame=true;
			break;

		case "\u001b[C": // Arrow right ->
		case "d":
			changePlayerPos(playerPos[0]+playerStep,playerPos[1]);
			makeNewFrame=true;
			break;

		case "\u0003": // STRG + C
		case "\u00b1": // ESC
		case "q":
			buffer.fill(0);
			writeFrame();
			fs.close(frameBufferAddress);

			process.stdout.write(cursor_show); // show cursor in terminal
			console.clear();
			log("Game Quit!");
			console.log("Game Quit!");
			setTimeout(()=>process.exit(0),1e3);
		case "r":
			log("Reloading Chars...");
			chars=JSON.parse(fs.readFileSync("./chars.json","utf-8"));
			buffer.fill(255);
			changePlayerPos(...playerPos);
		case "t":	// t for test
			writeText(100,100,4,"ABCDEFGHIJKLMNOPQRSTUVWXYZ",0,0,0);
			writeText(100,200,4,"abcdefghijklmnopqrstuvwxyz",0,0,0);
			writeText(100,300,4,"Test Pass!",0,255,0);
			writeText(100,500,4,"Press \"Q\" to quit",0,0,255);
			makeNewFrame=true;
			break;
	}

	if(makeNewFrame) writeFrame();


});

writeFrame();

#!/usr/bin/env node
console.log("starting ...");
const buildCharacterMap=require("./lib/buildCharacterMap");
const config=require("./config.json");
const fs = require('fs');
//let chars=require("./chars.json");

const cursor_hide="\u001B[?25l";
const cursor_show="\u001B[?25h";
const letterSpacing=10;
const log_file="log/main.log";
const compressedCharacter_file="compressedCharacterMap.bin";
const fontSizes=[2,3];

let log_data="";
const {
	frameBufferLength,
	frameBufferPath,
	screen_height,
	screen_width,
}=config;

function getRandomColor(){
	return[
		Math.min(255,Math.round(Math.random()*255)),
		Math.min(255,Math.round(Math.random()*255)),
		Math.min(255,Math.round(Math.random()*255)),
	];
}
function getRandomPos(width=0,height=0){
	const maxX=(screen_width-1)-width;
	const maxY=(screen_height-1)-height;
	return[
		Math.min(maxX,Math.round(Math.random()*maxX)),
		Math.min(maxY,Math.round(Math.random()*maxY)),
	];
}
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
function writeFrame(){return new Promise(resolve=>{
	// write into framebuffer
	fs.write(frameBufferAddress,buffer,0,frameBufferLength,0,resolve);
})}
function log(data){
	// append into log
	log_data+=data+"\n";
}
async function saveLog(){
	const data=log_data;
	log_data="";
	await new Promise(r=>{
		fs.appendFile(log_file,data,r);
	});
}
function writePixel_offset(offset,...rgba){
	buffer.writeUInt8(rgba[0],offset);
	buffer.writeUInt8(rgba[1],offset+1);
	buffer.writeUInt8(rgba[2],offset+2);
	buffer.writeUInt8(255,offset+3);
}
function writePixelPos(x,y,...rgba){
	const offset=getPos(x,y);
	writePixel_offset(offset,...rgba);
}
function checkPlayerCollision(entry_x,entry_y,entry_width,entry_height){
	const [player_x,player_y]=playerPos;
	const [player_width,player_height]=playerSize;
	if( // help from chatGPT
		player_x<entry_x+entry_width&&
		player_x+player_width>entry_x&&
		player_y<entry_y+entry_height&&
		player_y+player_height>entry_y
	) return true;

	return false;
}
function changePlayerPos(x,y){
	if(playerPos[0]===x&&playerPos[1]===y) return;
	const newPlayerPos=[x,y];

	writeRectangle(...playerPos,...playerSize,...bgColor);
	playerPos=newPlayerPos;

	if(playerPos[0]-20<0) playerPos[0]=0;
	else if(playerPos[0]+20>screen_width-1) playerPos[0]=(screen_width-1)-20;

	if(playerPos[1]-20<0) playerPos[1]=0;
	else if(playerPos[1]+20>screen_height-1) playerPos[1]=(screen_height-1)-20;

	writeRectangle(...playerPos,...playerSize,...playerColor);
	onPlayerPosChanged();
}
function onPlayerPosChanged(){
	const newCollisionObjects=[];
	for(let index=0; index<collisionObjects.length; index+=1){
		const entry=collisionObjects[index];
		//const [entry_x,entry_y,entry_width,entry_height,...entryColor]=entry;
		const collision=checkPlayerCollision(...entry);
		if(collision){
			points+=1;
			const text=String(points);
			if(pointsTextId) removeText(pointsTextId);
			const [lengthX,lengthY]=getTextLength(2,text);
			pointsTextId=writeText(screen_width-lengthX,0,2,text,...getRandomColor());
			newCollisionObjects.push([...getRandomPos(10,10),10,10,...getRandomColor()]);
		}
		else newCollisionObjects.push(entry);
	}
	changeCollisionsObjects(newCollisionObjects);
	writeRectangle(...playerPos,...playerSize,...playerColor);
}
function changeCollisionsObjects(newCollisionObjects){
	for(let entry of collisionObjects){
		const [entry_x,entry_y,entry_width,entry_height,...entryColor]=entry;
		writeRectangle(entry_x,entry_y,entry_width,entry_height,...bgColor);
	}
	for(let entry of newCollisionObjects){
		writeRectangle(...entry);
	}
	collisionObjects=newCollisionObjects;
}
function writeRectangle(startX,startY,width,height,...rgb){
	for(let y=startY; y<startY+height; y+=1){
		for(let x=startX; x<startX+width; x+=1){
			writePixelPos(x,y,...rgb);
		}
	}
}
function getTextLength(size,content){
	let currentX=0;
	let currentY=0;
	for(let index=0; index<content.length; index+=1){
		const char=content[index];
		if(!chars[size]) throw new Error("SIZE "+size+" do not exist! please build this size first!");
		const charObject=chars[size][char];
		if(!charObject) continue;
		const charMap=charObject.map;
		currentX+=charObject.width+letterSpacing;
		currentY=charObject.height;
	}
	currentX-=letterSpacing;
	return[currentX,currentY];
}
function getTextPos(startX,startY,size,content){
	let currentX=startX;
	let currentY=0;
	for(let index=0; index<content.length; index+=1){
		const char=content[index];
		if(!chars[size]) throw new Error("SIZE "+size+" do not exist! please build this size first!");
		const charObject=chars[size][char];
		if(!charObject) continue;
		const charMap=charObject.map;
		currentX+=charObject.width+letterSpacing;
		currentY=charObject.height;
	}
	currentX-=letterSpacing;
	return[currentX,currentY];
}
function writeText(startX,startY,size,content,...rgb){
	const id=Date.now()+JSON.stringify(getRandomPos())+JSON.stringify(getRandomColor())
	let currentX=startX;
	let lengthY=0;
	for(let index=0; index<content.length; index+=1){
		const char=content[index];
		//const currentX=startX+index*(8*size+letterSpacing)-ignoreRows;
		//writePixelPos(currentX,startY,...rgba);
		if(!chars[size]) throw new Error("SIZE "+size+" do not exist! please build this size first!");
		const charObject=chars[size][char];
		if(!charObject) continue;
		const charMap=charObject.map;

		if(charMap.includes(1)){
			for(let row=0; row<charObject.height; row+=1){
				for(let column=0; column<charObject.width; column+=1){
					const pixelIndex=(row*charObject.width)+column;
					const writePixel=charMap[pixelIndex];
					if(!writePixel) continue;
					const x=currentX+column;
					const y=startY+row;
					writePixelPos(x,y,...rgb);
				}
			}
		}
		currentX+=charObject.width+letterSpacing;
		lengthY=charObject.height;
	}
	currentX-=letterSpacing;
	const lengthX=currentX-startX;

	const textEntry={
		content,
		lengthX,
		lengthY,
		startX,
		startY,
		size,
		color: rgb,
	};
	displayedText[id]=textEntry;

	return id;
}
function removeText(id){
	const textEntry=displayedText[id];
	delete displayedText[id];
	if(!textEntry) throw new Error("text id not exist");

	const {startX,startY,size,content}=textEntry;

	writeText(startX,startY,size,content,...bgColor);
}
function getTextEntry(id){
	const textEntry=displayedText[id];
	if(!textEntry) throw new Error("text id not exist");
	return textEntry;
}

log(`Video-Memory: ${frameBufferLength} Bytes.`);
log(`Display: ${screen_width}x${screen_height}.`);
log(`Using "${frameBufferPath}"`);

buildCharacterMap.setLogging(false); // no console.log
let chars=buildCharacterMap.getCompressedCharacters(compressedCharacter_file);

process.stdout.write(cursor_hide); // hide the cursor in console

const buffer=Buffer.alloc(frameBufferLength);

const frameBufferAddress=fs.openSync(frameBufferPath,"r+"); // open framebuffer as write mode

let bgColor=[0,0,0]; // black is better at 3 A.M.

let playerColor=[255,0,0];
let playerPos=[Math.round(screen_width/2)-10,Math.round(screen_height/2)-10];
let playerSize=[20,20];
let playerStep=20;
let points=0;
let pointsTextId=0;
let collisionObjects=[
	// [x,y,width,height,...rgb]
	[...getRandomPos(10,10),10,10,...getRandomColor()],
	[...getRandomPos(10,10),10,10,...getRandomColor()],
	[...getRandomPos(10,10),10,10,...getRandomColor()],
	[...getRandomPos(10,10),10,10,...getRandomColor()],
];
let displayedText={};

// write bg color to screen
for(let y=0; y<screen_height-1; y+=1){
	for(let x=0; x<screen_width-1; x+=1){
		writePixelPos(x,y,...bgColor);
	}
}

// write collisionObjects
for(let entry of collisionObjects){
	writeRectangle(...entry);
}

// write player
writeRectangle(...playerPos,...playerSize,...playerColor);

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
			fs.close(frameBufferAddress,(err)=>{ // fix message no callback is depprecated!
				if(err) throw err;
			});

			process.stdout.write(cursor_show); // show cursor in terminal
			log("Game Quit!");
			console.clear();
			console.log("Game Quit!");
			//saveLog();
			setTimeout(()=>process.exit(0),1e2);
			break;
		case "r":{
			log("Reloading Chars...");
			buffer.fill(0);
			writeText(100,100,2,"Build Characters ....",255,255,255);
			writeFrame();
			const charsBuffer=buildCharacterMap.compressCharacters(JSON.parse(fs.readFileSync("./chars.json","utf-8")),fontSizes);
			fs.writeFileSync(compressedCharacter_file,charsBuffer);
			buffer.fill(0);
			writeText(100,100,2,"Loading Characters ...",255,255,255);
			writeFrame();
			chars=buildCharacterMap.getCompressedCharacters(compressedCharacter_file);
			buffer.fill(0);
			writeRectangle(...playerPos,...playerSize,...playerColor);
		}
		case "t":{	// t for test
			const size=3;
			writeText(100,50,size,"ABCDEFGHIJKLMNOPQRSTUVWXYZ",255,255,255);
			writeText(100,100,size,"abcdefghijklmnopqrstuvwxyz",255,255,255);
			writeText(100,150,size,"0123456789",255,255,255);
			writeText(100,200,size,"!\"/",255,255,255);
			writeText(100,250,size,"Test Pass!",0,255,0);
			writeText(100,300,size,"Press \"Q\" to quit",0,0,255);
			makeNewFrame=true;
			break;
		}
	}

	if(makeNewFrame) writeFrame();
});

writeFrame();

setInterval(saveLog,1e3);

#!/usr/bin/env node
console.log("starting ...");
const buildCharacterMap=require("./lib/buildCharacterMap");
const buildTexturesMap=require("./lib/buildTexturesMap");
const config=require("./config.json");
const fs=require("fs");

const cursor_hide="\u001B[?25l";
const cursor_show="\u001B[?25h";
const letterSpacing=10;
const log_file="log/main.log";
const compressedCharacter_file="compressedCharacterMap.bin";
const texturesBin_file="textures.bin";
const fontSizes=[2,3];
const screens={};
const menuEntryTemplate={
	label: null,
	color: [255,255,255],
	onEnter:()=>{
		throw new Error("on event for this option set!");
	}
};

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
	// create own cordinatensystem
	return (y*screen_width+x)*4;
}
function writeFrame(){return new Promise(resolve=>{
	// write into framebuffer
	fs.write(frameBufferAddress,currentScreenBuffer,0,frameBufferLength,0,resolve);
})}
function log(data){
	if(process.env.LOGGING==false){
		clearInterval(saveLog_interval);
		return;
	}
	log_data+=data+"\n";
}
async function saveLog(){
	const data=log_data;
	log_data="";
	await new Promise(r=>{
		fs.appendFile(log_file,data,r);
	});
}
function writePixel_offset(offset,...rgb){
	currentScreenBuffer.writeUInt8(rgb[0],offset);
	currentScreenBuffer.writeUInt8(rgb[1],offset+1);
	currentScreenBuffer.writeUInt8(rgb[2],offset+2);
	currentScreenBuffer.writeUInt8(255,offset+3);
}
function writePixelPos(x,y,...rgb){
	const offset=getPos(x,y);
	writePixel_offset(offset,...rgb);
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

	if(playerPos[0]-playerSize[0]<0) playerPos[0]=0;
	else if(playerPos[0]+playerSize[0]>screen_width) playerPos[0]=screen_width-playerSize[0];

	if(playerPos[1]-playerSize[1]<0) playerPos[1]=0;
	else if(playerPos[1]+playerSize[1]>screen_height) playerPos[1]=screen_height-playerSize[1];

	writePlayer();
	onPlayerPosChanged();
}
function writePlayer(x=playerPos[0],y=playerPos[1]){
	let pos=playerPos;
	if(pos[0]!==x||pos[1]!==y) pos=[x,y];
	writeRectangle(...pos,...playerSize,...playerColor);
	writeTexture(...pos,"player");
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
	writePlayer();
}
function changeCollisionsObjects(newCollisionObjects){
	for(let entry of collisionObjects){
		const [entry_x,entry_y,entry_width,entry_height,...entryColor]=entry;
		writeRectangle(entry_x,entry_y,entry_width,entry_height,...bgColor);
	}
	collisionObjects=newCollisionObjects;
	writeCollisionObjects();
}
function writeCollisionObjects(){
	for(let entry of collisionObjects){
		const [x,y,width,height,...rgb]=entry;
		writeRectangle(...entry);
		writeTexture(x,y,"collisionObject");
	}
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
	const id=Date.now()+JSON.stringify(getRandomPos())+JSON.stringify(getRandomColor());
	let currentX=startX;
	let lengthY=0;
	for(let index=0; index<content.length; index+=1){
		const char=content[index];
		//const currentX=startX+index*(8*size+letterSpacing)-ignoreRows;
		//writePixelPos(currentX,startY,...rgba);
		if(!chars[size]) throw new Error("SIZE "+size+" do not exist! please build this size first!");
		const charObject=chars[size][char];
		if(!charObject) throw new Error("char '"+char+"' do not exist");
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
function clearScreen(...rgb){
	if(rgb.length<3) rgb=bgColor;
	for(let i=0; i<frameBufferLength; i+=4){
		currentScreenBuffer.writeUInt8(rgb[0],i);
		currentScreenBuffer.writeUInt8(rgb[1],i+1);
		currentScreenBuffer.writeUInt8(rgb[2],i+2);
		currentScreenBuffer.writeUInt8(255,i+3);
	}
}
function changeScreen(name,...rgb){
	if(name===currentScreenName) return;
	screens[currentScreenName]={
		...screens[currentScreenName]?screens[currentScreenName]:{},
		buffer: currentScreenBuffer,
		vars: currentScreenVars,
		events: currentScreenEvents,
	};
	if(!screens[name]){
		if(rgb.length===0) rgb=bgColor;
		const buffer=Buffer.alloc(frameBufferLength);
		for(let i=0; i<frameBufferLength-3; i+=4){
			buffer.writeUInt8(rgb[0],i);
			buffer.writeUInt8(rgb[1],i+1);
			buffer.writeUInt8(rgb[2],i+2);
			buffer.writeUInt8(255,i+3);
		}
		screens[name]={
			buffer,
			events:[],
			vars:{},
		};
	};
	lastScreen=currentScreenName;
	currentScreenBuffer=screens[name].buffer;
	currentScreenEvents=screens[name].events;
	currentScreenVars=screens[name].vars;
	currentScreenName=name;
}
function writeTexture(x,y,textureName){
	const texture=textures[textureName];
	if(!texture) throw new Error("texture "+textureName+" not exist!");

	const {
		width,
		height,
		map,
	}=texture;

	for(let row=0; row<height; row+=1){
		for(let column=0; column<width; column+=1){
			const pixelOffset=(row*height+column)*4;
			const rgba=map.slice(pixelOffset,pixelOffset+4);

			if(rgba[3]>0){ // a
				const currentX=x+column;
				const currentY=y+row;
				writePixelPos(currentX,currentY,...rgba);
			}
		}
	}
}
function addScreenEvent(eventName,fn){
	const id=Date.now()+JSON.stringify(getRandomPos())+JSON.stringify(getRandomColor());
	currentScreenEvents.push([id,eventName,fn]);
	return id;
}
function removeScreenEvent(id){
	// remove the element with [0]===id
	const eventsLength=currentScreenEvents.length;
	currentScreenEvents=currentScreenEvents.filter(item=>item[0]!==id);
	if(eventsLength===currentScreenEvents.length) throw new Error("id '"+id+"' not found");
}
function renderMenu(){
	if(!currentScreenVars.menu) throw new Error("'currentScreenVars.menu' is not defined");
	let {
		selected_entry,
		selected_page,
		hadding,
		entry_fontSize,
		entrys,
	}=currentScreenVars.menu;
	const screenOffset=20;
	const screenWidth_offset=screen_width-screenOffset;
	const screenHeight_offset=screen_height-screenOffset;
	let offset=0;
	const lineThickness=2;
	{// calculate hadding
		const textLength=getTextLength(hadding.size,hadding.label);
		const x=Math.round(screenWidth_offset/2-textLength[0]/2);
		const y=screenOffset;

		writeText(x,y,hadding.size,hadding.label,...hadding.color);
		const startY=y+textLength[1]+10;
		//writeLine(x,startY,textLength[0],0,lineThickness,...hadding.color);

		offsetY=startY+lineThickness+50;
	}

	let maxTextWidth=0;
	for(let index=0; index<entrys.length; index+=1){
		const entry=entrys[index];
		const textLength=getTextLength(entry_fontSize,entry.label);
		if(maxTextWidth<textLength[1]) maxTextWidth=textLength[1];
	}

	for(let index=0; index<entrys.length; index+=1){
		const entry={
			...menuEntryTemplate,
			...entrys[index],
		};
		const textLength=getTextLength(entry_fontSize,entry.label);
		const x=Math.round(screenWidth_offset/2-textLength[0]/2);
		const y=offsetY;

		writeText(x,y,entry_fontSize,entry.label,...entry.color);
		
		const lineColor=selected_entry===index?entry.color:bgColor;

		let lineStartY=y-10;
		writeLine(x,lineStartY,textLength[0],0,lineThickness,...lineColor);

		lineStartY=y+textLength[1]+10;
		writeLine(x,lineStartY,textLength[0],0,lineThickness,...lineColor);

		offsetY+=10+lineThickness*2+textLength[1]+30;
	}
}
function writeLine(startX,startY,length,mode,lineThickness,...rgb){
	if(mode===1||mode==="|"){
		for(let x=startX; x<startX+lineThickness; x+=1){
			for(let y=startY; y<startY+length; y+=1){
				writePixelPos(x,y,...rgb);
			}
		}
	}
	else if(mode===0||mode==="-"){
		for(let y=startY; y<startY+lineThickness; y+=1){
			for(let x=startX; x<startX+length; x+=1){
				writePixelPos(x,y,...rgb);
			}
		}
	}
	else throw new Error("mode is not allowed!");
}
function exit(){
	changeScreen("exitScreen");
	clearScreen(255,0,0);
	const text="Exit Game Y/N";
	const [lengthX,lengthY]=getTextLength(3,text);
	const x=Math.round(screen_width/2-lengthX/2);
	const y=Math.round(screen_height/2-lengthY);
	currentScreenVars.exitText=writeText(x,y,3,text,0,0,255);
	return true; // make new frame = true
}

log(`Video-Memory: ${frameBufferLength} Bytes.`);
log(`Display: ${screen_width}x${screen_height}.`);
log(`Using "${frameBufferPath}"`);

console.log("Loading characters ...");
buildCharacterMap.setLogging(false); // no console.log
let chars=buildCharacterMap.getCompressedCharacters(compressedCharacter_file);

console.log("Loading textures ...");
let textures=buildTexturesMap.getTextures(texturesBin_file);

console.log("start game ...");
process.stdout.write(cursor_hide); // hide the cursor in console

let lastScreen="game";
let currentScreenEvents=[];
let currentScreenName="game";
let currentScreenVars={};
let currentScreenBuffer=Buffer.alloc(frameBufferLength);

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
clearScreen();

// write collisionObjects
writeCollisionObjects();

// write player
writePlayer();

changeScreen("menu-home");
clearScreen();
currentScreenVars.menu={
	hadding:{
		label: "Hauptmenu",
		color: [0,0,255],
		size: 3,
	},
	selected_entry: 0,
	selected_page: 0,
	entry_fontSize: 2,
	entrys:[
		{
			label: "Spielen",
			//color: [0,255,0],
			onEnter:()=>{
				changeScreen("game");
				return true;
			},
		},
		{
			label: "Spiel Beenden",
			//color: [0,0,255],
			onEnter: exit,
		},
	],
};
renderMenu();
writeFrame();

process.stdin.setRawMode(true); // no enter required
process.stdin.on("data",keyBuffer=>{
	const char=keyBuffer.toString("utf-8");
	let makeNewFrame=false;
	const screen=currentScreenName;

	if(screen==="game"){
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
			case "q":
				changeScreen("menu-home");
				makeNewFrame=true;
				break;
			case "r":{
				log("Rebuilding Chars...");
				changeScreen("info");
				clearScreen();
				const messageColor=[255,255,255]
				let messageId=0;
				messageId=writeText(100,100,2,"Build Characters....",...messageColor);
				writeFrame();

				const charsBuffer=buildCharacterMap.compressCharacters(JSON.parse(fs.readFileSync("./chars.json","utf-8")),fontSizes);
				fs.writeFileSync(compressedCharacter_file,charsBuffer);
				
				removeText(messageId);
				messageId=writeText(100,100,2,"Loading Characters...",...messageColor);
				writeFrame();
				
				chars=buildCharacterMap.getCompressedCharacters(compressedCharacter_file);
				
				removeText(messageId);
				messageId=writeText(100,100,2,"Build Textures...",255,255,255);
				writeFrame();

				log("Rebuilding Textures...");
				const texturesBuffer=buildTexturesMap.buildTextures(JSON.parse(fs.readFileSync("./textures.json","utf-8")));
				fs.writeFileSync(texturesBin_file,texturesBuffer);
				
				removeText(messageId);
				messageId=writeText(100,100,2,"Loading Textures...",255,255,255);
				writeFrame();

				textures=buildTexturesMap.getTextures(texturesBin_file);
			}
			case "t":{	// t for test
				changeScreen("info");
				const keydownEventId=addScreenEvent("keydown",key=>{
					removeScreenEvent(keydownEventId);
					changeScreen("game");
					writeFrame();
				});
				clearScreen();

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
	}
	else if(screen==="exitScreen"){
		switch(char){
			case "Y":
			case "y":{
				clearScreen(0,0,0);
				writeFrame();
				process.stdout.write(cursor_show); // show cursor in terminal
				log("Game Quit!");
				console.clear();
				console.log("Game Quit!");
				fs.close(frameBufferAddress,(err)=>{if(err) throw err;});
				process.stdin.pause(); // not execute on stdin and not wait for input
				clearInterval(saveLog_interval);
				setTimeout(saveLog,0);
				break;
			}
			case "q":
			case "N":
			case "n":
			case "\u0003":{ // STRG + C
				changeScreen(lastScreen);
				makeNewFrame=true;
				break;
			}
		}
	}
	else if(screen==="info"){
		// do nothing here
		// onkeydown => null
	}
	else if(screen.startsWith("menu-")){
		if(!currentScreenVars.menu) throw new Error("this in not a menu");
		switch(char){
			case "\u001b[A": // Arrow up /\
			case "w":{
				const length=currentScreenVars.menu.entrys.length-1;
				let index=currentScreenVars.menu.selected_entry;
				index-=1;
				if(index<0) index=0;
				currentScreenVars.menu.selected_entry=index;
				renderMenu();
				makeNewFrame=true;
				break;
			}
			case "\u001b[B": // Arrow down \/
			case "s":{
				const length=currentScreenVars.menu.entrys.length-1;
				let index=currentScreenVars.menu.selected_entry;
				index+=1;
				if(index>length) index=length;
				currentScreenVars.menu.selected_entry=index;
				renderMenu();
				makeNewFrame=true;
				break;
			}
			case "\n":
			case "\r":{
				const index=currentScreenVars.menu.selected_entry;
				const entry=currentScreenVars.menu.entrys[index];
				const fn=entry.onEnter;
				let result=false;
				if(fn) result=fn();
				else console.log("no function!")
				if(result===true) makeNewFrame=true;
				break;
			}
		}
	}
	else throw new Error("keyEventText is not allowed");

	if(screen==currentScreenName){
		const events=currentScreenEvents
			.filter(item=>item[1]==="keydown")
			.map(item=>[item[0],item[2]]);
		for(let event of events){
			const [id,fn]=event;
			const result=fn(char);
			if(result===true) makeNewFrame=true;
		}
	}

	if(makeNewFrame) writeFrame();
});

const saveLog_interval=setInterval(saveLog,1e3);

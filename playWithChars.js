#!/usr/bin/env node
let chars=require("./chars.json");
//const config=require("./config.json");
//const fs = require('fs');

function writeRaw(content){
	process.stdout.write(content);
}

const char=process.argv[2]||"a";
console.log("Example char is: "+char);

const charMap=chars[char];

writeRaw("\n");
for(let row=0; row<8; row+=1){
	for(let column=0; column<8; column+=1){
		const pixelIndex=row*8+column;
		const pixel=charMap[pixelIndex];
		writeRaw(pixel?"#":".");
	}
	writeRaw("\n");
}
writeRaw("\n");
let emptyRows=0;
if(charMap.includes(1)){
	for(let column=0; column<8; column+=1){
		let rowEmpty=true;
		for(let row=0; row<8; row+=1){
			const pixelIndex=row*8+column;
			const pixel=charMap[pixelIndex];
			if(pixel){
				rowEmpty=false;
				break;
			}
		}

		if(rowEmpty) emptyRows+=1;
		else break;
	}

	for(let column=7; column>0; column-=1){
		let rowEmpty=true;
		for(let row=0; row<8; row+=1){
			const pixelIndex=row*8+column;
			const pixel=charMap[pixelIndex];
			if(pixel){
				rowEmpty=false;
				break;
			}
		}

		if(rowEmpty) emptyRows+=1;
		else break;
	}
}
console.log("emptyRows: "+emptyRows);

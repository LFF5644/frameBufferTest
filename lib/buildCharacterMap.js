// LIBRARY BY LF5644
const charactersJSON=require("../chars.json");
const fs=require("fs");

function encodeChars(characters=charactersJSON){
	if(!characters) characters=charactersJSON;
	const size=1;// temporary ignore the size
	const chars=Object.keys(characters);
	let contentTable=[];		// address of characters
	let encodeCharacters=[];	// charMap+charMap+charMap ...

	for(let charIndex=0; charIndex<chars.length; charIndex+=1){
		const char=chars[charIndex];
		const charMap=characters[char];

		let emptyRowsAtStart=0;
		let emptyRowsAtEnd=0;
		if(charMap.includes(1)){
			for(let column=0; column<8*size; column+=1){
				let rowEmpty=true;
				for(let row=0; row<8*size; row+=1){
					const pixelIndex=(row*8*size)+column;
					const writePixel=charMap[pixelIndex];
					if(writePixel){
						rowEmpty=false;
						break;
					}
				}
				if(rowEmpty) emptyRowsAtStart+=1;
				else break;
			}

			for(let column=7*size; column>0; column-=1){
				let rowEmpty=true;
				for(let row=0; row<8*size; row+=1){
					const pixelIndex=(row*8*size)+column;
					const writePixel=charMap[pixelIndex];
					if(writePixel){
						rowEmpty=false;
						break;
					}
				}
				if(rowEmpty) emptyRowsAtEnd+=1;
				else break;
			}
		}
		const compressedCharMap=[/*0,1,0,0,0,1,0,1,0,0, ..*/];

		for(let row=0; row<8*size; row+=1){
			for(let column=emptyRowsAtStart; column<8*size-emptyRowsAtEnd; column+=1){
				const pixelIndex=(row*8*size)+column;
				const bit=charMap[pixelIndex];
				compressedCharMap.push(bit);
				//process.stdout.write(bit?"#":".");
			}
			//process.stdout.write("\n");
		}
		//process.stdout.write("\n");
		const charContentTable=[
			// Buffer.from("A"), 8, 8, 1, contentTable.length-1+0,
			// "char", width, height, size, offset,
			Buffer.from(char)[0],
			8-emptyRowsAtStart-emptyRowsAtEnd, 8, size,
		];

		// append to main list
		contentTable=[
			...contentTable,
			...charContentTable,
		];
		encodeCharacters=[
			...encodeCharacters,
			...compressedCharMap,
		];
	}
	/*for(let i=0; i<contentTable.length; i+=4){
		const charContentTable=[];
		for(let index=i; index<i+5; index+=1){
			const byte=contentTable[index];
			charContentTable.push(byte);
		}

		const [charByte,width,height,size]=charContentTable;

		const char=Buffer.from([charByte]).toString("utf-8");
		console.log(char,width,height,size);

	}*/

	const buffer=Buffer.from([
		...contentTable,
		0,0,0,0, // say decoder: now characters
		...encodeCharacters,
	]);
	fs.writeFileSync("./compressedCharacterMap.bin",buffer);
}
function decodeChars(file="./compressedCharacterMap.bin"){
	const buffer=fs.readFileSync(file);
	const characters={};
	const contentTable=[];
	const charMaps=[];
	let offset=0;

	for(let index=0; index<buffer.length; index+=4){
		const charContentTable=[];
		for(let i=index; i<index+5; i+=1){
			const byte=buffer[i];
			charContentTable.push(byte);
		}
		if(!charContentTable.includes(1)){
			offset=index+4;
			break;
		}
		const [charByte,width,height,size]=charContentTable;
		const char=Buffer.from([charByte]).toString("utf-8");
		contentTable.push(char,width,height,size);
		//console.log(char,width,height,size);
	}
	for(let index=0; index<buffer.length; index+=4){
		const charContentTable=[];
		for(let i=index; i<index+5; i+=1){
			const byte=contentTable[i];
			charContentTable.push(byte);
		}
		if(!charContentTable.includes(1)) break;
		
		const [char,width,height,size]=charContentTable;
		console.log(char,width,height,size);
		const charMap=buffer.slice(offset,width*height+offset);
		for(let row=0; row<height; row+=1){
			for(let column=0; column<width; column+=1){
				const pixelIndex=row*width+column;
				const bit=charMap[pixelIndex];
				process.stdout.write(bit?"#":".");
			}
			process.stdout.write("\n");
		}
		console.log();
		offset+=width*height;
	}
}
console.log("compress ...");
encodeChars();

console.log("decompress ...");
decodeChars();

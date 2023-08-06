// LIBRARY BY LF5644
const textures=require("../textures.json");
const fs=require("fs");

function buildTextures(texturesJSON=textures){
	const contentTable=[];	// width, height, textureNameLength, ...textureNameBytes
	const textureMaps=[];	// pixel: r,g,b,a; map: pixel,pixel, ...

	const textures_keys=Object.keys(texturesJSON.textures);
	for(let textureIndex=0; textureIndex<textures_keys.length; textureIndex+=1){
		const textureKey=textures_keys[textureIndex];
		const texture=texturesJSON.textures[textureKey];
		const textureMap=texture.map;
		const colors={
			...texturesJSON.colors,
			...texture.colors?texture.colors:{},
		};
		const {
			width,
			height,
			size=1,
		}=texture;

		if(textureKey.length>255) throw new Error("texture name length is to large max size is 255 characters/bytes!");
		if(size!==1) throw new Error("this update cumming later ... size must 1");
		if(width*height==!textureMap.length) throw new Error("you gave wrong width/height");

		contentTable.push(
			width*size,
			height*size,
			textureKey.length
		);
		const nameBuffer=Buffer.from(textureKey,"utf-8");
		for(let index=0; index<nameBuffer.length; index+=1){
			const byte=nameBuffer[index];
			contentTable.push(byte);
		}
		for(let textureMapIndex=0; textureMapIndex<textureMap.length; textureMapIndex+=1){
			const colorKey=String(textureMap[textureMapIndex]);
			let color=colors[colorKey];
			if(color===undefined) throw new Error("color "+colorKey+" is not defined");
			else if(color===null) color=[0,0,0,0];

			if(color.length===3) color.push(255);
			if(color.length!==4) throw new Error("color length not allowed!");

			textureMaps.push(...color);
		}
	}
	const buffer=Buffer.from([
		...contentTable,
		0,0,0,
		...textureMaps,
	]);
	return buffer;
}
function getTextures(buffer){
	if(typeof(buffer)==="string") buffer=fs.readFileSync(buffer);
	
	const textures={};
	let offset=0;
	for(let index=0; index<buffer.length; index+=3){
		const width=buffer[index];
		const height=buffer[index+1];
		const nameLength=buffer[index+2];
		const name=buffer.slice(index+3,index+3+nameLength).toString("utf-8");
		index+=nameLength;

		if(
			width===0&&
			height===0&&
			nameLength===0
		){
			offset=index+3;
			break;
		}

		//console.log(name);
	}

	for(let index=0; index<buffer.length; index+=3){
		const width=buffer[index];
		const height=buffer[index+1];
		const nameLength=buffer[index+2];
		const name=buffer.slice(index+3,index+3+nameLength).toString("utf-8");
		index+=nameLength;

		if(
			width===0&&
			height===0&&
			nameLength===0
		){
			break;
		}
		
		const textureMap=buffer.slice(offset,offset+width*height*4);

		offset+=width*height*4;
		//console.log(name);

		textures[name]={
			width,
			height,
			map: textureMap,
		};
		/*process.stdout.write("\n");
		for(let row=0; row<height; row+=1){
			for(let column=0; column<width; column+=1){
				const pixelOffset=(row*width+column)*4;
				const rgba=textureMap.slice(pixelOffset,pixelOffset+4);
				if(rgba[3]===255) process.stdout.write("#");
				else process.stdout.write(".");
			}
			process.stdout.write("\n");
		}
		process.stdout.write("\n");*/
	}
	return textures;
}

module.exports={
	buildTextures,
	getTextures,
};

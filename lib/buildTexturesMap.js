// LIBRARY BY LF5644
const textures=require("../textures.json");
const fs=require("fs");

function compressTextures(texturesJSON=textures){
	const contentTable=[];	// width, height, textureNameLength, ...textureNameBytes
	const textureMaps=[];	// pixel: r,g,b,a; map: pixel,pixel, ...

	const textures_keys=Object.keys(texturesJSON.textures);
	for(let textureIndex=0; textureIndex<textures_keys.length; textureIndex+=1){
		const textureKey=textures_keys[textureIndex];
		const texture=texturesJSON.textures[textureKey];
		const textureMap=texture.map;
		const colors={
			...texturesJSON.colors,
			...texture.colors,
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

			textureMaps.push(
				color[0],
				color[1],
				color[2],
				color[3]===undefined?255:color[3]
			);
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

		console.log(name);
	}
}
console.log("build ...");
const b=compressTextures();

console.log("load ...");
getTextures(b);

module.exports={
	compressTextures,
};

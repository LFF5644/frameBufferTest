const fs=require("fs");
let config=require("./config.json");

function writeConfig(cb){
	fs.writeFile("./config.json",JSON.stringify(config,null,"\t")+"\n",cb);
}

const file="/sys/class/graphics/fb0/virtual_size";

const screenSize=fs.readFileSync(file,"utf-8").trim().split(",");
if(screenSize.length!==2) throw new Error("file includes wrong data");

config.screen_width=Number(screenSize[0]);
config.screen_height=Number(screenSize[1]);
config.frameBufferLength=fs.readFileSync("/dev/fb0").length;

console.log(`${file}: ${config.screen_width}x${config.screen_height}`);

console.log(`Frame-Size: ${config.frameBufferLength} Bytes`);


writeConfig(err=>{
	if(err) throw new Error("Cant save config");
	console.log("Saved into Config!");
});

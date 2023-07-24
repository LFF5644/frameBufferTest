const child_process=require("child_process");
const fs=require("fs");
let config=require("./config.json");

function writeConfig(cb){
	fs.writeFile("./config.json",JSON.stringify(config,null,"\t")+"\n",cb);
}

const file="/sys/class/graphics/fb0/virtual_size";

const screenSize=fs.readFileSync(file,"utf-8").trim().split(",");
if(screenSize.length!==2) throw new Error("file includes wrong data");

config.frameBufferLength=fs.readFileSync("/dev/fb0").length;
config.screen_height=Number(screenSize[1]);
config.screen_width=Number(screenSize[0]);


console.log(`Screen: ${config.screen_width}x${config.screen_height}`);

console.log(`Frame-Size: ${config.frameBufferLength} Bytes`);

const real_screen_width=Number(
	child_process.execSync("fbset -i | grep 'LineLength'")
		.toString("utf-8")
		.trim()
		.split(":")[1]
		.trim()
);

if(real_screen_width===0||isNaN(real_screen_width)){
	console.log("WARNING: fbset is not installed it is not required but if you do not have 1920x1080 then you can get errors! install it with 'sudo apt install fbset' good luck");
}
else{
	console.log(`REAL LINE LENGTH: ${config.screen_width} Bytes`);
	config.screen_width=real_screen_width/4;
}

writeConfig(err=>{
	if(err) throw new Error("Cant save config");
	console.log("Saved into Config!");
});

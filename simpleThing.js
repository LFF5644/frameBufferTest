const fs = require('fs');
const config=require("./config.json");

// Konfiguration für den Framebuffer (Abhängig von Ihrer Bildschirmauflösung und Pixelformat)
const width = config.screen_width;  // Breite des Bildschirms
const height = config.screen_height; // Höhe des Bildschirms
const bytesPerPixel = 4; // Bytes pro Pixel (Angenommen: 32-Bit-Farbformat)

// Erstellen Sie einen leeren Buffer mit der Größe des Framebuffers
const framebufferSize = width * height * bytesPerPixel;
const framebuffer = Buffer.alloc(framebufferSize);

// Funktion zum Setzen eines Pixels im Framebuffer
function setPixel(x, y, r, g, b, a) {
	const offset = (y * width + x) * bytesPerPixel;
	framebuffer.writeUInt8(r, offset);       // Rotwert
	framebuffer.writeUInt8(g, offset + 1);   // Grünwert
	framebuffer.writeUInt8(b, offset + 2);   // Blauwert
	framebuffer.writeUInt8(a, offset + 3);   // Alpha-Wert (Transparenz)
}

// Zeichnen Sie ein einfaches Bild (z.B. rotes Rechteck) im Framebuffer
for (let y = 100; y < 200; y++) {
	for (let x = 100; x < 300; x++) {
		setPixel(x, y, 255, 0, 0, 255); // Rotes Pixel mit voller Transparenz
	}
}

// Schreiben Sie den Inhalt des Framebuffers zurück in /dev/fb0
fs.writeFileSync('/dev/fb0', framebuffer);

console.log('Bild wurde im Framebuffer angezeigt.');

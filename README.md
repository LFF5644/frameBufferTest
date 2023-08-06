# Frame Buffer Test Project!

In diesem project lerne ich über den frame buffer!

readme ist auf dem stand vom 07.08.2023 um 00:50 Uhr

## Required
- [Linux](https://google.com/search?q=Linux%20download) ich empfele [Linuxmint](https://linuxmint.com/download.php) für windows nutzer
- [NodeJS](https://nodejs.org/de/download)
- console (TTY 1 - 6)
- frame buffer schreib berechtitung erlangen durch `sudo usermod -aG video $USER; sudo reboot` oder durch root berechtigungen
- `fbset` um informationen über den frambuffer zu erlangen `sudo apt intall fbset -y` wird nicht benötigt ist aber für ungewönliche bildformate empfolen

## Quick start guide & install
### Erster Programmstart
einfach `npm install` eingeben dadurch werden folgende befehle ausgeführt:
- alle in der `package.json` festgelegten module werden in `node_modules` abgelegt.
- `fbset` wird mit hilfe von `apt` insterliert.
- sie bekommen die gruppe `video` mit `usermod` zugeteilt diese benötigen sie um auf `/dev/fb0` **WARNUNG**: dies wird erst nach einem neustart übernommen.
- es wird der `log/` ordner erstelt.
- `npm run init` wird am ende noch ausgeführt dies erstellt die config datei mit ihrem screen configuration und baut die `chars.json` => `compressedCharacterMap.bin`.

zum starten einfach `npm start` oder `./main.js` oder `sudo ./main.js` alternativ kann auch statt `./` `node` verwendet werden.

### Upgrade auf neuesten commit
zum abgleich mit github `npm run update` eingeben dadurch wird folgender code ausgeführt:
- `git pull`: das herrunterladen von github servern
- `npm update`: neue module insterlieren und auf den neuesten stand bringen
- `npm run init`: fals sich das formart der config.json geändert hat dieses erneuern (einstellungen werden beiberhalten in den meisten fällen)

## Datei Bezeichnung
- `config.json`: enthält alle wichtigen infos kann mit `npm run init` erstellt werden denn diese datei wird immer benötigt wenn mit dem frame buffer zusamm gearbeitet wird!
- `chars.json`: enthält die bustaben/zeichen die angezeigt werden können (code by LFF5644)
- `cls.sh`: leert framebuffer und seubert bildschirm
- `init.js`: definirt config.json und baut `chars.json` => `compressedCharacterMap.bin`
- `simpleThing.js`: zeichnet ein 100*100 quadrat auf den bildschirm (code by chatGPT)
- `playWithChars.js`: erhält als parameter ein charachter in der chars.json und gibt diesen aus
- `overwriteFB.js`: ist eine endlos schleife wo einfach jeder pixel eine andere fabe hat `STRG + C` to exit
- `main.js`: ein kleines spiel wo man einen spieler mit den pfeiltasten bewegen kann und mit `t` alle bustaben auf dem bildschirm ausgibt und mit `r` wird die `chars.json` neu geladen und die bustaben erneut angezeigt mit `q` wird es beendet und in `log/main.log` wird eine log datei erstelt
- `install.sh`: wird von npm aufgerufen wenn man `npm install` eingibt
- `update.sh`: wird von npm aufgerufen wenn man `npm run update` eingibt

## Aufgaben, Tasks und Herausfoderungen
- [x] game mit spieler
- [x] spieler glitzt nicht aus dem spielfeld
- [x] spieler kann irgenwelche sachen aufsammeln
- [x] counter wie viele sachen gesamelt wurden
- [x] spieler beckommt eine art `hitbox`
- [x] spieler und objekte bekommen eine textur
- [x] textur ist nicht enfabig
- [ ] textur `size` parameter nutzbar
- [ ] textur fabe ist dynamisch (das rgb`a` byte nutzen)
- [ ] realistische & gute texturen ausdenken
- [ ] spieler fabe auswählbar
- [ ] multiplayer mit mehreren spielern
- [ ] `raw tcp` nicht `socket.io` nutzen für mehr speed
- [ ] spieler können nicht ineinnander glitzschen
- [x] es kann text angezeigt werden
- [x] zeichen sind nur so groß wie sie sein müssen
- [x] zeichen werden gebaut `build` und nicht neu berechnet bzw es wird nicht jedes mal geguckt ob und wie viele `emptyRows` das zeichen hat
- [x] 1px = 1bit nicht byte!
- [x] build charackters => `init.js`
- [x] add numbers to chars.json
- [x] es werden screens/desktops/views erschaffen zb game, menu, exit
- [ ] Hauptmenu erstellen
- [ ] Herausfoderung: dieses in canvas im browser spielbar machen ... (für 2024 geplant)
- [ ] noch mehr Herausfoderungen schreiben 

###### README.md erstellt 29.07.2023 um 13:12 Uhr

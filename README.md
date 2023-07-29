# Frame Buffer Test Project!

In diesem project lerne ich über den frame buffer!

readme ist auf dem stand von `0c8414dc126ec8d013524301e6ffd6000b16dd75` am 29.07.2023 um 12:37 Uhr

## Required
- [Linux](https://google.com/search?q=Linux%20download) ich empfele [Linuxmint](https://linuxmint.com/download.php) für windows nutzer
- [NodeJS](https://nodejs.org/de/download)
- console (TTY 1 - 6)
- frame buffer schreib berechtitung erlangen durch `sudo usermod -aG video $USER; sudo reboot` oder durch root berechtigungen
- fbset um informationen über den frambuffer zu erlangen `sudo apt intall fbset -y` wird nicht benötigt ist aber für ungewönliche bildformate empfolen

## Quick start guide
du benötigst eine `config.json` und einen `log` ordner du kannst dereckt beides beckommen indem du `./init.js` eingibst wenn nodejs nicht gefunden wird gib `node init.js` ein und falz die datei `/dev/fb0` nicht geöfnet werden kann versuche es mit `sudo` forweg wenn du dein system nicht neu starten möchtest.

## Datei Bezeichnung
- `config.json`: enthält alle wichtigen infos kann mit `node init.js` erstellt werden denn diese datei wird immer benötigt wenn mit dem frame buffer zusamm gearbeitet wird!
- `chars.json`: enthält die bustaben/zeichen die angezeigt werden können (code by LFF5644)
- `cls.sh`: leert framebuffer und seubert bildschirm
- `init.js`: definirt config.json
- `simpleThing.js`: zeichnet ein 100*100 quadrat auf den bildschirm (code by chatGPT)
- `playWithChars.js`: erhält als parameter ein charachter in der chars.json und gibt diesen aus
- `overwriteFB.js`: ist eine endlos schleife wo einfach jeder pixel eine andere fabe hat `STRG + C` to exit
- `main.js`: ein kleines spiel wo man einen spieler mit den pfeiltasten bewegen kann und mit `t` alle bustaben auf dem bildschirm ausgibt und mit `r` wird die `chars.json` neu geladen und die bustaben erneut angezeigt mit `q` wird es beendet und in `log/main.log` wird eine log datei erstelt

###### README.md erstellt 29.07.2023 um 13:12 Uhr

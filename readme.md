# FRITZ!Box Kindersicherung

## Docker setup

```
services:
    fritzbox-kindersicherung:
        build: https://github.com/lnoppinger/fritzbox-kindersicherung.git#main
        restart: on-failure
        environment:
            - URL=http://192.168.178.1   # URL für die FRITZ!Box Benutzeroberfläche
            - BENTUZERNAME=fritz3957     # Übernehmen aus FRITZ!Box Benutzeroberfläche -> System -> FRITZ!Box-Benutzer
            - PASSWORD=supergeheimespasswort
            - PROFIL=Fernseher           # Name der Gruppe die Eingeschränkt werden soll
        ports:
            - 80:80                      # Alternativ auf einen beliebigen anderen Port mit 3000:80
```

### Woher kommt die PROFIL Variable?
Einfach ein neues Zugangsprofil erstellen und dann den Namen statt 'Fernseher' einfügen
![Screenshot für erstellen eines neuen Profils](image.png)
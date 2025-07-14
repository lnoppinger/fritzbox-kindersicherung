# Fritzbox Kindersicherung

# Docker setup

```
services:
    fritzbox-kindersicherung:
        build: https://github.com/lnoppinger/fritzbox-kindersicherung.git#main
        restart: on-failure
        environment:
            - URL=http://192.168.178.1   # URL für die FritzBox Benutzeroberfläche
            - BENTUZERNAME=fritz3957     # Übernehmen aus FritzBox Benutzeroberfläche -> System -> Bentzerkonten
            - PASSWORD=supergeheimespasswort
            - PROFIL=fernseher           # Name der Gruppe die Eingeschränkt werden soll
        ports:
            - 80:80                      # Alternativ auf einen beliebigen anderen Port mit 3000:80
```
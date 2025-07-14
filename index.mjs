import express from "express"
import morgan from "morgan"
import axios from "axios"
import { parseStringPromise } from "xml2js"
import crypto from "crypto"
import { configDotenv } from "dotenv"
import { load } from "cheerio"



configDotenv()
let configKeys = [
    "URL",
    "BENUTZERNAME",
    "PASSWORT",
    "PROFIL"
]
let config = {}
configKeys.forEach(key => {
    if(process.env[key] == null) throw Error(`Variable ${key} darf nicht leer sein.`)
    config[key] = process.env[key]
})

let sid = await getSID()
let profilesHtml = await axios.post(
        `${process.env.URL}/data.lua`,
        `xhr=1&sid=${sid}&page=kidPro`,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
    )
let querySelector = load(profilesHtml.data)

querySelector("button[name=delete]").each( (_, button) => {
    if (button.attribs["data-name"] == config.PROFIL) config.PROFIL_ID = button.attribs.value
})
if(config.PROFIL_ID == null) throw Error(`Profil mit Namen '${process.env.PROFIL}' konnte nicht gefunden werden`)

console.log("Konfiguration:", config)



let app = express()
app.use(morgan("dev"))

app.get("/", (req, res) => {
    res.setHeader("Content-Type", "text/html")
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <style>
        body {
            display: flex;
            flex-wrap: nowrap;
            flex-direction: column;
            align-items: center;
        }
        button, pre {
            margin: 20px;
        }
    </style>
    <title> Fritzbox Kindersicherung </title>
</head>
<body>
    <button id="on"> Kindersicherung einschalten </button>
    <button id="off"> Kindersicherung ausschalten </button>

    <pre id="status"> </pre> 

    <script>
        window.onload = () => {
            let status = document.getElementById("status")

            document.getElementById("on").addEventListener("click", async e => {
                status.innerText = "Schalte Kindersicherung ein ..."
                let res = await fetch("/on", {
                    method: "POST"
                })

                if(res.ok) {
                    status.innerText = "Kindersicherung erfolgreich eingeschaltet"
                    setTimeout(() => {
                        status.innerText = ""
                    }, 10000)

                } else {
                    status.innerText = "Beim Einschalten ist etwas schief gelaufen:\\n\\n" + await res.text()
                }
            })

            document.getElementById("off").addEventListener("click", async e => {
                status.innerText = "Schalte Kindersicherung aus ..."
                let res = await fetch("/off", {
                    method: "POST"
                })

                if(res.ok) {
                    status.innerText = "Kindersicherung erfolgreich ausgeschaltet"
                    setTimeout(() => {
                        status.innerText = ""
                    }, 10000)

                } else {
                    status.innerText = "Beim Ausschalten ist etwas schief gelaufen:\\n\\n" + await res.text()
                }
            })
        }
    </script>
</body>
</html>
    `)
})

app.post("/on", async (req, res) => {
    try {
        let sid = await getSID()

        await axios.post(
            `${process.env.URL}/data.lua`,
            `xhr=1&sid=${sid}&back_to_page=kidPro&edit=${config.PROFIL_ID}&name=${config.PROFIL}&time=never&timer_item_0=0000%3B1%3B1&timer_complete=1&budget=unlimited&bpjm=on&netappschosen=&choosenetapps=choose&apply=&lang=de&page=kids_profileedit`,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        )

        await axios.put(
            `${process.env.URL}/api/v0/box`, 
            {
                led_display: "2",
                led_dim_mode: "1",
                led_dim_brightness: "100"
            },{
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "AVM-SID " + sid,
                }
            }
        )

        res.sendStatus(200)

    } catch(e) {
        console.log(e.stack)
        res.status(500).send(e.stack)
    }
})

app.post("/off", async (req, res) => {
    try {
        let sid = await getSID()

        await axios.post(
            `${process.env.URL}/data.lua`,
            `xhr=1&sid=${sid}&back_to_page=kidPro&edit=${config.PROFIL_ID}&name=${config.PROFIL}&time=unlimited&timer_item_0=0000%3B1%3B1&timer_complete=1&budget=unlimited&bpjm=on&netappschosen=&choosenetapps=choose&apply=&lang=de&page=kids_profileedit`,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        )

        await axios.put(
            `http://192.168.178.1/api/v0/box`, 
            {
                led_display: "0",
                led_dim_mode: "1",
                led_dim_brightness: "100"
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "AVM-SID " + sid,
                }
            }
        )

        res.sendStatus(200)

    } catch(e) {
        console.log(e.stack)
        res.status(500).send(e.stack)
    }
})

app.listen(80, () => {
    console.log("Server listening on port 80")
})



async function getSID() {
    let response = await axios.get(`${process.env.URL}/login_sid.lua`)
    let result = await parseStringPromise(response.data)

    let challenge = result.SessionInfo.Challenge[0]
    let sid = result.SessionInfo.SID[0]

    if (sid !== "0000000000000000") return sid

    let buffer = Buffer.from(challenge + '-' + process.env.PASSWORT, "utf16le")
    let hash = crypto.createHash("md5").update(buffer).digest("hex")

    let loginResponse = await axios.get(
        `${process.env.URL}/login_sid.lua`,
        {
            params: {
                username: process.env.BENUTZERNAME,
                response: challenge + '-' + hash,
            }
        }
    )

    let loginResult = await parseStringPromise(loginResponse.data)
    let newSID = loginResult.SessionInfo.SID[0]

    if (newSID === "0000000000000000") {
        throw new Error("Login fehlgeschlagen.")
    }

    return newSID
}
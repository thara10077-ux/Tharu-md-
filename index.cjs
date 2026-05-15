const express = require('express')
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const pino = require('pino')

const app = express()
const port = 3000
app.use(express.json())

let sock

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    sock = makeWASocket({ 
        auth: state, 
        logger: pino({ level: 'silent' }) 
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        if(update.connection === 'close') startBot()
        if(update.connection === 'open') console.log('WhatsApp Connected!')
    })
}

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>THARU-MINI PAIR</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { background:#0f0f1a; color:#fff; display:flex; 
                justify-content:center; align-items:center; min-height:100vh;
                font-family:'Segoe UI',sans-serif; }
            .card { background:#1e1e30; padding:30px; border-radius:20px;
                width:90%; max-width:400px; text-align:center; }
            h2 { background:linear-gradient(90deg,#a855f7,#ec4899);
                -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
            input, button { width:100%; padding:14px; border:none; 
                border-radius:12px; margin:10px 0; font-size:16px; }
            input { background:#2d2d44; color:#fff; outline:none; }
            button { background:linear-gradient(90deg,#a855f7,#ec4899); 
                color:#fff; font-weight:bold; cursor:pointer; }
            .code { font-size:28px; letter-spacing:4px; font-weight:bold; 
                color:#ec4899; margin:20px 0; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>THARU-MINI PAIR</h2>
            <div id="formDiv">
                <input type="text" id="number" placeholder="+9476xxxxxxx">
                <button onclick="getCode()">Generate Pairing Code</button>
            </div>
            <div id="codeDiv" style="display:none;">
                <div class="code" id="codeText"></div>
                <p>WhatsApp → Settings → Linked Devices → Link with phone number</p>
            </div>
        </div>
        <script>
            async function getCode() {
                const number = document.getElementById('number').value;
                if(!number) return alert('Number dapan');
                document.getElementById('formDiv').innerHTML = 'Generating...';
                const res = await fetch('/pair', {
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({number})
                });
                const data = await res.json();
                if(data.code) {
                    document.getElementById('formDiv').style.display='none';
                    document.getElementById('codeDiv').style.display='block';
                    document.getElementById('codeText').innerText = data.code;
                } else {
                    alert(data.error);
                }
            }
        </script>
    </body>
    </html>
    `)
})

app.post('/pair', async (req, res) => {
    const { number } = req.body
    if(!number) return res.json({ error: 'Number dapan' })
    if(!sock) return res.json({ error: 'Wait 5s' })
    
    try {
        const cleanNumber = number.replace(/[^0-9]/g, '')
        await new Promise(r => setTimeout(r, 3000))
        const code = await sock.requestPairingCode(cleanNumber)
        res.json({ code: code })
    } catch (err) {
        res.json({ error: err.message })
    }
})

startBot()

app.listen(port, () => {
    console.log(`💜 THARU-MINI PAIR: http://localhost:${port} machan`)
})

const { cmd, commands } = require('../command');
const config = require('../config');
const fs = require('fs');
const os = require('os');
const axios = require('axios');
const yts = require('yt-search');
const moment = require('moment-timezone');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const startPair = require('../pair');

/* =====================
   HELPERS
===================== */

const badge = v => v === "true" ? "🟢 ON" : "🔴 OFF";

const formatUptime = (sec) => {
  let d = Math.floor(sec / 86400);
  let h = Math.floor(sec % 86400 / 3600);
  let m = Math.floor(sec % 3600 / 60);
  let s = Math.floor(sec % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
};

/* =====================
   ALIVE
===================== */

cmd({
  pattern: "alive",
  react: "🟢",
  category: "main",
  filename: __filename
}, async (conn, mek, m, { reply }) => {

  const up = process.uptime();

  reply(`
🤖 ${config.BOT_NAME}

⏱ Uptime: ${Math.floor(up/60)} min
📁 Commands: ${commands.length}
🌐 Mode: ${config.MODE}
`);

});


/* =====================
   PING
===================== */

cmd({
  pattern: "ping",
  category: "main",
  react:"🏓",
  filename: __filename
}, async (conn, mek, m, { reply }) => {

  let start = Date.now();
  await reply("🏓 Testing...");
  let end = Date.now();

  reply(`🏓 Pong: ${end-start}ms`);
});


/* =====================
   MENU
===================== */

cmd({
  pattern:"menu",
  alias:["help","allmenu"],
  react:"📜",
  category:"main",
  filename:__filename
}, async (conn, mek, m, { from, pushName, sender })=>{

  const start = Date.now();

  const now = moment().tz(config.TIME_ZONE);
  const date = now.format("DD/MM/YYYY");

  let groups = {};
  let total = 0;

  commands.forEach(c=>{
    if(!c.category) return;

    if(!groups[c.category])
      groups[c.category]=[];

    groups[c.category].push(c.pattern);
    total++;
  });

  let menu = `╭══〘 ${config.BOT_NAME} 〙══⊷
┃ Mode: ${config.MODE}
┃ User: ${pushName}
┃ Plugins: ${total}
┃ Uptime: ${formatUptime(process.uptime())}
┃ Date: ${date}
┃ Ping: ...
╰═══════════════⊷`;

  for(let cat in groups){

    menu+=`\n\n╭━❮ ${cat.toUpperCase()} ❯\n`;

    groups[cat].sort().forEach(c=>{
      menu+=`┃ ${config.PREFIX}${c}\n`;
    });

    menu+="╰━━━━━━━━━━";
  }

  const ping = Date.now()-start;
  menu = menu.replace("... ",`${ping}ms`);

  await conn.sendMessage(from,{
    image:{url:config.MENU_IMAGE_URL},
    caption:menu,
    mentions:[sender]
  },{quoted:mek});

});


/* =====================
   ANTI LINK
===================== */

cmd({
  pattern:"antilink",
  react:"🛡️",
  category:"group",
  filename:__filename
},async(conn,mek,m,{isGroup,isAdmins,isCreator,text,reply})=>{

  if(!isGroup) return reply("Group only");
  if(!isAdmins && !isCreator) return reply("Admin only");

  if(!text) return reply("on / off");

  if(text=="on") config.ANTI_LINK="true";
  if(text=="off") config.ANTI_LINK="false";

  reply(`✅ AntiLink: ${badge(config.ANTI_LINK)}`);
});


/* =====================
   DELETE
===================== */

cmd({
  pattern:"del",
  alias:["delete"],
  category:"owner",
  react:"🗑️",
  filename:__filename
},async(conn,mek,m,{quoted,isCreator,reply,from})=>{

  if(!isCreator) return reply("Owner only");
  if(!quoted) return reply("Reply message");

  await conn.sendMessage(from,{
    delete: quoted.key
  });

});


/* =====================
   CONFIG
===================== */

cmd({
  pattern:"config",
  category:"system",
  react:"⚙️",
  filename:__filename
},async(conn,mek,m,{isCreator,reply})=>{

  if(!isCreator) return reply("Owner only");

  reply(`
⚙️ BOT CONFIG

Name: ${config.BOT_NAME}
Owner: ${config.OWNER_NAME}
Mode: ${config.MODE}
AntiLink: ${badge(config.ANTI_LINK)}
AutoReply: ${badge(config.AUTO_REPLY)}
`);

});


/* =====================
   GET IMAGE
===================== */

cmd({
  pattern:"getimage",
  category:"media",
  react:"🖼️",
  filename:__filename
},async(conn,mek,m,{text,from,reply})=>{

  if(!text) return reply("Give URL");

  await conn.sendMessage(from,{
    image:{url:text},
    caption:"Image"
  },{quoted:mek});

});


/* =====================
   INFO
===================== */

cmd({
  pattern:"info",
  category:"main",
  react:"ℹ️",
  filename:__filename
},async(conn,mek,m,{reply})=>{

  reply(`
🤖 BOT INFO

Name: ${config.BOT_NAME}
Mode: ${config.MODE}
Platform: ${os.platform()}
CPU: ${os.cpus()[0].model}
RAM: ${(os.totalmem()/1024/1024).toFixed(1)}MB
`);

});


/* =====================
   KICK ALL
===================== */

cmd({
  pattern:"end",
  alias:["kickall"],
  category:"admin",
  react:"⚠️",
  filename:__filename
},async(conn,mek,m,{isGroup,isCreator,isBotAdmins,groupMetadata,from,reply})=>{

  if(!isGroup) return reply("Group only");
  if(!isCreator) return reply("Owner only");
  if(!isBotAdmins) return reply("Bot not admin");

  let users = groupMetadata.participants
  .map(u=>u.id)
  .filter(u=>u!==`${config.OWNER_NUMBER}@s.whatsapp.net`);

  await conn.groupParticipantsUpdate(from,users,"remove");

  reply("✅ Group cleaned");

});


/* =====================
   LEAVE
===================== */

cmd({
  pattern:"leave",
  category:"owner",
  react:"👋",
  filename:__filename
},async(conn,mek,m,{isCreator,isGroup,from,reply})=>{

  if(!isCreator) return reply("Owner only");
  if(!isGroup) return reply("Group only");

  reply("Bye 👋");
  await new Promise(r => setTimeout(r, 1000));
  await conn.groupLeave(from);

});


/* =====================
   OWNER
===================== */

cmd({
  pattern:"owner",
  category:"main",
  react:"👑",
  filename:__filename
},async(conn,mek,m,{reply})=>{

  reply(`
👑 OWNER

Name: ${config.OWNER_NAME}
Number: ${config.OWNER_NUMBER}
`);

});


/* =====================
   PAIR
===================== */

cmd({
  pattern:"pair",
  category:"system",
  react:"🔑",
  filename:__filename
},async(conn,mek,m,{q,reply})=>{

  if(!q) return reply("Example: .pair 509xxxx");

  await startPair(q);

  reply("Check console");

});


/* =====================
   SET PREFIX
===================== */

cmd({
  pattern:"setprefix",
  category:"owner",
  filename:__filename
},async(conn,mek,m,{q,isCreator,reply})=>{

  if(!isCreator) return reply("Owner only");
  if(!q) return reply("Example: !");

  let env=fs.readFileSync("config.env","utf8");

  env=env.replace(/PREFIX=.*/,"PREFIX="+q);

  fs.writeFileSync("config.env",env);

  reply("Saved. Restart bot.");

});


/* =====================
   TAGALL
===================== */

cmd({
  pattern:"tagall",
  category:"group",
  react:"📢",
  filename:__filename
},async(conn,mek,m,{participants,from,isGroup,isAdmins,isCreator,reply})=>{

  if(!isGroup) return reply("Group only");
  if(!isAdmins && !isCreator) return reply("Admin only");

  let txt="📢 TAG ALL\n";

  participants.forEach(u=>{
    txt+=`@${u.id.split("@")[0]} `;
  });

  await conn.sendMessage(from,{
    text: txt,
    mentions: participants.map(a=>a.id)
  },{ quoted: mek });

});


/* =====================
   HIDETAG
===================== */

cmd({
  pattern:"hidetag",
  category:"group",
  react:"🙈",
  filename:__filename
},async(conn,mek,m,{participants,from,isGroup,isAdmins,isCreator,q,reply})=>{

  if(!isGroup) return reply("Group only");
  if(!isAdmins && !isCreator) return reply("Admin only");

  await conn.sendMessage(from,{
    text:q||"Hello",
    mentions:participants.map(a=>a.id)
  },{quoted:mek});

});


/* =====================
   UPTIME
===================== */

cmd({
  pattern:"uptime",
  category:"main",
  react:"⏱️",
  filename:__filename
},async(conn,mek,m,{reply})=>{

  reply(`⏱ ${formatUptime(process.uptime())}`);

});


/* =====================
   VIDEO
===================== */

cmd({
  pattern:"video",
  category:"download",
  react:"🎬",
  filename:__filename
},async(conn,mek,m,{from,q,reply})=>{

  if(!q) return reply("Give name");

  let url=q;

  if(!q.includes("youtu")){
    let r=await yts(q);
    url=r.videos[0].url;
  }

  const api=`https://api.giftedtech.co.ke/api/download/dlmp4?apikey=gifted&url=${url}`;

  const {data}=await axios.get(api);

  await conn.sendMessage(from,{
    video:{url:data.result.download_url},
    caption:data.result.title
  },{quoted:mek});

});


/* =====================
   VIEWONCE
===================== */

cmd({
  pattern:"vv",
  category:"tools",
  react:"👁️",
  filename:__filename
},async(conn,mek,m,{from,reply})=>{

  if(!m.quoted) return reply("Reply viewonce");

  const msg=m.quoted.message?.viewOnceMessageV2?.message;

  if(!msg) return reply("Not viewonce");

  const media=msg.imageMessage||msg.videoMessage;

  const type=media.mimetype.includes("image")?"image":"video";

  const stream=await downloadContentFromMessage(media,type);

  let buf=Buffer.from([]);

  for await(const c of stream)
    buf=Buffer.concat([buf,c]);

  await conn.sendMessage(from,{
    [type]:buf
  },{quoted:mek});

});

/* =====================
   WELCOME
===================== */

cmd({
  pattern:"welcome",
  category:"group",
  react:"👋",
  filename:__filename
},async(conn,mek,m,{isGroup,from,reply})=>{

  if(!isGroup) return reply("Group only");

  global.welcome=global.welcome||{};

  global.welcome[from]=!global.welcome[from];

  reply(`Welcome: ${global.welcome[from]?"ON":"OFF"}`);

});

/* =====================
   AUTO SYSTEM HANDLERS
===================== */

const configSys = require('../config');


/* ===== AUTO ANTI LINK ===== */

async function handleAntiLink(conn, m) {

  if (configSys.ANTI_LINK !== "true") return;
  if (!m.isGroup) return;

  const text = m.body || "";

  const linkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com)/i;

  if (!linkRegex.test(text)) return;

  if (m.isAdmins || m.isCreator) return;

  try {

    await conn.sendMessage(m.from, {
      delete: m.key
    });

    await conn.sendMessage(m.from, {
      text: `🚫 @${m.sender.split("@")[0]} Links are forbidden!`,
      mentions: [m.sender]
    });

  } catch (e) {
    console.log("AntiLink Error:", e);
  }

}


/* ===== AUTO WELCOME ===== */

async function handleWelcome(conn, update) {

  const jid = update.id;

  if (!global.welcome || !global.welcome[jid]) return;

  for (let user of update.participants) {

    if (update.action === "add") {

      await conn.sendMessage(jid, {
        text: `👋 Welcome @${user.split("@")[0]} 🎉`,
        mentions: [user]
      });

    }

    if (update.action === "remove") {

      await conn.sendMessage(jid, {
        text: `😢 Goodbye @${user.split("@")[0]}`,
        mentions: [user]
      });

    }

  }

}


/* ===== AUTO CHAT PRIVATE ===== */

async function handleAutoChat(conn, m) {

  if (configSys.AUTO_REPLY !== "true") return;

  if (m.isGroup) return;
  if (m.isBot) return;

  const text = m.body?.toLowerCase();
  if (!text) return;

  const replies = {
    "hi": "👋 Hello!",
    "salut": "👋 Salut!",
    "bonjour": "😊 Bonjour!",
    "bonsoir": "🌙 Bonsoir!",
    "comment ça va": "Ça va bien 😎 et toi?",
    "merci": "🙏 De rien!",
    "help": "📜 Tape .menu pour voir mes commandes"
  };

  for (let key in replies) {

    if (text.includes(key)) {

      return conn.sendMessage(m.from, {
        text: replies[key]
      }, { quoted: m });

    }
  }

}


/* =====================
   EXPORT SYSTEM
===================== */

module.exports.systemHandler = {
  handleAntiLink,
  handleWelcome,
  handleAutoChat
};

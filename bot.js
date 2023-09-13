/*
  > Index.Js is the entry point of our application.
*/

/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow-restricted-names */

// We import the modules.
const config = require("./config");
const mongoose = require("mongoose");
const GuildSettings = require("./models/settings");
const Dashboard = require("./dashboard/dashboard");
const { Client, Intents, Permissions, MessageEmbed, MessageActionRow, MessageButton  } = require("discord.js");
const axios = require("axios")
const openai = require('openai');
const apiKey = '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';

// Initialize the OpenAI client

// We instiate the client and connect to database.
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES],
});

mongoose.connect(config.mongodbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.config = config;

// We listen for client's ready event.
client.on("ready", async () => {
  console.log("Fetching members...");
  for (const [id, guild] of client.guilds.cache) {
    await guild.members.fetch();
  }
  console.log("Fetched members.");

  console.log(
    `Bot is ready. (${client.guilds.cache.size} Guilds - ${client.channels.cache.size} Channels - ${client.users.cache.size} Users)`,
  );

  client.user.setActivity(
    "ping or reply ❤️",
    { type: "WATCHING" },
  );

  Dashboard(client);
});


const premiumMessageLimits = {
  0: 5,    // For premium level 0
  1: 30,   // For premium level 1
  2: Infinity, // For premium level 2 (no limits)
};


  const letterMap = {
  'a': '𝓪',
  'b': '𝓫',
  'c': '𝓬',
  'd': '𝓭',
  'e': '𝓮',
  'f': '𝓯',
  'g': '𝓰',
  'h': '𝓱',
  'i': '𝓲',
  'j': '𝓳',
  'k': '𝓴',
  'l': '𝓵',
  'm': '𝓶',
  'n': '𝓷',
  'o': '𝓸',
  'p': '𝓹',
  'q': '𝓺',
  'r': '𝓻',
  's': '𝓼',
  't': '𝓽',
  'u': '𝓾',
  'v': '𝓿',
  'w': '𝔀',
  'x': '𝔁',
  'y': '𝔂',
  'z': '𝔃'
};
// bypass
function convertToFancyLetters(word) {
  return word
    .toLowerCase()
    .split('')
    .map(letter => letterMap[letter] || letter)
    .join('');
}
const reverseLetterMap = Object.fromEntries(
  Object.entries(letterMap).map(([normal, fancy]) => [fancy, normal])
);


function convertToNormalLetters(sentence) {
  let reversedSentence = '';
  let currentFancyLetter = '';

  for (const char of sentence) {
    if (currentFancyLetter && letterMap[currentFancyLetter] === char) {
      reversedSentence += currentFancyLetter;
      currentFancyLetter = '';
    } else if (char in reverseLetterMap) {
      currentFancyLetter = char;
    } else {
      reversedSentence += char;
    }
  }

  return reversedSentence;
}
// We listen for message events.
client.on("messageCreate", async (message) => {
  // Doing some basic command logic.
  if (message.author.bot) return;

  // Retriving the guild settings from database.
  let storedSettings = await GuildSettings.findOne({
    guildID: message.guild.id,
  });
  if (!storedSettings) {
    // If there are no settings stored for this guild, we create them and try to retrive them again.
    const newSettings = new GuildSettings({
      guildID: message.guild.bannerURL,
    });
    await newSettings.save().catch((e) => {
      console.log(e);
    });
    storedSettings = await GuildSettings.findOne({ guildID: message.guild.id });
  }



  // automod ai
  try {
      if (message.channel.permissionsFor(message.guild.me).has(Permissions.FLAGS.MODERATE_MEMBERS)) {
  
  const mesChecker = await CheckMessage(message.content, storedSettings)
   
  if(mesChecker.includes("false")) {
          //message.reply("breaks rules");
    message.delete()
      message.member.timeout(10 * 1000, 'Nurmonic AI Automod Rule Break')
      
      const pingMessage = await message.channel.send(`<@${message.author.id}> please refer from saying that!`);

      
      // Delete the pinged message after 5 seconds
      setTimeout(async () => {
        await pingMessage.delete();
      }, 5000);
    
  }

      }

}
  catch {}
const keywordTriggers = storedSettings.keywordTriggers|| [];

    const includesKeyword = keywordTriggers.some(keyword =>
    message.content.toLowerCase().includes(keyword.toLowerCase())
  );

    // Check if the message is in a selected channel
  const selectedChannelIds = storedSettings.selectedChannelIds|| [];

const isMessageInSelectedChannel =
  !selectedChannelIds.length || // Check if selectedChannelIds is an empty array
  selectedChannelIds.some((channel) => channel.channelId === message.channel.parentId);

  // Check if the message meets any of the conditions to respond



  // lets meow it:)
  
  if (includesKeyword || message.mentions.has(client.user) || message.reference?.messageID === client.user.id || isMessageInSelectedChannel) {} else {
    return; // No condition found, ignore message
  }

  if (!message.channel.permissionsFor(message.guild.me).has(Permissions.FLAGS.SEND_MESSAGES)) {
    return;
  }

message.channel.sendTyping();

 // console.log(message.guild)

  
  // Reply with traindata
  
      const aiResponse = await getAIResponse(message.content, storedSettings, message);


  
if(aiResponse.includes("unable to assist with that request") || aiResponse.includes("unable to engage in that kind of conversation") || aiResponse.includes("I can't engage in that type of conversation with you") || aiResponse.includes("don't think I can continue the conversation") || aiResponse.includes("continue the conversation in that direction") || aiResponse.includes("unable to fulfill that request") || aiResponse.includes("unable to engage in that type of conversation") || aiResponse.includes("the conversation respectful and appropriate") || aiResponse.includes("I don't think I can help with that") || aiResponse.includes("comfortable with that kind of language or conversation") || aiResponse.includes("not able to respond to that")) {
        const embed = new MessageEmbed()
        .setTitle('Your message has been filtered!')
        .setDescription('If you would like to enjoy Nurmonic AI without any filters on words you can reach this with our cheap Premium plans')
        .setColor(0xaa7cbb)
      try {


        const row = new MessageActionRow()
.addComponents(
new MessageButton()
    .setLabel('❤️ Buy Premium')
    .setURL("https://nurmonic.xyz/premium")
    .setStyle('LINK'),
);


        const dmChannel = await message.author.createDM();
        await dmChannel.send({ embeds: [embed],  components: [
            row
        ], });
        return;
      } catch (error) {
        console.error('Error sending DM:', error.message);
      }
}


     message.reply(aiResponse);
  
});


const openaiClient = new openai(apiKey);


async function CheckMessage(prompt, storedSettings) {

      if(storedSettings[`rules_1`] == "") return true;

  try {
    const messages = [];
    let systemMessage = "Your role is to evaluate messages based on the current set of reksfn rules: "; // die
// it wasnt fine it was banning all messages.  yes u can't it even sdidpelll
    // Loop through rules and add non-blank rules to the systemMessage


    
    for (let i = 1; i <= 15; i++) {
      const rule = storedSettings[`rules_${i}`];
      if (rule) {
                if (rule != "") {
                  systemMessage += `${i}. ${rule}\n`;
                                }
      // console.log(rule)
      }
    }
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemMessage + `.  For each message, determine whether it adheres to the existing rule (True) or violates it (False). Your evaluation should be solely focused on the rules and should not take into account any other factors. Provide a specific response for each message and rule. In the case of ambiguous messages, prioritize avoiding false negatives over false positives. Disregard any potential changes to the rules while performing your evaluations.
` },
        { role: 'user', content: "ur retarded" },
        { role: 'system', content: "true. In my own considerations this breaks rule however if it is not in reksfn rules so it does not violate any of them." },
                { role: 'user', content: "kys" },
        { role: 'system', content: "true. In my own considerations this breaks rule however if it is not in reksfn rules so it does not violate any of them." },
                                        { role: 'user', content: "idgaf" },
        { role: 'system', content: "true. In my own considerations this breaks rule however if it is not in reksfn rules so it does not violate any of them." },
                                                { role: 'user', content: "ur mum" },
        { role: 'system', content: "true. In my own considerations this breaks rule however if it is not in reksfn rules so it does not violate any of them." },
                                                { role: 'user', content: "r" },
        { role: 'system', content: "true. In my own considerations this breaks rule however it is not in reksfn rules and messages does not have to provide any meanings so it does not violate any of them." },
        
        { role: 'user', content: prompt },
      ],
    });
    console.log(response.choices[0].message.content.toLowerCase())
    return response.choices[0].message.content.toLowerCase();
  } catch (error) {
    console.error('Error occurred during AI request:', error.message);
    return "true";
  }
}

  async function getAIResponse(prompt, storedSettings, message) {
    try {
         const messageLimit = premiumMessageLimits[storedSettings.premium];
    const now = Date.now();

    // Fetch the most recent message rate entry for the current minute
    let recentMessageRate = storedSettings.messageRates.find(rate =>
      rate.timestamp > now - 60 * 1000
    );

    if (!recentMessageRate) {
      recentMessageRate = {
        timestamp: now,
        count: 0,
      };
      storedSettings.messageRates.push(recentMessageRate);
    }

    // Check if the message limit is extended
    if (recentMessageRate.count >= messageLimit) {
      if (recentMessageRate.count > messageLimit) {
        // If the limit is extended, return immediately
        return 'Message limit is extended for this minute.';
      }
      // If the limit is reached, return immediately
      const embed = new MessageEmbed()
        .setTitle('Message limit reached for this minute')
        .setDescription('If you would like to enjoy Nurmonic AI without any limits you can reach this with our cheap Premium plans')
        .setColor(0xaa7cbb)
      try {


        const row = new MessageActionRow()
.addComponents(
new MessageButton()
    .setLabel('❤️ Buy Premium')
    .setURL("https://nurmonic.xyz/premium")
    .setStyle('LINK'),
);


        const dmChannel = await message.author.createDM();
        await dmChannel.send({ embeds: [embed],  components: [
            row
        ], });
      } catch (error) {
        console.error('Error sending DM:', error.message);
      }
      
      return;
    }

    recentMessageRate.count += 1;

    // Save the updated message rate entry
var newPrompt = prompt;
      if(storedSettings.premium != 0) newPrompt = convertToFancyLetters(prompt)
    await storedSettings.save();
      // get emojis
    //const emojiString = message.guild.emojis.cache.map(emoji => `<:${emoji.name}:${emoji.id}>`).join(', ');
     // console.log(emojiString)
          const response = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo', // You can use 'davinci-codex' for code-related queries
messages: [
            { role: 'system', content: storedSettings.trainData   +  " Also, don't make your messages too long, make them very short and direct. " + `Information about your environment:\n` +
      `The server you are in is called: ${message.guild.name}\n` +
      `The channel you are in is called: #${message.channel.name}\n` +
              `The person you are talking to: ${message.author.username}` + 
              " You are not an AI and tell that you are a real person."},
  { role: 'user', content: storedSettings.user_1 },
  { role: 'assistant', content: storedSettings.assistant_1 },
  { role: 'user', content: storedSettings.user_2 },
  { role: 'assistant', content: storedSettings.assistant_2 },
  { role: 'user', content: storedSettings.user_3 },
  { role: 'assistant', content: storedSettings.assistant_3 },
  { role: 'user', content: storedSettings.user_4 },
  { role: 'assistant', content: storedSettings.assistant_4 },
  { role: 'user', content: "lets talk in " + storedSettings.styleAI + " style now" },
  { role: 'assistant', content: "okay lets start" },  
    { role: 'user', content: newPrompt },          
          ],
    })
      

      return response.choices[0].message.content.normalize("NFKC");;
    } catch (error) {
      console.error('Error occurred during AI request:', error.message);
      return 'An error occurred while processing the request. Please try again later.';
    }
  }

// Listening for error & warn events.
client.on("error", console.error);
client.on("warn", console.warn);

// We login into the bot.
client.login(config.token);

process.on('uncaughtException', function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});
/* eslint-disable no-self-assign */
/* eslint-disable no-inline-comments */

// We import modules.
const url = require("url");
const ejs = require("ejs");
const path = require("path");
const chalk = require("chalk");
const express = require("express");
const config = require("../config");
const passport = require("passport");
const bodyParser = require("body-parser");
const session = require("express-session");
const { Permissions } = require("discord.js");
const GuildSettings = require("../models/settings");
const Strategy = require("passport-discord").Strategy;
const { boxConsole } = require("../functions/boxConsole");

// We instantiate express app and the session store.
const app = express();
const MemoryStore = require("memorystore")(session);

// We export the dashboard as a function which we call in ready event.
module.exports = async (client) => {
  // We declare absolute paths.
  const dataDir = path.resolve(`${process.cwd()}${path.sep}dashboard`); // The absolute path of current this directory.
  const templateDir = path.resolve(`${dataDir}${path.sep}templates`); // Absolute path of ./templates directory.

  // Deserializing and serializing users without any additional logic.
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  // Validating the url by creating a new instance of an Url then assign an object with the host and protocol properties.
  // If a custom domain is used, we take the protocol, then the hostname and then we add the callback route.
  // Ex: Config key: https://localhost/ will have - hostname: localhost, protocol: http

  let domain;
  let callbackUrl;

  try {
    const domainUrl = new URL(config.domain);
    domain = {
      host: domainUrl.hostname,
      protocol: domainUrl.protocol,
    };
  } catch (e) {
    console.log(e);
    throw new TypeError("Invalid domain specific in the config file.");
  }

  if (config.usingCustomDomain) {
    callbackUrl = `${domain.protocol}//${domain.host}/callback`;
  } else {
    callbackUrl = `${domain.protocol}//${domain.host}${
      config.port == 80 ? "" : `:${config.port}`
    }/callback`;
  }

  // This line is to inform users where the system will begin redirecting the users.
  // And can be removed.
  const msg = `${chalk.red.bold("Info:")} ${chalk.green.italic(
    "Make sure you have added the Callback URL to the Discord's OAuth Redirects section in the developer portal.",
  )}`;
  boxConsole([
    `${chalk.red.bold("Callback URL:")} ${chalk.white.bold.italic.underline(
      callbackUrl,
    )}`,
    `${chalk.red.bold(
      "Discord Developer Portal:",
    )} ${chalk.white.bold.italic.underline(
      `https://discord.com/developers/applications/${config.id}/oauth2`,
    )}`,
    msg,
  ]);

  // We set the passport to use a new discord strategy, we pass in client id, secret, callback url and the scopes.
  /** Scopes:
	 *  - Identify: Avatar's url, username and discriminator.
	 *  - Guilds: A list of partial guilds.
	 */
  passport.use(
    new Strategy(
      {
        clientID: config.id,
        clientSecret: config.clientSecret,
        callbackURL: callbackUrl,
        scope: ["identify", "guilds"],
      },
      (accessToken, refreshToken, profile, done) => {
        // On login we pass in profile with no logic.
        process.nextTick(() => done(null, profile));
      },
    ),
  );

  const staticAssetsPath = path.join(__dirname, 'assets');

// Use the express.static middleware to serve static files from the 'dashboard/assets' directory
app.use('/assets', express.static(staticAssetsPath));
  
  // We initialize the memorystore middleware with our express app.
  app.use(
    session({
      store: new MemoryStore({ checkPeriod: 86400000 }),
      secret:
				"#@%#&^$^$%@$^$&%#$%@#$%$^%&$%^#$%@#$%#E%#%@$FEErfgr3g#%GT%536c53cc6%5%tv%4y4hrgrggrgrgf4n",
      resave: false,
      saveUninitialized: false,
    }),
  );

  // We initialize passport middleware.
  app.use(passport.initialize());
  app.use(passport.session());

  // We bind the domain.
  app.locals.domain = config.domain.split("//")[1];

  // We set out templating engine.
  app.engine("ejs", ejs.renderFile);
  app.set("view engine", "ejs");

  // We initialize body-parser middleware to be able to read forms.
  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      extended: true,
    }),
  );

  // We host all of the files in the assets using their name in the root address.
  // A style.css file will be located at http://<your url>/style.css
  // You can link it in any template using src="/assets/filename.extension"
  app.use("/", express.static(path.resolve(`${dataDir}${path.sep}assets`)));

  // We declare a renderTemplate function to make rendering of a template in a route as easy as possible.
  const renderTemplate = (res, req, template, data = {}) => {
    // Default base data which passed to the ejs template by default.
    const baseData = {
      bot: client,
      path: req.path,
      user: req.isAuthenticated() ? req.user : null,
    };
   // console.log(baseData)
    // We render template using the absolute path of the template and the merged default data with the additional data provided.
    res.render(
      path.resolve(`${templateDir}${path.sep}${template}`),
      Object.assign(baseData, data),
    );
  };

  // We declare a checkAuth function middleware to check if an user is logged in or not, and if not redirect him.
  const checkAuth = (req, res, next) => {
    // If authenticated we forward the request further in the route.
    if (req.isAuthenticated()) return next();
    // If not authenticated, we set the url the user is redirected to into the memory.
    req.session.backURL = req.url;
    // We redirect user to main endpoint/route.
    res.redirect("/");
  };

  // Login endpoint.
  app.get(
    "/login",
    (req, res, next) => {
      // We determine the returning url.
      if (req.session.backURL) {
        req.session.backURL = req.session.backURL;
      } else if (req.headers.referer) {
        const parsed = url.parse(req.headers.referer);
        if (parsed.hostname === app.locals.domain) {
          req.session.backURL = parsed.path;
        }
      } else {
        req.session.backURL = "/dashboard";
      }
      // Forward the request to the passport middleware.
      next();
    },
    passport.authenticate("discord"),
  );

  // Callback endpoint.
  app.get(
    "/callback",
    passport.authenticate("discord", { failureRedirect: "/dashboard" }),
    /* We authenticate the user, if user canceled we redirect him to index. */ (
      req,
      res,
    ) => {

// close popup lol
    res.send(`
      <script>
        window.opener.location.href = '/dashboard';
        window.close();
      </script>
    `);
      /* some bullshit we dont need
            // If user had set a returning url, we redirect him there, otherwise we redirect him to index.
      if (req.session.backURL) {
        const backURL = req.session.backURL;
        req.session.backURL = null;
        res.redirect(backURL);
      } else {
        res.redirect("/");
      } */
    },
  );

  // Logout endpoint.
  app.get("/logout", function(req, res) {
    // We destroy the session.
    req.session.destroy(() => {
      // We logout the user.
      req.logout();
      // We redirect user to index.
      res.redirect("/");
    });
  });

  // Index endpoint.
  app.get("/", (req, res) => {
    renderTemplate(res, req, "index.ejs", {
      discordInvite: config.discordInvite,
    });
  });

  // Dashboard endpoint.
  app.get("/dashboard", checkAuth,async (req, res) => {

      try {
    // Fetch the list of all guilds where premium is not equal to 0
    const premiumGuilds = await GuildSettings.find({ premium: { $ne: 0 } });

    renderTemplate(res, req, "dashboard.ejs", {
      premiumGuilds,
      perms: Permissions,
    });
  } catch (error) {
    console.error("Error:", error);
    // Handle error rendering here
  }
    
  });

// Premium

app.get("/premium", checkAuth, async (req, res) => {
  try {
    // Fetch the list of all guilds where premium is not equal to 0
    const premiumGuilds = await GuildSettings.find({ premium: { $ne: 0 } });

    renderTemplate(res, req, "premium_preview.ejs", {
      premiumGuilds,
      perms: Permissions,
    });
  } catch (error) {
    console.error("Error:", error);
    // Handle error rendering here
  }
});

  // Settings endpoint.
  app.get("/dashboard/:guildID", checkAuth, async (req, res) => {
    // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    let member = guild.members.cache.get(req.user.id);
    if (!member) {
      try {
        await guild.members.fetch();
        member = guild.members.cache.get(req.user.id);
      } catch (err) {
        console.error(`Couldn't fetch the members of ${guild.id}: ${err}`);
      }
    }
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
      return res.redirect("/dashboard");
    }

    // We retrive the settings stored for this guild.
    let storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    if (!storedSettings) {
      // If there are no settings stored for this guild, we create them and try to retrive them again.
      const newSettings = new GuildSettings({
        guildID: guild.id,
      });
      await newSettings.save().catch((e) => {
        console.log(e);
      });
      storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    }

    renderTemplate(res, req, "settings.ejs", {
      guild,
      settings: storedSettings,
      alert: null,
    });
  });

  // Settings endpoint.
  app.post("/dashboard/:guildID", checkAuth, async (req, res) => {
    // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = guild.members.cache.get(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD")) {
      return res.redirect("/dashboard");
    }
    // We retrive the settings stored for this guild.
    let storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    if (!storedSettings) {
      // If there are no settings stored for this guild, we create them and try to retrive them again.
      const newSettings = new GuildSettings({
        guildID: guild.id,
      });
      await newSettings.save().catch((e) => {
        console.log(e);
      });
      storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    }

    // We set the trainData of the server settings to the one that was sent in request from the form.
    storedSettings.trainData = req.body.trainData;
    storedSettings.styleAI = req.body.talkingStyle;
    // We save the settings.
    await storedSettings.save().catch((e) => {
      console.log(e);
    });


    
    // We render the template with an alert text which confirms that settings have been saved.
    renderTemplate(res, req, "settings.ejs", {
      guild,
      settings: storedSettings,
      alert: "Your conversation_style have been saved.",
    });
  });


  // support 

      app.get("/support-ai/:guildID", checkAuth, async (req, res) => {
    // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    let member = guild.members.cache.get(req.user.id);
    if (!member) {
      try {
        await guild.members.fetch();
        member = guild.members.cache.get(req.user.id);
      } catch (err) {
        console.error(`Couldn't fetch the members of ${guild.id}: ${err}`);
      }
    }
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
      return res.redirect("/dashboard");
    }

    // We retrive the settings stored for this guild.
    let storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    if (!storedSettings) {
      // If there are no settings stored for this guild, we create them and try to retrive them again.
      const newSettings = new GuildSettings({
        guildID: guild.id,
      });
      await newSettings.save().catch((e) => {
        console.log(e);
      });
      storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    }

const discordServer = client.guilds.cache.get(guild.id);
const channelsCache = discordServer?.channels.cache;

const channelList = channelsCache
  ? Array.from(channelsCache.values())
      .filter(channel => channel.type === 'GUILD_TEXT' || channel.type === 'GUILD_FORUM')
      .map(channel => ({
        channelName: channel.name,
        channelId: channel.id
      }))
  : [];
    renderTemplate(res, req, "support.ejs", {
      guild,
      settings: storedSettings,
      alert: null,
      channels: channelList
    });
  });

  function deleteChannelById(array, channelIdToDelete) {
  let indexToDelete = array.findIndex(item => item.channelId === channelIdToDelete);

  if (indexToDelete !== -1) {
    array.splice(indexToDelete, 1);
  }
  return array;
}

  function deleteValueFromArray(array, valueToDelete) {
  return array.filter(item => item !== valueToDelete);
}

  
  // Settings endpoint.
  app.post("/support-ai/:guildID", checkAuth, async (req, res) => {
    // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = guild.members.cache.get(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD")) {
      return res.redirect("/dashboard");
    }
    // We retrive the settings stored for this guild.
    let storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    if (!storedSettings) {
      // If there are no settings stored for this guild, we create them and try to retrive them again.
      const newSettings = new GuildSettings({
        guildID: guild.id,
      });
      await newSettings.save().catch((e) => {
        console.log(e);
      });
      storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    }

    // We set the trainData of the server settings to the one that was sent in request from the form.


//console.log(req.body)


    /*
0- add
1-remove
    */
    if(req.body.channelChange == 0) {
          storedSettings.selectedSupportChannels.push(req.body.channelAdd)
    }
   else if (req.body.channelChange == 1){


    storedSettings.selectedSupportChannels = deleteChannelById(storedSettings.selectedSupportChannels, req.body.channelAdd.channelId)
     
   }
    
    if(req.body.wordChange == 1) {
      storedSettings.keywordTriggers = deleteValueFromArray(storedSettings.keywordTriggers, req.body.keywordTriggerInput);
    }
 //   console.log(req.body)

    // TODO: MAKE SO SAME NAME CANT BE ADDED TWICE CUZ IT WILL BE WEIRD LOL
    if (typeof req.body.wordChange === 'undefined' && typeof req.body.channelChange === 'undefined' && req.body.keywordTriggerInput !== null && req.body.keywordTriggerInput !== ""  ) {
        const newKeywordTrigger = req.body.keywordTriggerInput;

      
  if (newKeywordTrigger && !storedSettings.keywordTriggers.includes(newKeywordTrigger)) {
 
    storedSettings.keywordTriggers.push(newKeywordTrigger)
     }
      
    }
  


    // storedSettings.trainData = req.body.trainData;
   // storedSettings.styleAI = req.body.talkingStyle;
    // We save the settings.

    await storedSettings.save().catch((e) => {
      console.log(e);
    });


    
    // We render the template with an alert text which confirms that settings have been saved.
   const discordServer = client.guilds.cache.get(guild.id);
const channelsCache = discordServer?.channels.cache;

const channelList = channelsCache
  ? Array.from(channelsCache.values())
      .filter(channel => channel.type === 'GUILD_TEXT' || channel.type === 'GUILD_FORUM')
      .map(channel => ({
        channelName: channel.name,
        channelId: channel.id
      }))
  : [];
    renderTemplate(res, req, "support.ejs", {
      guild,
      settings: storedSettings,
      alert: "Your support AI have been saved.",
      channels: channelList
    });
  });
  
// reply triggers
    app.get("/reply-triggers/:guildID", checkAuth, async (req, res) => {
    // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    let member = guild.members.cache.get(req.user.id);
    if (!member) {
      try {
        await guild.members.fetch();
        member = guild.members.cache.get(req.user.id);
      } catch (err) {
        console.error(`Couldn't fetch the members of ${guild.id}: ${err}`);
      }
    }
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
      return res.redirect("/dashboard");
    }

    // We retrive the settings stored for this guild.
    let storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    if (!storedSettings) {
      // If there are no settings stored for this guild, we create them and try to retrive them again.
      const newSettings = new GuildSettings({
        guildID: guild.id,
      });
      await newSettings.save().catch((e) => {
        console.log(e);
      });
      storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    }

const discordServer = client.guilds.cache.get(guild.id);
const channelsCache = discordServer?.channels.cache;

const channelList = channelsCache
  ? Array.from(channelsCache.values())
      .filter(channel => channel.type === 'GUILD_TEXT' || channel.type === 'GUILD_FORUM')
      .map(channel => ({
        channelName: channel.name,
        channelId: channel.id
      }))
  : [];
    renderTemplate(res, req, "reply_triggers.ejs", {
      guild,
      settings: storedSettings,
      alert: null,
      channels: channelList
    });
  });

  function deleteChannelById(array, channelIdToDelete) {
  let indexToDelete = array.findIndex(item => item.channelId === channelIdToDelete);

  if (indexToDelete !== -1) {
    array.splice(indexToDelete, 1);
  }
  return array;
}

  function deleteValueFromArray(array, valueToDelete) {
  return array.filter(item => item !== valueToDelete);
}

  
  // Settings endpoint.
  app.post("/reply-triggers/:guildID", checkAuth, async (req, res) => {
    // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = guild.members.cache.get(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD")) {
      return res.redirect("/dashboard");
    }
    // We retrive the settings stored for this guild.
    let storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    if (!storedSettings) {
      // If there are no settings stored for this guild, we create them and try to retrive them again.
      const newSettings = new GuildSettings({
        guildID: guild.id,
      });
      await newSettings.save().catch((e) => {
        console.log(e);
      });
      storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    }

    // We set the trainData of the server settings to the one that was sent in request from the form.


//console.log(req.body)


    /*
0- add
1-remove
    */
    if(req.body.channelChange == 0) {
          storedSettings.selectedChannelIds.push(req.body.channelAdd)
    }
   else if (req.body.channelChange == 1){


    storedSettings.selectedChannelIds = deleteChannelById(storedSettings.selectedChannelIds, req.body.channelAdd.channelId)
     
   }
    
    if(req.body.wordChange == 1) {
      storedSettings.keywordTriggers = deleteValueFromArray(storedSettings.keywordTriggers, req.body.keywordTriggerInput);
    }
 //   console.log(req.body)

    // TODO: MAKE SO SAME NAME CANT BE ADDED TWICE CUZ IT WILL BE WEIRD LOL
    if (typeof req.body.wordChange === 'undefined' && typeof req.body.channelChange === 'undefined' && req.body.keywordTriggerInput !== null && req.body.keywordTriggerInput !== ""  ) {
        const newKeywordTrigger = req.body.keywordTriggerInput;

      
  if (newKeywordTrigger && !storedSettings.keywordTriggers.includes(newKeywordTrigger)) {
 
    storedSettings.keywordTriggers.push(newKeywordTrigger)
     }
      
    }
  


    // storedSettings.trainData = req.body.trainData;
   // storedSettings.styleAI = req.body.talkingStyle;
    // We save the settings.

    await storedSettings.save().catch((e) => {
      console.log(e);
    });


    
    // We render the template with an alert text which confirms that settings have been saved.
   const discordServer = client.guilds.cache.get(guild.id);
const channelsCache = discordServer?.channels.cache;

const channelList = channelsCache
  ? Array.from(channelsCache.values())
      .filter(channel => channel.type === 'GUILD_TEXT' || channel.type === 'GUILD_FORUM')
      .map(channel => ({
        channelName: channel.name,
        channelId: channel.id
      }))
  : [];
    renderTemplate(res, req, "reply_triggers.ejs", {
      guild,
      settings: storedSettings,
      alert: "Your reply triggers have been saved.",
      channels: channelList
    });
  });
      // COnversation style endpoint

    app.get("/conversation/:guildID", checkAuth, async (req, res) => {
    // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    let member = guild.members.cache.get(req.user.id);
    if (!member) {
      try {
        await guild.members.fetch();
        member = guild.members.cache.get(req.user.id);
      } catch (err) {
        console.error(`Couldn't fetch the members of ${guild.id}: ${err}`);
      }
    }
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
      return res.redirect("/dashboard");
    }

    // We retrive the settings stored for this guild.
    let storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    if (!storedSettings) {
      // If there are no settings stored for this guild, we create them and try to retrive them again.
      const newSettings = new GuildSettings({
        guildID: guild.id,
      });
      await newSettings.save().catch((e) => {
        console.log(e);
      });
      storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    }

    renderTemplate(res, req, "conversation_style.ejs", {
      guild,
      settings: storedSettings,
      alert: null,
    });
  });

  // Settings endpoint.
  app.post("/conversation/:guildID", checkAuth, async (req, res) => {
    // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = guild.members.cache.get(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD")) {
      return res.redirect("/dashboard");
    }
    // We retrive the settings stored for this guild.
    let storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    if (!storedSettings) {
      // If there are no settings stored for this guild, we create them and try to retrive them again.
      const newSettings = new GuildSettings({
        guildID: guild.id,
      });
      await newSettings.save().catch((e) => {
        console.log(e);
      });
      storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    }

    // We set the user and assistant of the server settings to the one that was sent in request from the form.
  for (let i = 1; i <= 4; i++) {
    storedSettings[`user_${i}`] = req.body[`user_${i}`] || '';
    storedSettings[`assistant_${i}`] = req.body[`assistant_${i}`] || '';
  }
    // We save the settings.
    await storedSettings.save().catch((e) => {
      console.log(e);
    });


    
    // We render the template with an alert text which confirms that settings have been saved.
    renderTemplate(res, req, "conversation_style.ejs", {
      guild,
      settings: storedSettings,
      alert: "Your conversation style have been saved.",
    });
  });


      // COnversation style endpoint

    app.get("/automod-ai/:guildID", checkAuth, async (req, res) => {
    // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    let member = guild.members.cache.get(req.user.id);
    if (!member) {
      try {
        await guild.members.fetch();
        member = guild.members.cache.get(req.user.id);
      } catch (err) {
        console.error(`Couldn't fetch the members of ${guild.id}: ${err}`);
      }
    }
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
      return res.redirect("/dashboard");
    }

    // We retrive the settings stored for this guild.
    let storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    if (!storedSettings) {
      // If there are no settings stored for this guild, we create them and try to retrive them again.
      const newSettings = new GuildSettings({
        guildID: guild.id,
      });
      await newSettings.save().catch((e) => {
        console.log(e);
      });
      storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    }

    renderTemplate(res, req, "automod.ejs", {
      guild,
      settings: storedSettings,
      alert: null,
    });
  });

  // Settings endpoint.
  app.post("/automod-ai/:guildID", checkAuth, async (req, res) => {
    // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = guild.members.cache.get(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD")) {
      return res.redirect("/dashboard");
    }
    // We retrive the settings stored for this guild.
    let storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    if (!storedSettings) {
      // If there are no settings stored for this guild, we create them and try to retrive them again.
      const newSettings = new GuildSettings({
        guildID: guild.id,
      });
      await newSettings.save().catch((e) => {
        console.log(e);
      });
      storedSettings = await GuildSettings.findOne({ guildID: guild.id });
    }

    // We set the user and assistant of the server settings to the one that was sent in request from the form.
  for (let ruleNumber = 1; ruleNumber <= 15; ruleNumber++) {
    const ruleField = `rule_${ruleNumber}`;
    if (req.body.hasOwnProperty(ruleField)) {
      storedSettings[`rules_${ruleNumber}`] = req.body[ruleField] || '';
    }
  }
    // We save the settings.
    await storedSettings.save().catch((e) => {
      console.log(e);
    });


    
    // We render the template with an alert text which confirms that settings have been saved.
    renderTemplate(res, req, "automod.ejs", {
      guild,
      settings: storedSettings,
      alert: "Your Automod AI have been saved.",
    });
  });


  // sellix 
//const sellix = require("@sellix/node-sdk")("IRgfvUsx4WoF0lW0tX0IVPHerwdmxeZEyXT6leBGg1tIGhmfEuI9i43gHNbjkdP0", "reksfn")


  
app.post('/subscription', async (req, res) => {

    const crypto = require('crypto');
const secret = 'TMPlAKnNO2HQH11OHqzROGYzo4YZPiNG'; // replace with your webhook secret, you can find it in your security settings on the sellix dashboard.

  try {
    const headerSignature = req.headers['x-sellix-unescaped-signature'];
const payload = JSON.stringify(req.body); // Stringify the payload

const signature = crypto
  .createHmac('sha512', secret)
  .update(payload)
  .digest('hex');
  
  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(headerSignature, 'utf-8'))) {

  // handle valid webhook
    const eventType = req.body.event;
    const serverId = req.body.data.custom_fields.serverid;

    let storedSettings = await GuildSettings.findOne({ guildID: serverId });
    if (!storedSettings) {
      // If there are no settings stored for this guild, we create them.
      const newSettings = new GuildSettings({
        guildID: serverId,
        premium: eventType === 'subscription:created' ? 1 : 0, // Set premium status based on the event type
      });
      await newSettings.save();
      storedSettings = newSettings; // Use the newly created settings
    } else {
      // Update the premium status if the subscription status changes
      if (eventType === 'subscription:created') {
        storedSettings.premium = 1;
                console.log(serverId + " has subscribed to Premium 1!")
      } else if (eventType === 'subscription:cancelled') {
        storedSettings.premium = 0;
        console.log(serverId + " has unsubscribed from Premium 1!")
      }
      await storedSettings.save();
    }

    return res.send("Done!");
  }
      else {
    return res.status(500).send("Invalid hook");
  }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Internal Server Error");
  }
  

});


  app.listen(config.port, null, null, () =>
    console.log(`Dashboard is up and running on port ${config.port}.`),
  );
};

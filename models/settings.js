// We grab Schema and model from mongoose library.
const { trainData, user_1, user_2, user_3, user_4, user_5, assistant_1, assistant_2, assistant_3, assistant_4, assistant_5, styleAI } = require("../config");
const { Schema, model } = require("mongoose");

// We declare new schema.
const guildSettingSchema = new Schema({
  guildID: {
    type: String,
  },
  premium: {
    type: Number,
    default: 0
  },
  trainData: {
    type: String,
    default: trainData,
  },
  keywordTriggers: ["Nurmonic"],
  selectedChannelIds: [],
  selectedSupportChannels: [],
  user_1: {
    type: String,
    default: user_1,
  },
  user_2: {
    type: String,
    default: user_2,
  },
  user_3: {
    type: String,
    default: user_3,
  },
  user_4: {
    type: String,
    default: user_4,
  },
 /* user_5: {
    type: String,
    default: user_5,
  },*/
  assistant_1: {
    type: String,
    default: assistant_1,
  },
  assistant_2: {
    type: String,
    default: assistant_2,
  },
  assistant_3: {
    type: String,
    default: assistant_3,
  },
  assistant_4: {
    type: String,
    default: assistant_4,
  },
  /*assistant_5: {
    type: String,
    default: assistant_5,
  }, */
    rules_1: {
    type: String,
    default: "",
  },
  rules_2: {
    type: String,
    default: "",
  },
  rules_3: {
    type: String,
    default: "",
  },
  rules_4: {
    type: String,
    default: "",
  },
  rules_5: {
    type: String,
    default: "",
  },
  rules_6: {
    type: String,
    default: "",
  },
  rules_7: {
    type: String,
    default: "",
  },
  rules_8: {
    type: String,
    default: "",
  },
  rules_9: {
    type: String,
    default: "",
  },
  rules_10: {
    type: String,
    default: "",
  },
  rules_11: {
    type: String,
    default: "",
  },
  rules_12: {
    type: String,
    default: "",
  },
  rules_13: {
    type: String,
    default: "",
  },
  rules_14: {
    type: String,
    default: "",
  },
  rules_15: {
    type: String,
    default: "",
  },
  styleAI: {
    type: String,
    default: styleAI,
  },
    messageRates: [
    {
      timestamp: { type: Date, default: Date.now },
      count: Number,
    },
  ],
});

// We export it as a mongoose model.
module.exports = model("guild_settings", guildSettingSchema);
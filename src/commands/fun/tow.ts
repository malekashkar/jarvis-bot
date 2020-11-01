import { GoogleSpreadsheet } from "google-spreadsheet";
import { Client, Message } from "discord.js";
import vision from "@google-cloud/vision";
import dotenv from "dotenv";
import moment from "moment";

import { react, emojis, Information, uploadImage } from "../../util";
import settings from "../../settings";
import embeds from "../../util/embed";
import creds from "../../spreadsheet_api";
import Command from "..";
import {
  optionReactQuestion,
  confirmator,
  messageQuestion,
} from "../../util/questions";

dotenv.config();

export default class TowCommand extends Command {
  cmdName = "tow";
  description =
    "Bad boy I see, you towing people cars now? lmfao man you are cool...";
  groupName = "Owner";
  permission = "EVERYONE";

  async run(client: Client, message: Message) {
    let information: Information = {
      trouble_code_1: "",
      tow_distance: "",
      er_distance: "",
      completed: "",
      company: "",
      call_id: "",
      payment: "",
      level: "",
      color: "",
      model: "",
      year: "",
      make: "",
      images: [],
      apd: [],
    };

    /* Company Name */
    if (!information.company) {
      const companyName = await callType(message);
      if (!companyName) return console.log(`Error with company name.`);
      information.company = companyName;
    }

    /* Get Images & Information */
    if (information.company === "AAA") {
      const images = await getImages(message);
      if (!images) return console.log(`Error getting images.`);
      information.images = images;

      const imageInformation = await getImagesInformation(images, information);
      if (!imageInformation)
        return console.log(`Error getting information for images.`);
      information = imageInformation;
    }

    /* Service Completed */
    if (information.company !== "AAA" && !information.completed) {
      const completed = await serviceCompleted(message);
      information.completed = completed;
    }

    /* Car Details */
    if (
      !information.year ||
      !information.make ||
      !information.model ||
      !information.color
    ) {
      const detailsInformation = await carDetails(message, information);
      if (!detailsInformation) return console.log(`Error getting car details.`);
      information = detailsInformation;
    }

    /* Tow Distance */
    if (!information.tow_distance) {
      const tow_distance = await towDistance(message);
      if (!tow_distance) return console.log(`Error getting tow distance.`);
      information.tow_distance = tow_distance;
    }

    /* Extra Images */
    if (!information.images || !information.images.length) {
      const extraImages = await getImages(message);
      if (!extraImages) information.images = [];
      else information.images = extraImages;
    }

    /* APD's */
    if (!information.apd || !information.apd.length) {
      const apds = await getApds(message);
      if (!apds) information.apd = [];
      else information.apd = apds;
    }

    /* Payment Method */
    if (!information.payment) {
      const method = await getPaymentMethod(message);
      if (!method) return console.log(`Error getting payment method.`);
      information.payment = method;
    }

    /* Confirmation */
    await confirmFinalProduct(message, information);
  }
}

async function submitInformation(information: Information) {
  const doc = new GoogleSpreadsheet(settings.spreadsheet);

  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[5];
  sheet.addRow(objectToSheetHeader(information));
}

async function confirmFinalProduct(message: Message, information: Information) {
  const informationSize = Object.keys(information).length - 2;
  const reactEmoji = emojis.slice(0, informationSize);
  const infoEntries = Object.keys(information);
  const infoValues = Object.values(information);

  const questionEmbed = embeds.normal(
    `Answer the question below`,
    `Please confirm you would like to post the information into the spreadsheet.\nYou have the next 60 seconds to click the ✅!`
  );

  for (let i = 0; i < infoEntries.length; i++) {
    questionEmbed.addField(
      `${emojis[i]}. ${infoEntries[i]}`,
      `${infoValues[i] || "N/A"}`,
      true
    );
  }

  const question = await message.channel.send(questionEmbed);
  await react(question, reactEmoji.concat(["✅"]));

  await question.awaitReactions(
    (r, u) => u.id === message.author.id && r.emoji.name === "✅",
    { max: 1, time: 60000, errors: ["time"] }
  );

  let infoErrorReactions = question.reactions.cache
    .array()
    .filter((x) => x.count === 2 && x.emoji.name !== "✅");
  if (!infoErrorReactions || !infoErrorReactions.length) {
    await submitInformation(information);
    return await message.channel.send(
      embeds.normal(
        `Tow Complete`,
        `The information has been posted to the spreadsheet!`
      )
    );
  }

  for (let i = 0; i < infoErrorReactions.length; i++) {
    type informationKeysType = keyof Omit<Information, "images" | "apd">;

    const keyIndex = emojis.indexOf(infoErrorReactions[i].emoji.name);
    const changeVariable = infoEntries[keyIndex] as informationKeysType;
    const question = await messageQuestion(
      message,
      `What would you like to replease ${changeVariable} with.`
    );

    information[changeVariable] = question ? question.content : "N/A";
  }

  await submitInformation(information);
  await message.channel.send(
    embeds.normal(
      `Tow Complete`,
      `The information has been posted to the spreadsheet!`
    )
  );
}

function objectToSheetHeader(information: Information) {
  return {
    "Date of Ticket": moment(Date.now()).format("L"),
    Company: information.company,
    "Call ID": information.call_id || "N/A",
    Plan: information.level || "N/A",
    "Vehicle Description": `${information.color} ${information.model} ${information.year} ${information.make}`,
    "Service Requested": information.trouble_code_1 || "Tow",
    "Service Completed": information.completed || "Yes",
    "ER Mileage": information.er_distance || "N/A",
    "Tow Mileage": information.tow_distance || "N/A",
    Charges: information.payment || "N/A",
    "Extra Services": information.apd ? information.apd.join(", ") : "N/A",
    Images: information.images ? information.images.join(", ") : `N/A`,
  };
}

async function getApds(message: Message) {
  const questionMsg = await message.channel.send(
    embeds.question(
      `Where there any APD's for this service?\n*Click the ✅ when you are done clicking your options*\n\n1️⃣ Extender Service Time\n2️⃣ Priority Bonus\n3️⃣ Cleanup\n4️⃣ GOA`
    )
  );
  await react(questionMsg, ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "✅"]);

  const reactionCollector = await questionMsg.awaitReactions(
    (r, u) => u.id === message.author.id && r.emoji.name === "✅",
    { max: 1, time: 900000, errors: ["time"] }
  );

  const apds: string[] = [];
  if (!reactionCollector || !reactionCollector.size) return apds;

  const reactions = questionMsg.reactions.cache
    .array()
    .filter((x) => x.count === 2 && x.emoji.name !== "✅");
  if (!reactions || !reactions.length) return apds;

  for (const r of reactions) {
    if (r.emoji.name === "1️⃣") apds.push("Extended Service Time");
    if (r.emoji.name === "2️⃣") apds.push("Priority Bonus");
    if (r.emoji.name === "3️⃣") apds.push("Cleanup");
    if (r.emoji.name === "4️⃣") apds.push("GOA");
  }

  if (questionMsg.deletable) questionMsg.delete();

  return apds;
}

async function getPaymentMethod(message: Message) {
  const question = await message.channel.send(
    embeds.question(
      `What payment method was used for this service?\n\n1️⃣ Cash\n2️⃣ Cashapp\n3️⃣ Card\n4️⃣ Check\n5️⃣ Shop Call\n❌ None`
    )
  );

  await react(question, ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "❌"]);

  const reactionCollector = await question.awaitReactions(
    (r, u) =>
      u.id === message.author.id &&
      ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "❌"].includes(r.emoji.name),
    { max: 1, time: 900000, errors: ["time"] }
  );

  const emoji = reactionCollector.first().emoji.name;

  const method =
    emoji === "1️⃣"
      ? `Cash`
      : emoji === "2️⃣"
      ? `Cashapp`
      : emoji === "3️⃣"
      ? `Card`
      : emoji === "4️⃣"
      ? `Check`
      : emoji === "❌"
      ? `None`
      : await messageQuestion(message, `What is the address/name of the shop?`);

  if (!method) return null;
  if (typeof method === "string") return method;
  else return method.content;
}

async function towDistance(message: Message) {
  const question = await messageQuestion(
    message,
    `What is the tow mileage? (Use numbers)`
  );
  if (!question) return null;

  return question.content;
}

async function carDetails(message: Message, information: Information) {
  const ogInformation = information;

  const question = await messageQuestion(
    message,
    `What is the vehicle year, make, model, and color? (ex. year/make/model/color)`
  );
  if (!question) return null;

  const content = question.content;
  information.year = content.split("/")[0];
  information.make = content.split("/")[1];
  information.model = content.split("/")[2];
  information.color = content.split("/")[3];

  return information === ogInformation ? null : information;
}

async function getImagesInformation(
  images: string[],
  information: Information
) {
  const ogInformation = information;
  const vClient = new vision.ImageAnnotatorClient();

  for (let i = 0; i < images.length; i++) {
    const ans = await vClient.textDetection(images[i]);
    if (!ans[0] || !ans[0].fullTextAnnotation) continue;

    const imgurLink = await uploadImage(images[i]);
    if (!imgurLink) return null;
    information.images.push(imgurLink);

    const results = ans[0].fullTextAnnotation.text
      .split("\n")
      .splice(0, 3)
      .filter((x) => !x.includes(": ") && x.includes(":"));

    for (let i = 0; i < results.length; i++) {
      const result = results[i + 1]
        .replace(":", "")
        .replace(" ", "_")
        .toLowerCase();

      if (results[i].toLowerCase().includes("year")) information.year = result;
      if (results[i].toLowerCase().includes("make")) information.make = result;
      if (results[i].toLowerCase().includes("model"))
        information.model = result;
      if (results[i].toLowerCase().includes("color"))
        information.color = result;
      if (results[i].toLowerCase().includes("er distance"))
        information.er_distance = result;
      if (results[i].toLowerCase().includes("tow distance"))
        information.tow_distance = result;
      if (results[i].toLowerCase().includes("level"))
        information.level = result;
      if (results[i].toLowerCase().includes("call id"))
        information.call_id = result;
      if (results[i].toLowerCase().includes("trouble code 1"))
        information.trouble_code_1 = result;
    }

    return information === ogInformation ? null : information;
  }
}

async function serviceCompleted(message: Message) {
  const confirmation = await confirmator(
    message,
    `Was this service completed?`
  );

  return confirmation ? "Yes" : "No";
}

async function getImages(message: Message) {
  const questionMessage = await message.channel.send(
    embeds.question(
      `Submit the images you would like to pull information from and click the ✅ when your are done.`
    )
  );

  await react(questionMessage, ["✅"]);

  const reactionCollector = await questionMessage.awaitReactions(
    (r, u) => u.id === message.author.id && r.emoji.name === "✅",
    { max: 1, time: 900000, errors: ["time"] }
  );

  if (questionMessage.deletable) await questionMessage.delete();
  if (!reactionCollector || !reactionCollector.size) return false;

  const messages = await message.channel.messages.fetch();
  const questionMessageIndex = messages
    .map((x) => x.id)
    .indexOf(questionMessage.id);
  const imageLinks = messages
    .array()
    .slice(0, questionMessageIndex)
    .map((x) => {
      if (x.attachments && x.attachments.first() && x.attachments.first().url)
        return x.attachments.first().url;
    })
    .filter((x) => !!x);

  return imageLinks.length ? imageLinks : null;
}

async function callType(message: Message) {
  const companyReaction = await optionReactQuestion(
    message,
    `What kind of call is this?`,
    ["AAA", "AZ", "NAFAR"]
  );
  if (!companyReaction) return null;

  const emoji = companyReaction.emoji.name;
  return emoji === "1️⃣" ? "AAA" : emoji === "2️⃣" ? "AZ" : "NAFAR";
}

import { GoogleSpreadsheet } from "google-spreadsheet";
import { Client, Message } from "discord.js";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import moment from "moment";
import dotenv from "dotenv";
import path from "path";

import {
  react,
  emojis,
  Information,
  uploadImage,
  toTitleCase,
} from "../../util";
import spreadsheetCreds from "../../spreadsheet_creds.json";
import settings from "../../settings";
import embeds from "../../util/embed";
import Command from "..";
import {
  optionReactQuestion,
  confirmator,
  messageQuestion,
} from "../../util/questions";

dotenv.config({ path: path.join(__dirname, "..", "..", "..", ".env") });

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
      if (!companyName)
        return message.channel.send(
          embeds.error(`An error was caught while getting the company name.`)
        );
      information.company = companyName;
    }

    /* Get Images & Information */
    if (information.company === "AAA") {
      const images = await getImages(message);
      if (!images)
        return message.channel.send(
          embeds.error(`An error was caught while getting the images.`)
        );

      const imageInformation = await getImagesInformation(images, information);
      if (!imageInformation)
        return message.channel.send(
          embeds.error(
            `An error was caught while getting the image(s) information.`
          )
        );
      information = imageInformation;
    }

    /* Service Completed */
    if (information.company !== "AAA" && !information.completed) {
      const completed = await serviceCompleted(message);
      information.completed = completed;
    } else information.completed = "Yes";

    /* Car Details */
    if (
      !information.year ||
      !information.make ||
      !information.model ||
      !information.color
    ) {
      const detailsInformation = await carDetails(message, information);
      if (!detailsInformation)
        return message.channel.send(
          embeds.error(`An error was caught while getting the car details.`)
        );
      information = detailsInformation;
    }

    /* Tow Distance */
    if (!information.tow_distance) {
      const tow_distance = await towDistance(message);
      if (!tow_distance)
        return message.channel.send(
          embeds.error(`An error was caught while getting the tow distance.`)
        );
      information.tow_distance = tow_distance;
    }

    /* Extra Images */
    if (
      (!information.images || !information.images.length) &&
      information.company !== "AAA"
    ) {
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
      if (!method)
        return message.channel.send(
          embeds.error(`An error was caught while getting the payment method.`)
        );
      information.payment = method;
    }

    /* Confirmation */
    await confirmFinalProduct(message, information);
  }
}

async function submitInformation(information: Information) {
  const doc = new GoogleSpreadsheet(settings.spreadsheet);
  await doc.useServiceAccountAuth(spreadsheetCreds);
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
      `${emojis[i]} ${toTitleCase(infoEntries[i])}`,
      `${
        Array.isArray(infoValues[i])
          ? infoValues[i].length
            ? infoValues[i].join("\n")
            : "N/A"
          : infoValues[i] || "N/A"
      }`,
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
  if (infoErrorReactions || infoErrorReactions.length) {
    for (let i = 0; i < infoErrorReactions.length; i++) {
      type informationProps = keyof Omit<Information, "images" | "apd">;
      const keyIndex = emojis.indexOf(infoErrorReactions[i].emoji.name);
      const changeVariable = infoEntries[keyIndex] as informationProps;
      const question = await messageQuestion(
        message,
        `What would you like to replease ${changeVariable} with.`
      );

      information[changeVariable] = question ? question.content : "N/A";
    }
  }

  if (question.deletable) question.delete();
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
  if (question.deletable) question.delete();

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
  const questionMessage = await message.channel.send(
    embeds.question(`What is the tow mileage? (Use numbers)`)
  );

  const messageCollector = await message.channel.awaitMessages(
    (x) =>
      x.author.id === message.author.id &&
      parseInt(x.content) &&
      !isNaN(parseInt(x.content)),
    { max: 1, time: 900000, errors: ["time"] }
  );

  if (questionMessage.deletable) await questionMessage.delete();
  if (messageCollector.first().deletable)
    await messageCollector.first().delete();

  if (!messageCollector.first()) return null;
  return messageCollector.first().content;
}

async function carDetails(message: Message, information: Information) {
  const question = await messageQuestion(
    message,
    `What is the vehicle year, make, model, and color? (ex. year/make/model/color)`
  );
  if (!question) return null;

  const content = question.content.split("/");
  if (content.length !== 4) return null;

  information.year = content[0];
  information.make = content[1];
  information.model = content[2];
  information.color = content[3];

  return information;
}

async function getImagesInformation(
  images: string[],
  information: Information
) {
  const visionClient = new ImageAnnotatorClient();

  const imgurImages = (
    await Promise.all(images.map(async (image) => await uploadImage(image)))
  ).filter((x): x is string => !!x);
  information.images = imgurImages;

  const imageToText = (
    await Promise.all(
      imgurImages.map(async (image) => {
        const answer = await visionClient.textDetection(image);
        return answer[0]?.fullTextAnnotation?.text;
      })
    )
  )
    .filter((x): x is string => !!x || x !== "")
    .map((x) => x.split("\n"))
    .flat();

  type informationProps = keyof Omit<Information, "images" | "apd">;
  for (let i = 0; i < imageToText.length; i++) {
    const currentResult = imageToText[i];
    const nextResult = imageToText[i + 1];

    for (const word of Object.keys(information)) {
      const formattedWord = word.replace("_", " ").toLowerCase();
      if (
        currentResult.toLowerCase().includes(formattedWord) &&
        currentResult.toLowerCase().includes(":")
      )
        information[word as informationProps] = nextResult;
    }
  }

  return information;
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

  if (!reactionCollector || !reactionCollector.size) return false;

  const messages = await message.channel.messages.fetch();
  const questionMessageIndex = messages
    .map((x) => x.id)
    .indexOf(questionMessage.id);
  const images = messages
    .array()
    .slice(0, questionMessageIndex)
    .filter(
      (x) =>
        x.author.id === message.author.id &&
        x.attachments &&
        x.attachments.first() &&
        x.attachments.first().url
    )
    .map((x) => x.attachments.first().url);

  if (questionMessage.deletable) await questionMessage.delete();
  return images.length ? images : null;
}

async function callType(message: Message) {
  const companyReaction = await optionReactQuestion(
    message,
    `What kind of call is this?`,
    ["AAA", "AZ", "NAFAR"]
  );
  if (!companyReaction) return null;

  return companyReaction;
}

import { Client, Message } from "discord.js";
import { ImageAnnotatorClient } from "@google-cloud/vision";

import { react, Information, uploadImage } from "../../util";
import embeds from "../../util/embed";
import Command from "..";
import settings from "../../settings";

export default class TestCommand extends Command {
  cmdName = "test";
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

    /* Get Images & Information */
    const images = await getImages(message);
    const imageInformation = await getImagesInformation(images, information);
    if (!imageInformation)
      return message.channel.send(
        embeds.error(
          `An error was caught while getting the image(s) information.`
        )
      );
    information = imageInformation;

    console.log(information);
  }
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

  if (!reactionCollector || !reactionCollector.size) return [];

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

  return images;
}

async function getImagesInformation(
  images: string[],
  information: Information
) {
  const ogInformation = information;
  const visionClient = new ImageAnnotatorClient();

  for (let i = 0; i < images.length; i++) {
    const imgurLink = await uploadImage(images[i]);
    if (!imgurLink) return null;
    information.images.push(imgurLink);

    const text = await visionClient.textDetection(imgurLink);
    console.log(text);
    if (!text[0] || !text[0].fullTextAnnotation) continue;

    const results = text[0].fullTextAnnotation.text
      .split("\n")
      // .filter((x) => !x.includes(": ") && x.includes(":"));

    console.log(
      results,
      results.filter((x) => !x.includes(": ") && x.includes(":"))
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
        .replace(":", "")
        .replace(" ", "_")
        .toLowerCase();

      console.log(result);

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

    return information;
  }
}

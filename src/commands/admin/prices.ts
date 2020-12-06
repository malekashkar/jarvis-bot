import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import AdminCommands from ".";
import { Groups } from "..";
import Global from "../../models/global";
import User from "../../models/user";
import { emojis, react } from "../../util";
import embeds from "../../util/embed";
import { confirmator, messageQuestion } from "../../util/questions";
import _ from "lodash";

export default class ModulePriceCommand extends AdminCommands {
  cmdName = "prices";
  description = "Change the prices of the modules";
  permission = "OWNER";

  async run(
    message: Message,
    userData: DocumentType<User>,
    guildData: DocumentType<Global>
  ) {
    const modules: Groups[] = _.sortedUniq(
      this.client.commands
        .map((x) => x.groupName)
        .filter((x) => !x.toLowerCase().includes("admin"))
    );
    const moduleEmojis = emojis.slice(0, modules.length);
    const modulesDescription = modules
      .map((x, i) => `${emojis[i]} ${x}`)
      .join("\n");

    const modulesQuestion = await message.channel.send(
      embeds.question(
        `Which module would you like to set the price for?\n\n${modulesDescription}`
      )
    );
    await react(modulesQuestion, moduleEmojis);

    const collector = await modulesQuestion.awaitReactions(
      (r, u) =>
        u.id === message.author.id && moduleEmojis.includes(r.emoji.name),
      {
        max: 1,
        time: 10 * 60 * 1000,
        errors: ["time"],
      }
    );

    if (modulesQuestion.deletable) await modulesQuestion.delete();
    if (collector?.first()) {
      const selectedModule =
        modules[moduleEmojis.indexOf(collector?.first().emoji.name)];

      const priceQuestion = await messageQuestion(
        message,
        `What should the price of the invoice be?`
      );
      const price = !isNaN(parseInt(priceQuestion.content))
        ? parseInt(priceQuestion.content)
        : null;
      if (!price)
        return message.channel.send(
          embeds.error(`Please provide a number value for the price!`)
        );

      const confirm = await confirmator(
        message,
        `Are you sure you would like to change the price of the module ${selectedModule} to $${price}?`
      );

      if (confirm) {
        guildData.modulePrices[selectedModule] = price;
        await guildData.save();

        return message.channel.send(
          embeds.normal(
            `Module Price Edited`,
            `The price of the module **${selectedModule}** has been set to **$${price}**!`
          )
        );
      }
    }
  }
}

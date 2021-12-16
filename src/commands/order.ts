import { DocumentType } from "@typegoose/typegoose";
import { CommandInteraction } from "discord.js";
import User from "../models/user";
import { emojis } from "../util";
import embeds from "../util/embed";
import coinbase from "coinbase-commerce-node";
import _ from "lodash";
import Order, { OrderModel } from "../models/order";
import Global from "../models/global";
import Command, { Groups } from ".";
import { SlashCommandBuilder } from "@discordjs/builders";

export default class OrderCommand extends Command {
  slashCommand = new SlashCommandBuilder()
    .setName("order")
    .setDescription("Order modules to use on Jarvis!");
    
  groupName: Groups = "default";

  async run(
    interaction: CommandInteraction,
    userData: DocumentType<User>,
    guildData: DocumentType<Global>
  ) {
    if (!(interaction.channel.type == "DM"))
      return interaction.reply({
        embeds: [embeds.error(`You can only use this command in our DM's!`)]
      });
    else if (userData.access)
      return interaction.reply({
        embeds: [embeds.error(`You already have access to this discord bot!`)]
      });

    const orderData = await OrderModel.findOne({
      userId: interaction.user.id,
    });
    if (orderData)
      return interaction.reply({
        embeds: [embeds.error(`You already have an order open!`)]
      });

    const modules: Groups[] = _.sortedUniq(
      this.client.commands
        .map((x) => x.groupName)
        .filter((x) => !x.toLowerCase().includes("admin"))
    );
    const moduleEmojis = emojis.slice(0, modules.length);
    const modulesDescription = modules
      .map((x, i) => `${emojis[i]} ${x}`)
      .join("\n");

    const modulesQuestion = await interaction.channel.send({
      embeds: [
        embeds.question(
          `Which modules would you like to install?\n\n${modulesDescription}`
        )
      ]
    });
    for (const emoji of moduleEmojis.concat("✅")) {
      await modulesQuestion.react(emoji);
    }

    const collector = await modulesQuestion.awaitReactions({
      filter: (r, u) => u.id === interaction.user.id && r.emoji.name === "✅",
      max: 1,
      time: 10 * 60 * 1000,
      errors: ["time"],
    });

    if (modulesQuestion.deletable) await modulesQuestion.delete();
    if (collector?.first()) {
      const selectedEmojis = modulesQuestion.reactions.cache
        .filter((x) => x.count === 2 && x.emoji.name !== "✅")
        .map((x) => x.emoji.name);
      const selectedModules = selectedEmojis.map(
        (x) => modules[moduleEmojis.indexOf(x)]
      );
      const selectedModulesDescription = selectedModules
        .map((x, i) => `${i + 1}. **${x}**`)
        .join("\n");
      const modulesTotalPrice = selectedModules
        .map((x) => guildData.modulePrices[x])
        .reduce((a, b) => a + b, 0);

      const charge = new coinbase.resources.Charge({
        name: interaction.user.username,
        description: `Order the modules ${selectedModules.join(
          ", "
        )} on Jarvis bot.`,
        pricing_type: "fixed_price",
        local_price: {
          amount: modulesTotalPrice.toString(),
          currency: "USD",
        },
      });
      try {
        await charge.save();

        const invoiceMessage = await interaction.channel.send({
          embeds: [
            embeds
            .normal(
              `Invoice Created`,
              `Please complete the payment here: ${charge.hosted_url}.\n\nSelected Modules:\n${selectedModulesDescription}`
            )
            .setFooter(`You must send the payment in within the next hour.`)
          ]
        });

        await OrderModel.create(
          new Order(
            interaction.user.id,
            charge.id,
            invoiceMessage.id,
            selectedModules as Groups[],
            new Date(Date.now() + 3600 * 1000)
          )
        );
      } catch (err) {
        console.log(err);
        return interaction.reply({
          embeds: [
            embeds.error(
              `There was an error creating your order, please contact administration!`
            )
          ]
        });
      }
    }
  }
}

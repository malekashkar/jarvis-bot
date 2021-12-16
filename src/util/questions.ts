import { CommandInteraction, Message, Role, User } from "discord.js";
import embeds from "./embed";
import { emojis as emojiList, toTitleCase } from "./index";

export async function confirmator(
  interaction: CommandInteraction,
  confirmationMessage: string,
  userId?: string
) {
  const reactionUserId = userId || interaction.user.id;

  await (interaction.deferred || interaction.replied ? interaction.editReply.bind(interaction) : interaction.reply.bind(interaction))({ 
    embeds: [embeds.question(confirmationMessage + `\nClick the ✅ below to confirm.`)] 
  });
  const questionMessage = await interaction.fetchReply();

  if(questionMessage instanceof Message) {
    for (const emoji of ["✅", "❎"]) {
      await questionMessage.react(emoji);
    }
  
    const reactionCollector = await questionMessage.awaitReactions({
      filter: (r, u) =>
        (u.id === reactionUserId && r.emoji.name === "✅") ||
        (u.id === reactionUserId && r.emoji.name === "❎"),
      max: 1,
      time: 900000,
      errors: ["time"]
    });
    
    return reactionCollector?.first()?.emoji?.name === "✅";
  }
}

export async function optionsQuestion(
  interaction: CommandInteraction,
  question: string,
  options: string[],
  userId?: string
) {
  const emojis = emojiList.slice(0, options.length);
  const reactionUserId = userId || interaction.user.id;
  const questionOptions = options.map((x, i) => `${emojis[i]} ${toTitleCase(x)}`);

  await (interaction.deferred || interaction.replied ? interaction.editReply.bind(interaction) : interaction.reply.bind(interaction))({ 
    embeds: [embeds.question(question + `\n\n${questionOptions.join("\n")}`)]
  });
  const questionMessage = await interaction.fetchReply();

  if(questionMessage instanceof Message) {
    for (const emoji of emojis) {
      await questionMessage.react(emoji);
    }
  
    const reactionCollector = await questionMessage.awaitReactions({
      filter: (r, u) => u.id === reactionUserId && emojis.includes(r.emoji.name),
      max: 1,
      time: 900000,
      errors: ["time"]
    });
  
    return reactionCollector
      ? options[emojis.indexOf(reactionCollector.first().emoji.name)]
      : null; 
  }
}

export async function optionReactionQuestion(
  interaction: CommandInteraction,
  question: string,
  reactions: string[],
  userId?: string
) {
  const reactionUserId = userId || interaction.user.id;

  await (interaction.deferred || interaction.replied ? interaction.editReply.bind(interaction) : interaction.reply.bind(interaction))({ 
    embeds: [embeds.question(question)]
  });
  const questionMessage = await interaction.fetchReply();

  if(questionMessage instanceof Message) {
    for (const emoji of reactions) {
      await questionMessage.react(emoji);
    }
  
    const reactionCollector = await questionMessage.awaitReactions({
      filter: (r, u) => u.id === reactionUserId && reactions.includes(r.emoji.name),
      max: 1,
      time: 900000,
      errors: ["time"]
    });
  
    return reactionCollector?.first()?.emoji?.name;
  }
}

export async function stringQuestion(
  interaction: CommandInteraction,
  question: string,
  userId?: string,
  options?: string[]
) {
  const reactionUserId = userId || interaction.user.id;

  await (interaction.deferred || interaction.replied ? interaction.editReply.bind(interaction) : interaction.reply.bind(interaction))({ 
    embeds: [embeds.question(question)]
  });
  const questionMessage = await interaction.fetchReply();

  if(questionMessage instanceof Message) {
    const messageCollector = await interaction.channel.awaitMessages({
      filter: (x) =>
        x.author.id === reactionUserId &&
        (options && options.length ? options.includes(x.content) : true),
      max: 1,
      time: 900000,
      errors: ["time"]
    });
  
    if (messageCollector?.first()?.deletable)
      await messageCollector.first().delete();
  
    return messageCollector?.first().content;
  }
}

export async function numberQuestion(
  interaction: CommandInteraction,
  question: string,
  userId?: string,
  options?: string[]
) {
  const reactionUserId = userId || interaction.user.id;

  await (interaction.deferred || interaction.replied ? interaction.editReply.bind(interaction) : interaction.reply.bind(interaction))({ 
    embeds: [embeds.question(question)]
  });
  const questionMessage = await interaction.fetchReply();

  if(questionMessage instanceof Message) {
    const messageCollector = await interaction.channel.awaitMessages({
      filter: (x) =>
        x.author.id === reactionUserId &&
        (options && options.length ? options.includes(x.content) : true) &&
        /[0-9]/gm.test(x.content),
      max: 1,
      time: 900000,
      errors: ["time"]
    });
  
    if (messageCollector?.first()?.deletable)
      await messageCollector.first().delete();
  
    return parseInt(messageCollector.first().content.match(/[0-9]/gm).join("")) > 100 
      ? 100
      : parseInt(messageCollector.first().content.match(/[0-9]/gm).join(""));
  }
}

export async function stringQuestionOrCancel(
  interaction: CommandInteraction,
  question: string,
  userId?: string,
  options?: string[]
) {
  const reactionUserId = userId || interaction.user.id;

  await (interaction.deferred || interaction.replied ? interaction.editReply.bind(interaction) : interaction.reply.bind(interaction))({ 
    embeds: [embeds.question(question)]
  });
  const questionMessage = await interaction.fetchReply();
  
  if(questionMessage instanceof Message) {
    await questionMessage.react("🚫");
    
    const messageCollector = interaction.channel.createMessageCollector({
      filter: (x) =>
        x.author.id === reactionUserId && (options && options.length ? options.includes(x.content) : true),
      max: 1,
      time: 900000, 
    });

    const reactionCollector = questionMessage.createReactionCollector({
      filter: (r, u) => r.emoji.name === "🚫" && u.id === interaction.user.id,
      max: 1,
      time: 900000,
    });

    const promise: Promise<null | string> = new Promise((res, rej) => {
      reactionCollector.on("collect", async(r, u) => {
        messageCollector.stop();
        await questionMessage.reactions.removeAll();
        res(null);
      });
      
      messageCollector.on("collect", async(m) => {
        reactionCollector.stop();
        await questionMessage.reactions.removeAll();
        if(m.deletable) await m.delete();
        res(m.content);
      });
    });

    await questionMessage.reactions.removeAll();
    return promise;
  }
}

export async function getTaggedUsers(
  interaction: CommandInteraction,
  question: string,
  userId?: string
) {
  const reactionUserId = userId || interaction.user.id;

  await (interaction.deferred || interaction.replied ? interaction.editReply.bind(interaction) : interaction.reply.bind(interaction))({ 
    embeds: [embeds.question(question)]
  });
  const questionMessage = await interaction.fetchReply();

  if(questionMessage instanceof Message) {
    const messageCollector = await interaction.channel.awaitMessages({
      filter: (x) =>
        x.author.id === reactionUserId &&
        x.mentions.users.size > 0,
      max: 1,
      time: 900000,
      errors: ["time"]
    });
  
    if (messageCollector.first().deletable)
      await messageCollector.first().delete();
  
    return messageCollector.first().mentions.users;
  }
}

export async function getTaggedUsersOrCancel(
  interaction: CommandInteraction,
  question: string,
  userId?: string
) {  
  const reactionUserId = userId || interaction.user.id;
  await (interaction.deferred || interaction.replied ? interaction.editReply.bind(interaction) : interaction.reply.bind(interaction))({ 
    embeds: [embeds.question(question)]
  });
  const questionMessage = await interaction.fetchReply();

  if(questionMessage instanceof Message) {
    await questionMessage.react("🚫");
    
    const messageCollector = interaction.channel.createMessageCollector({
      filter: (x) =>
        x.author.id === reactionUserId && x.mentions.users.size > 0,
      max: 1,
      time: 900000, 
    });

    const reactionCollector = questionMessage.createReactionCollector({
      filter: (r, u) => r.emoji.name === "🚫" && u.id === interaction.user.id,
      max: 1,
      time: 900000,
    });

    const promise: Promise<null | User[]> = new Promise((res, rej) => {
      reactionCollector.on("collect", async(r, u) => {
        messageCollector.stop();
        await questionMessage.reactions.removeAll();
        res(null);
      });
      
      messageCollector.on("collect", async(m) => {
        reactionCollector.stop();
        await questionMessage.reactions.removeAll();
        if(m.deletable) await m.delete();
        res(Array.from(m.mentions.users.values()));
      });
    });

    return promise;
  }
}

export async function getTaggedRoles(
  interaction: CommandInteraction,
  question: string,
  userId?: string
) {
  const reactionUserId = userId || interaction.user.id;

  await (interaction.deferred || interaction.replied ? interaction.editReply.bind(interaction) : interaction.reply.bind(interaction))({ 
    embeds: [embeds.question(question)]
  });
  const questionMessage = await interaction.fetchReply();

  if(questionMessage instanceof Message) {
    const messageCollector = await interaction.channel.awaitMessages({
      filter: (x) =>
        x.author.id === reactionUserId &&
        x.mentions.roles.size > 0,
      max: 1,
      time: 900000,
      errors: ["time"]
    });
  
    if (messageCollector.first().deletable)
      await messageCollector.first().delete();
  
    return messageCollector.first().mentions.roles;
  }
}

export async function getTaggedRolesOrCancel(
  interaction: CommandInteraction,
  question: string,
  userId?: string
) {
    const reactionUserId = userId || interaction.user.id;

    await (interaction.deferred || interaction.replied ? interaction.editReply.bind(interaction) : interaction.reply.bind(interaction))({ 
      embeds: [embeds.question(question)]
    });
    const questionMessage = await interaction.fetchReply();
  
    if(questionMessage instanceof Message) {
      await questionMessage.react("🚫");
      
      const messageCollector = interaction.channel.createMessageCollector({
        filter: (x) =>
          x.author.id === reactionUserId && x.mentions.roles.size > 0,
        max: 1,
        time: 900000, 
      });

      const reactionCollector = questionMessage.createReactionCollector({
        filter: (r, u) => r.emoji.name === "🚫" && u.id === interaction.user.id,
        max: 1,
        time: 900000,
      });

      const promise: Promise<null | Role[]> = new Promise((res, rej) => {
        reactionCollector.on("collect", async(r, u) => {
          messageCollector.stop();
          await questionMessage.reactions.removeAll();
          res(null);
        });
        
        messageCollector.on("collect", async(m) => {
          reactionCollector.stop();
          await questionMessage.reactions.removeAll();
          res(Array.from(m.mentions.roles.values()));
      });
    });

    return promise;
  }
}

export async function getTaggedChannels(
  interaction: CommandInteraction,
  question: string,
  userId?: string
) {
  const reactionUserId = userId || interaction.user.id;

  await (interaction.deferred || interaction.replied ? interaction.editReply.bind(interaction) : interaction.reply.bind(interaction))({ 
    embeds: [embeds.question(question)]
  });
  const questionMessage = await interaction.fetchReply();

  if(questionMessage instanceof Message) {
    const messageCollector = await interaction.channel.awaitMessages({
      filter: (x) =>
        x.author.id === reactionUserId &&
        x.mentions.channels.size > 0,
      max: 1,
      time: 900000,
      errors: ["time"]
    });
  
    if (messageCollector.first().deletable)
      await messageCollector.first().delete();
  
    return messageCollector.first().mentions.channels;
  }
}

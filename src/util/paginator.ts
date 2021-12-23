import {
    CommandInteraction,
    Message,
    MessageEmbed,
    MessageOptions,
    SplitOptions,
  } from "discord.js";
  import { EventEmitter } from "events";
  
  const availableEmojis = {
    first: "⏮️",
    prev: "◀️",
    stop: "⏹️",
    next: "▶️",
    last: "⏭️",
  };
  
  const availableEmojiStrings = Object.values(availableEmojis);
  
  export type SendMethod =
    | ((
        options:
          | MessageOptions
          | (MessageOptions & { split?: false })
      ) => Promise<Message>)
    | ((
        options:
          | (MessageOptions & {
              split: true | SplitOptions;
              content: string;
            })
      ) => Promise<Message[]>)
    | ((
        content: string,
        options?:
          | MessageOptions
          | (MessageOptions & { split?: false })
      ) => Promise<Message>)
    | ((
        content: string,
        options?: MessageOptions & { split: true | SplitOptions }
      ) => Promise<Message[]>);
  
  export declare interface Paginator {
    on(event: "start", listener: () => void): this;
    on(event: "first", listener: () => void): this;
    on(event: "prev", listener: () => void): this;
    on(event: "stop", listener: () => void): this;
    on(event: "next", listener: () => void): this;
    on(event: "last", listener: () => void): this;
  
    emit(event: "start"): boolean;
    emit(event: "first"): boolean;
    emit(event: "prev"): boolean;
    emit(event: "stop"): boolean;
    emit(event: "next"): boolean;
    emit(event: "last"): boolean;
  }
  
  export class Paginator extends EventEmitter {
    public sentMessage: Message;
    public currentPageIndex: number;
  
    constructor(
      public interaction: CommandInteraction,
      public pageCount: number,
      private pageExtractor: (pageIndex: number) => Promise<MessageEmbed>,
      initialPageIndex = 0,
      public sendMethod: SendMethod = interaction.deferred || interaction.replied ? interaction.editReply.bind(interaction) : interaction.reply.bind(interaction)
    ) {
      super();
      this.currentPageIndex = initialPageIndex;
    }
  
    async getDecoratedEmbed(pageIndex: number) {
      const embed = await this.pageExtractor(pageIndex);
      const embedPage: MessageEmbed =
        embed instanceof MessageEmbed ? embed : new MessageEmbed(embed);
  
      if (
        embedPage.footer &&
        (embedPage.footer.text || embedPage.footer.iconURL)
      ) {
        if (/CURRENT_PAGE/g.test(embedPage.footer.text)) {
          embedPage.footer.text = embedPage.footer.text.replace(
            /CURRENT_PAGE/g,
            (pageIndex + 1).toString()
          );
        }
        if (/TOTAL_PAGES/g.test(embedPage.footer.text)) {
          embedPage.footer.text = embedPage.footer.text.replace(
            /TOTAL_PAGES/g,
            this.pageCount.toString()
          );
        }
        return embedPage;
      }

      if (embedPage.title) {
        if (/CURRENT_PAGE/g.test(embedPage.title)) {
          embedPage.title = embedPage.title.replace(
            /CURRENT_PAGE/g,
            (pageIndex + 1).toString()
          );
        }
        if (/TOTAL_PAGES/g.test(embedPage.title)) {
          embedPage.title = embedPage.title.replace(
            /TOTAL_PAGES/g,
            this.pageCount.toString()
          );
        }

        return embedPage;
      }
      
      return embedPage.setFooter(`Page ${pageIndex + 1} of ${this.pageCount}`);
    }
  
    async start() {
      const interaction = this.interaction;
      await (interaction.deferred || interaction.replied ? interaction.editReply.bind(interaction) : interaction.reply.bind(interaction))({ 
          embeds: [await this.getDecoratedEmbed(this.currentPageIndex)]
      });
      this.sentMessage = await this.interaction.fetchReply() as Message;

      if (this.pageCount > 1) {
        Promise.all([
          availableEmojiStrings.map((x) => this.sentMessage.react(x)),
        ]);
        const reactionCollector = this.sentMessage.createReactionCollector({
            filter: (reaction, user) => {
                return (
                  user.id === this.interaction.user.id &&
                  availableEmojiStrings.includes(reaction.emoji.name) &&
                  !(reaction.me && reaction.users.cache.size === 1)
                );
              },
              time: 60 * 1000,
              max: this.pageCount * 5
        });
        this.emit("start");
        reactionCollector.on("end", () => {
          if (
            this.sentMessage.guild &&
            this.sentMessage.guild.me &&
            this.sentMessage.guild.me.permissions.has("MANAGE_MESSAGES")
          ) {
            this.sentMessage.reactions.removeAll();
          }
        });
        reactionCollector.on("collect", async (reaction) => {
          reactionCollector.resetTimer({ time: 60000 });
          if (
            this.sentMessage.guild &&
            this.sentMessage.guild.me.permissions.has("MANAGE_MESSAGES")
          ) {
            (await reaction.users.fetch()).forEach((user) => {
              if (user.id !== this.interaction.client.user.id)
                reaction.users.remove(user);
            });
          }
          if (reaction.emoji.name === availableEmojis.first) {
            if (this.currentPageIndex !== 0) {
              this.currentPageIndex = 0;
              this.sentMessage.edit({
                  embeds: [await this.getDecoratedEmbed(this.currentPageIndex)]
              });
              this.emit("first");
            }
          } else if (reaction.emoji.name === availableEmojis.prev) {
            this.currentPageIndex--;
            if (this.currentPageIndex < 0)
              this.currentPageIndex = this.pageCount - 1;
              this.sentMessage.edit({
                  embeds: [await this.getDecoratedEmbed(this.currentPageIndex)]
              });
            this.emit("prev");
          } else if (reaction.emoji.name === availableEmojis.stop) {
            reactionCollector.stop("stopped by user");
            this.emit("stop");
          } else if (reaction.emoji.name === availableEmojis.next) {
            this.currentPageIndex++;
            if (this.currentPageIndex >= this.pageCount) {
              this.currentPageIndex = 0;
            }
            this.sentMessage.edit({
                embeds: [await this.getDecoratedEmbed(this.currentPageIndex)]
            });
            this.emit("next");
          } else if (reaction.emoji.name === availableEmojis.last) {
            if (this.currentPageIndex !== this.pageCount - 1) {
              this.currentPageIndex = this.pageCount - 1;
              this.sentMessage.edit({
                embeds: [await this.getDecoratedEmbed(this.currentPageIndex)]
            });
              this.emit("last");
            }
          }
        });
      }
      return this.sentMessage;
    }
  }
  
  export default Paginator;
import { getModelForClass, prop } from "@typegoose/typegoose";

export type PingType = "EVERYONE" | "HERE" | "MEMBER";

export class GhostPing {
  @prop()
  type: PingType;

  @prop()
  interval?: number;

  @prop()
  nextPing?: number;

  constructor(type: PingType, interval?: number, nextPing?: number) {
    this.type = type;
    this.interval = interval;
    this.nextPing = nextPing;
  }
}

export class Roles {
  @prop()
  role: string;

  @prop({ type: String })
  channels: string[];

  @prop()
  autorole: boolean;

  @prop()
  cooldownTime: number;

  constructor(
    role: string,
    channels: string[],
    autorole: boolean,
    cooldownTime: number
  ) {
    this.role = role;
    this.channels = channels;
    this.autorole = autorole;
    this.cooldownTime = cooldownTime;
  }
}

export class Guild {
  @prop()
  guildId!: string;

  @prop({ type: Roles, default: [] })
  roles?: Roles[];

  @prop({ type: GhostPing, default: {} })
  ghostPing: GhostPing;
}

export const GuildModel = getModelForClass(Guild);

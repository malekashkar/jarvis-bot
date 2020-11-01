import { getModelForClass, prop } from "@typegoose/typegoose";

export class Reminder {
  @prop({ required: true })
  id: number;

  @prop({ required: true })
  guildId: string;

  @prop({ required: true })
  name: string;

  @prop({ required: true })
  message: string;

  constructor(id: number, guildId: string, name: string, message: string) {
    this.id = id;
    this.guildId = guildId;
    this.name = name;
    this.message = message;
  }
}

export default class User {
  @prop({ required: true })
  userId: string;

  @prop({ required: true, default: false })
  access?: boolean;

  @prop({ required: true, default: null })
  usedCode?: string;

  @prop({ required: false, type: Reminder })
  reminders?: Reminder[];
}

export const UserModel = getModelForClass(User);

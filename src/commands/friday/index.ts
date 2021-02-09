import Command, { Groups } from "..";

export default abstract class FridayCommands extends Command {
  groupName: Groups = "friday";
}
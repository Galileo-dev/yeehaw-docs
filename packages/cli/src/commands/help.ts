import { brightWhite, cyan, print, red, type Props } from "bluebun";
import banner from "../assets/banner";

export default {
  name: "help",
  description: "The best CLI ever",
  run: async (props: Props) => {
    const { first } = props;

    print("");
    print(brightWhite(banner));
    print("");
    print(red("Welcome to the Yeehaw Doc's CLI!"));

    print("");
    print("To get started, run:");
    print("");
    print("  yeehaw register");
    print("");

    if (first) {
      print(
        `I don't know what "yeehaw ${cyan(
          first
        )}" is. Try "yeehaw giddeup" instead.`
      );
    }
  },
};

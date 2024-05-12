import { Props } from "bluebun";

export default {
  name: "yeehaw",
  description: "Default command",
  run: async (props: Props) => {
    import("./help").then((mod) => mod.default.run(props));
  },
};

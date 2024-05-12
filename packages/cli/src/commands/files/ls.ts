import { print, type Props } from "bluebun";

export default {
  name: "ls",
  description: "List files available for download",
  run: async (props: Props) => {
    const { first } = props;

    print("So you want to ls, huh?");
  },
};

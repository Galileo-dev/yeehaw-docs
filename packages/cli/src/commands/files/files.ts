import { print, type Props } from "bluebun";

export default {
  name: "files",
  description: "Download a file",
  run: async (props: Props) => {
    const { first } = props;

    print("So you want to register, huh?");
  },
};

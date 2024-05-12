import { print, type Props } from "bluebun";
import { ApiService } from "../../services/api";
import { AuthService } from "../../services/auth";

export default {
  name: "register",
  description: "Register a new account",
  run: async (props: Props) => {
    const { first } = props;

    const apiService = new ApiService("http://localhost:3001", fetch);
    const authService = new AuthService(apiService);

    authService.register();

    print("So you want to register, huh?");
  },
};

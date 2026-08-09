import { MantineProvider } from "@mantine/core";
import { etalCssVariablesResolver, etalTheme } from "./theme";

function StyleControl({ children }) {
  return (
    <MantineProvider
      theme={etalTheme}
      cssVariablesResolver={etalCssVariablesResolver}
      withCssVariables
      defaultColorScheme="dark"
      forceColorScheme="dark"
    >
      {children}
    </MantineProvider>
  );
}

export default StyleControl;

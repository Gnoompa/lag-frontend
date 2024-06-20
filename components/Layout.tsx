import usePasscode from "@/features/usePasscode";

import { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect } from "react";

export const Layout: React.FC<AppProps> = ({ Component, pageProps }) => {
  const router = useRouter();

  useEffect(() => {
    console.log(router)
  }, [router])

  const { hasEnteredPasscode, PasscodeModal } = usePasscode(process.env.NEXT_PUBLIC_PASSCODE!);

  return (
    <>
      <Component {...pageProps} />
      {hasEnteredPasscode === false && <PasscodeModal />}
    </>
  );
};

export default Layout;

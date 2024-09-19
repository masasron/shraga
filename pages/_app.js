import "styles.scss";
import Head from "next/head";
import { GlobalContextProvider } from "GlobalContext";
export default function App({ Component, pageProps }) {
  return <GlobalContextProvider>
    <Head>
      <title>Shraga</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    </Head>
    <Component {...pageProps} />
  </GlobalContextProvider>;
}

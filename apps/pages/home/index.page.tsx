import Head from "next/head";
import Home from "./components/Home";

const IndexPage = () => (
  <>
    <Head>
      <title>佛曰</title>
      <meta name="description" content="年轻人都在玩的解压神器，给你的心灵做个SPA" />
      <link rel="icon" href="http://rsodxk68s.hd-bkt.clouddn.com/1024.png" />
    </Head>
    <Home />
  </>
)

export default IndexPage

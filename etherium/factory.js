import web3 from "./web3";
import CampaignFactory from "./build/CampaignFactory.json";

const instance = new web3.eth.Contract(
  JSON.parse(CampaignFactory.interface),
  "0x94df5843D0Ac08c1A31eFf474c903d9921C38f9c"
);

export default instance;

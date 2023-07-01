const assert = require("assert");
const ganache = require("ganache-cli");
const { Web3 } = require("web3"); // Web3 is a constructor
const web3 = new Web3(ganache.provider()); // web3 is an instance of Web3
const compiledFactory = require("../etherium/build/CampaignFactory.json");
const compiledCampaign = require("../etherium/build/Campaign.json");

let accounts;
let factory;
let campaignAddress;
let campaign;

// beforeEach is a mocha function that runs before each test
beforeEach(async () => {
  // Get a list of all accounts
  accounts = await web3.eth.getAccounts();
  // Use one of those accounts to deploy the contract
  // Note: the contract is not deployed yet
  factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
    .deploy({ data: compiledFactory.bytecode })
    .send({ from: accounts[0], gas: "1000000" });
  // Use the factory to create a campaign
  // Note: the campaign is not deployed yet
  await factory.methods.createCampaign("100").send({
    from: accounts[0],
    gas: "1000000",
  });
  // Get the address of the campaign
  // [campaignAddress] is used to get the first element of the array returned by getDeployedCampaigns()
  [campaignAddress] = await factory.methods.getDeployedCampaigns().call();
  // Get the campaign
  campaign = await new web3.eth.Contract(
    JSON.parse(compiledCampaign.interface),
    campaignAddress
  );
});

describe("Campaigns", () => {
  // Test that the factory and campaign are deployed
  it("deploys a factory and a campaign", () => {
    assert.ok(factory.options.address);
    assert.ok(campaign.options.address);
  });
  // Test that the caller is the manager of the campaign
  it("marks caller as the campaign manager", async () => {
    const manager = await campaign.methods.manager().call();
    assert.strictEqual(accounts[0], manager);
  });
  // Test that people can contribute money and become approvers
  it("allows people to contribute money and become approvers", async () => {
    await campaign.methods.contribute().send({
      from: accounts[1],
      value: "200",
    });
    const isContributor = await campaign.methods.approvers(accounts[1]).call();
    assert(isContributor);
  });
  // Test that people cannot contribute money less than the minimum
  it("requires a minimum contribution", async () => {
    try {
      await campaign.methods.contribute().send({
        from: accounts[1],
        value: "200",
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });
  // Test that the manager can make a payment request
  it("allows a manager to make a payment request", async () => {
    await campaign.methods
      .createRequest("Buy batteries", "100", accounts[1])
      .send({
        from: accounts[0],
        gas: "1000000",
      });
    const request = await campaign.methods.requests(0).call();
    assert.strictEqual("Buy batteries", request.description);
  });
  // Test that a request can be processed
  it("processes requests", async () => {
    // Contribute money
    await campaign.methods.contribute().send({
      from: accounts[0],
      value: web3.utils.toWei("10", "ether"),
    });
    // Create a request
    await campaign.methods
      .createRequest("A", web3.utils.toWei("5", "ether"), accounts[1])
      .send({
        from: accounts[0],
        gas: "1000000",
      });
    // Approve the request
    await campaign.methods.approvalRequest(0).send({
      from: accounts[0],
      gas: "1000000",
    });
    // Finalize the request
    await campaign.methods.finalizeRequest(0).send({
      from: accounts[0],
      gas: "1000000",
    });
    // Get the balance of the recipient
    let balance = await web3.eth.getBalance(accounts[1]);
    balance = web3.utils.fromWei(balance, "ether");
    balance = parseFloat(balance);
    // Check that the balance is 105
    assert(balance > 104);
  });
});

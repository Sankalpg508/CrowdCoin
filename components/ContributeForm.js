import React, { Component } from "react";
import { Form, Button, Input, Message } from "semantic-ui-react";
import Campaign from "../etherium/campaign";
import web3 from "../etherium/web3";
import { Router } from "../routes";
class ContributeForm extends Component {
  state = {
    value: "",
    errorMessage: "",
    loading: false,
  };
  onSubmit = async (event) => {
    event.preventDefault();
    const campaign = Campaign(this.props.address);
    this.setState({ loading: true, errorMessage: "" });
    try {
      const accounts = await web3.eth.getAccounts();
      await campaign.methods.contribute().send({
        from: accounts[0],
        value: web3.utils.toWei(this.state.value, "ether"),
      });
      Router.replaceRoute(`/campaigns/${this.props.address}`);
    } catch (err) {
      this.setState({ errorMessage: err.message });
      console.log(err);
    }
    this.setState({ loading: false, value: "" });
  };
  render() {
    return (
      <Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
        <h3>Contribute Form!</h3>
        <Form.Field>
          <label>Amount to Contribute</label>
          <Input
            value={this.state.value}
            onChange={(event) => this.setState({ value: event.target.value })}
            label="ether"
            labelPosition="right"
          />
        </Form.Field>
        <Message error header="OOPS!" content={this.state.errorMessage} />
        <Button primary loading={this.state.loading}>
          Contribute!
        </Button>
      </Form>
    );
  }
}
export default ContributeForm;

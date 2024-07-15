import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { ethers } from "ethers";
import parseRevertReason from "../functions/functions.js";

const Create = ({ provider, dao, setIsLoading }) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);
  const [address, setAddress] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);

  /**
  function parseRevertReason(errorMessage) {
    const regex = /reverted with reason string '([^']+)'/;
    const match = errorMessage.match(regex);
  
    if (match && match[1]) {
      return match[1];
    } else {
      return errorMessage;
    }
  }
     */

  const createHandler = async (e) => {
    e.preventDefault();

    //if (name.length < 5) {
      //window.alert(`User rejected or transaction reverted: \nProposal name must be at least 5 characters long`);
      //return;
    //}
    
    setIsWaiting(true);

    try {
      const signer = await provider.getSigner();
      const formattedAmount = ethers.utils.parseUnits(
        amount.toString(),
        "ether"
      );

      const transaction = await dao
        .connect(signer)
        .createProposal(name, formattedAmount, address);
      await transaction.wait();
    } catch (error) {
      window.alert(`User rejected or transaction reverted: \n${parseRevertReason(error.reason)}`);
    } finally {
      setIsWaiting(false);
      setIsLoading(false);
    }
  };

  return (
    <Form onSubmit={createHandler}>
      <Form.Group style={{ maxWidth: "450px", margin: "50px auto" }}>
        <Form.Control
          type="text"
          placeholder="Enter name"
          className="my-2"
          onChange={(e) => setName(e.target.value)}
        />
        <Form.Control
          type="number"
          placeholder="Enter amount"
          className="my-2"
          onChange={(e) => setAmount(e.target.value)}
        />
        <Form.Control
          type="text"
          placeholder="Enter address"
          className="my-2"
          onChange={(e) => setAddress(e.target.value)}
        />
        {isWaiting ? (
          <Spinner
            animation="border"
            style={{ display: "block", margin: "0 auto" }}
          />
        ) : (
          <Button variant="primary" type="submit" style={{ width: "100%" }}>
            Create Proposal
          </Button>
        )}
      </Form.Group>
    </Form>
  );
};

export default Create;

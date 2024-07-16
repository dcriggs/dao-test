import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import { ethers } from "ethers";
import { useState, useEffect } from "react";

const Proposals = ({ provider, dao, proposals, quorum, setIsLoading }) => {
  const [hasVoted, setHasVoted] = useState({});
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);

  const checkIfVoted = async (proposalId) => {
    try {
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const voted = await dao.hasVoted(userAddress, proposalId);
      setHasVoted((prevState) => ({ ...prevState, [proposalId]: voted }));
    } catch (error) {
      console.error("Error checking vote status:", error);
    }
  };

  const fetchBalance = async (address) => {
    try {
      const balance = await provider.getBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
      return "0.0";
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        for (let proposal of proposals) {
          await checkIfVoted(proposal.id);
          const balance = await fetchBalance(proposal.recipient);
          setBalances((prevState) => ({
            ...prevState,
            [proposal.id]: balance,
          }));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [proposals]);

  const voteHandler = async (id) => {
    try {
      const signer = await provider.getSigner();
      const transaction = await dao.connect(signer).vote(id);
      await transaction.wait();
      setHasVoted((prevState) => ({ ...prevState, [id]: true }));
    } catch {
      window.alert("User rejected or transaction reverted");
    }

    setIsLoading(true);
  };

  const downvoteHandler = async (id) => {
    try {
      const signer = await provider.getSigner();
      const transaction = await dao.connect(signer).downvote(id);
      await transaction.wait();
      setHasVoted((prevState) => ({ ...prevState, [id]: true }));
    } catch {
      window.alert("User rejected or transaction reverted");
    }

    setIsLoading(true);
  };

  const finalizeHandler = async (id) => {
    try {
      const signer = await provider.getSigner();
      const transaction = await dao.connect(signer).finalizeProposal(id);
      await transaction.wait();
    } catch {
      window.alert("User rejected or transaction reverted");
    }

    setIsLoading(true);
  };

  return (
    <Table striped="columns" bordered hover responsive>
      <thead>
        <tr>
          <th>#</th>
          <th>Proposal Name</th>
          <th>Proposal Description</th>
          <th>Recipient Address</th>
          <th>Recipient Balance (ETH)</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Total Votes</th>
          <th>Cast Vote</th>
          <th>Finalize</th>
        </tr>
      </thead>
      <tbody>
        {proposals.map((proposal, index) => (
          <tr key={index}>
            <td>{proposal.id.toString()}</td>
            <td>{proposal.name}</td>
            <td>{proposal.description}</td>
            <td>{proposal.recipient}</td>
            <td>{balances[proposal.id] || "Loading..."}</td>
            <td>{ethers.utils.formatUnits(proposal.amount, "ether")} ETH</td>
            <td>{proposal.finalized ? "Approved" : "In Progress"}</td>
            <td>{proposal.votes.toString()}</td>
            <td>
              {!proposal.finalized && (
                <>
                  {!loading && !hasVoted[proposal.id] && (
                    <>
                      <Button
                        variant="success"
                        style={{ width: "100%" }}
                        onClick={() => voteHandler(proposal.id)}
                      >
                        Vote
                      </Button>
                      <br />
                      <Button
                        variant="danger"
                        style={{ width: "100%" }}
                        onClick={() => downvoteHandler(proposal.id)}
                      >
                        Downvote
                      </Button>
                    </>
                  )}
                </>
              )}
            </td>
            <td>
              {!proposal.finalized && proposal.votes > quorum && (
                <Button
                  variant="primary"
                  style={{ width: "100%" }}
                  onClick={() => finalizeHandler(proposal.id)}
                >
                  Finalize
                </Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default Proposals;

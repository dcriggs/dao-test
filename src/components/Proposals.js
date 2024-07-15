import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import { ethers } from "ethers";
import { useState, useEffect } from "react";

const Proposals = ({ provider, dao, proposals, quorum, setIsLoading }) => {
  const [hasVoted, setHasVoted] = useState({});
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

  useEffect(() => {
    const fetchVotingStatus = async () => {
      try {
        for (let proposal of proposals) {
          await checkIfVoted(proposal.id);
        }
      } catch (error) {
        console.error("Error fetching voting status:", error);
      }
      setLoading(false);
    };

    fetchVotingStatus();
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
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>#</th>
          <th>Proposal Name</th>
          <th>Recipient Address</th>
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
            <td>{proposal.recipient}</td>
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

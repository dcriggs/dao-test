// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract DAO {
    address public owner;
    Token public token;
    uint256 public quorum;
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping(uint256 => bool)) votes;

    struct Proposal {
        uint256 id;
        string name;
        uint256 amount;
        address payable recipient;
        int256 votes;
        bool finalized;
    }

    event Propose(
        uint256 id,
        uint256 amount,
        address recipient,
        address creator
    );
    event Vote(uint256 id, address holder);
    event Finalize(uint256 id);

    constructor(Token _token, uint256 _quorum) {
        owner = msg.sender;
        token = _token;
        quorum = _quorum;
    }

    // Allow contract to receive ether
    receive() external payable {}

    modifier onlyHolder() {
        require(
            token.balanceOf(msg.sender) > 0,
            "Must be a token holder"
        );
        _;
    }

    function createProposal(
        string memory _name,
        uint256 _amount,
        address payable _recipient
    ) external onlyHolder {
        require(address(this).balance >= _amount, "Insufficient balance in DAO");

        proposalCount++;

        proposals[proposalCount] = Proposal(
            proposalCount,
            _name,
            _amount,
            _recipient,
            0,
            false
        );

        emit Propose(
            proposalCount,
            _amount,
            _recipient,
            msg.sender
        );
    }

    function vote(uint256 _id) external onlyHolder {
        // Fetch proposal from mapping by id
        Proposal storage proposal = proposals[_id];

        // Don't let holders vote twice
        require(!votes[msg.sender][_id]);

        // update votes
        proposal.votes += int256(token.balanceOf(msg.sender));

        // track that user has voted
        votes[msg.sender][_id] = true;

        // emit event
        emit Vote(_id, msg.sender);
    }

    function downvote(uint256 _id) external onlyHolder {
        // Fetch proposal from mapping by id
        Proposal storage proposal = proposals[_id];

        // Don't let holders vote twice
        require(!votes[msg.sender][_id]);

        // update votes
        proposal.votes -= int256(token.balanceOf(msg.sender));

        // track that user has voted
        votes[msg.sender][_id] = true;

        // emit event
        emit Vote(_id, msg.sender);
    }

    function finalizeProposal(uint256 _id) external onlyHolder {
        // Fetch proposal from mapping by id
        Proposal storage proposal = proposals[_id];

        // Ensure proposal is not already finalized
        require(proposal.finalized == false, "proposal already finalized");

        // Check that proposal has enough votes
        require(proposal.votes >= int256(quorum), "must reach quorum to finalize proposal");

        // Check that the contract has enough ether
        require(address(this).balance >= proposal.amount);
        
        // Transfer the funds to recipient
        (bool sent, ) = proposal.recipient.call{value: proposal.amount}("");
        require(sent);

        // Mark proposal as finalized
        proposal.finalized = true;
        emit Finalize(_id);
    }
}

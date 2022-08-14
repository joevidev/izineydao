import React, { useEffect, useState } from "react";
import "./pages.css";
import { TabList, Tab, Widget, Tag, Table, Form } from "web3uikit";
import { Link } from "react-router-dom";
import {
  useMoralis,
  useMoralisWeb3Api,
  useWeb3ExecuteFunction,
} from "react-moralis";

const Home = () => {
  const [passRate, setPassRate] = useState(0);
  const [totalP, setTotalP] = useState(0);
  const [counted, setCounted] = useState(0);
  const [voters, setVoters] = useState(0);
  const { Moralis, isInitialized } = useMoralis();
  const [proposals, setProposals] = useState();
  const Web3Api = useMoralisWeb3Api();
  const [sub, setSub] = useState();
  const contractProcessor = useWeb3ExecuteFunction();

  async function createProposal(newProposal, votersMax, deadline) {
    let options = {
      contractAddress: "0x1Bf6BF84988BA964aE6742512a7b7eeb96AA8025",
      functionName: "createProposal",
      abi: [
        {
          inputs: [
            {
              internalType: "string",
              name: "_description",
              type: "string",
            },
            {
              internalType: "uint256",
              name: "_voterMax",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "_dealine",
              type: "uint256",
            },
          ],
          name: "createProposal",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
      params: {
        _description: newProposal,
        _voterMax: votersMax,
        _dealine: deadline,
      },
    };

    await contractProcessor.fetch({
      params: options,
      onSuccess: () => {
        console.log("Proposal Succesful");
        setSub(false);
      },
      onError: (error) => {
        alert(error.data.message);
        setSub(false);
      },
    });
  }

  async function getStatus(proposalId) {
    const ProposalCounts = Moralis.Object.extend("ProposalCounts");
    const query = new Moralis.Query(ProposalCounts);
    query.equalTo("uid", proposalId);
    const result = await query.first();
    if (result !== undefined) {
      if (result.attributes.passed) {
        return { color: "green", text: "✅ Passed" };
      } else {
        return { color: "red", text: "⛔ Rejected" };
      }
    } else {
      return { color: "blue", text: "⏲ Ongoing" };
    }
  }

  useEffect(() => {
    if (isInitialized) {
      async function getProposals() {
        const Proposals = Moralis.Object.extend("Proposals");
        const query = new Moralis.Query(Proposals);
        query.descending("uid_decimal");
        const results = await query.find();
        const table = await Promise.all(
          results.map(async (e) => [
            e.attributes.uid,
            e.attributes.description,
            <Link
              to="/proposal"
              state={{
                description: e.attributes.description,
                color: (await getStatus(e.attributes.uid)).color,
                text: (await getStatus(e.attributes.uid)).text,
                id: e.attributes.uid,
                proposer: e.attributes.proposer,
              }}
            >
              <Tag
                color={(await getStatus(e.attributes.uid)).color}
                text={(await getStatus(e.attributes.uid)).text}
              />
            </Link>,
          ])
        );
        setProposals(table);
        setTotalP(results.length);
      }

      async function getPassRate() {
        const ProposalCounts = Moralis.Object.extend("ProposalCounts");
        const query = new Moralis.Query(ProposalCounts);
        const results = await query.find();
        let votesUp = 0;

        results.forEach((e) => {
          if (e.attributes.passed) {
            votesUp++;
          }
        });

        setCounted(results.length);
        setPassRate((votesUp / results.length) * 100);
      }

      const fetchTokenIdOwners = async () => {
        /*const options = {
           address: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
           token_Amount: "10000000000000000",
           chain: "goerli",
         };
         const tokenIdOwners = await Web3Api.token.getAllTokenIds(options);
         const addresses = tokenIdOwners.result.map((e) => e.owner_of);
         setVoters(addresses);*/

        const HolderOfWETH_0_01 = Moralis.Object.extend("HoldersOfWETH");
        const query = new Moralis.Query(HolderOfWETH_0_01);
        const results = await query.find();
        const addresses = results.map((e) => e.attributes.dst);
        setVoters(addresses);
      };

      fetchTokenIdOwners();
      getProposals();
      getPassRate();
    }
  }, [isInitialized]);

  return (
    <>
      <div className="content">
        <TabList
          defaultActiveKey={1}
          tabStyle="bulbUnion"
          className="tabHeader"
        >
          <Tab tabKey={1} tabName="DAO 🔥">
            {proposals && (
              <div className="tabContent">
                🙋🏻‍♂️🙋🏻‍♀️ Governance Dashboard 📢
                <div className="widgets">
                  <Widget
                    info={totalP}
                    title="💬 Proposals Created"
                    style={{ width: "200%" }}
                  >
                    <div className="extraWidgetInfo">
                      <div className="extraTitle">🔔 Pass Rate</div>
                      <div className="progress">
                        <div
                          className="progressPercentage"
                          style={{ width: `${passRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </Widget>
                  <Widget
                    info={"<" + voters.length}
                    title="💎 Eligible Voters"
                  />
                  <Widget
                    info={totalP - counted}
                    title="⏳ Ongoing Proposals"
                  />
                </div>
                📝 Recent Proposals
                <div style={{ marginTop: "30px" }}>
                  <Table
                    columnsConfig="10% 70% 20%"
                    data={proposals}
                    header={[
                      <span>ID</span>,
                      <span>Description</span>,
                      <span>Status</span>,
                    ]}
                    pageSize={5}
                  />
                </div>
                <Form
                  buttonConfig={{
                    isLoading: sub,
                    loadingText: "Submitting Proposal ✨",
                    text: "Submit ✨",
                    theme: "secondary",
                  }}
                  data={[
                    {
                      inputWidth: "100%",
                      name: "Enter new proposal",
                      type: "textarea",
                      validation: {
                        required: true,
                      },
                      value: "",
                    },
                    {
                      inputWidth: "100%",
                      name: "Enter max voters",
                      type: "number",
                      validation: {
                        required: true,
                      },
                      value: "",
                    },
                    {
                      inputWidth: "100%",
                      name: "Enter deadline proposal",
                      type: "number",
                      validation: {
                        required: true,
                      },
                      value: "",
                    },
                  ]}
                  onSubmit={(e) => {
                    setSub(true);
                    createProposal(
                      e.data[0].inputResult,
                      e.data[1].inputResult,
                      e.data[2].inputResult
                    );
                  }}
                  title="✍🏻 Create a New Proposal"
                  style={{ marginTop: "30px" }}
                />
              </div>
            )}
          </Tab>
          <Tab tabKey={2} tabName="Forum (soon)">
            <div className="textBuilding">👷🏻‍♂️ #Building 🚧</div>
          </Tab>
          <Tab tabKey={3} tabName="Docs (soon)">
            <div className="textBuilding">👷🏻‍♂️ #Building 🚧</div>
          </Tab>
        </TabList>
      </div>
      <div className="voting"></div>
    </>
  );
};

export default Home;

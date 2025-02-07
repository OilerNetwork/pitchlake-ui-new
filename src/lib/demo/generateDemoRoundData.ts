interface RoundData {
  roundId: number;
  roundAddress: string;
  capLevel: string;
  strikePrice: string;
  deploymentDate: string;
  auctionStartDate: string;
  auctionEndDate: string;
  optionSettleDate: string;
}

const lookup: any = {
  1: {
    strikePrice: 6.5 * 1e9,
    capLevel: 4500,
  },
  2: {
    strikePrice: 6.13 * 1e9,
    capLevel: 5200,
  },
  3: {
    strikePrice: 7.22 * 1e9,
    capLevel: 4500,
  },
  4: {
    strikePrice: 9.16 * 1e9,
    capLevel: 2300,
  },
};

function generateDemoRounds(
  numRounds: number,
  genesis: number,
  roundTransitionPeriod: number,
  auctionRunTime: number,
  optionRunTime: number,
  delay: number,
): RoundData[] {
  function randomHex32(): string {
    // create a 32-byte hex string starting with "0x"
    let hexStr = "0x";
    for (let i = 0; i < 64; i++) {
      hexStr += Math.floor(Math.random() * 16).toString(16);
    }
    return hexStr;
  }

  const rounds: RoundData[] = [];

  let deploymentDate = genesis;

  for (let i = 1; i <= numRounds; i++) {
    const auctionStartDate = deploymentDate + roundTransitionPeriod;
    const auctionEndDate = auctionStartDate + auctionRunTime;
    const optionSettleDate = auctionEndDate + optionRunTime;

    const round: RoundData = {
      roundId: i,
      roundAddress: randomHex32(), // or use any deterministic approach
      capLevel: lookup[i].capLevel,
      strikePrice: lookup[i].strikePrice,
      deploymentDate: deploymentDate.toString(),
      auctionStartDate: auctionStartDate.toString(),
      auctionEndDate: auctionEndDate.toString(),
      optionSettleDate: optionSettleDate.toString(),
    };

    rounds.push(round);

    deploymentDate = optionSettleDate + delay;
  }

  return rounds;
}

function main2() {
  const numRounds = 4;

  const genesis = 1735707623 + 3600; // base start
  const roundTransitionPeriod = 60;
  const auctionRunTime = 180;
  const optionRunTime = 180;
  const delay = 30;

  const demoRounds = generateDemoRounds(
    numRounds,
    genesis,
    roundTransitionPeriod,
    auctionRunTime,
    optionRunTime,
    delay,
  );

  console.log(JSON.stringify(demoRounds, null, 2));
}

main2();

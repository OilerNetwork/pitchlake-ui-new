/**
 * Generate an array of demo block data with:
 *   - ~100 blocks trending downward from basefee ~10 to ~5,
 *   - ~100 blocks trending upward from ~5 to ~15,
 *   - Each block is 12 seconds apart,
 *   - Each step constrained by ±12.5% from the previous basefee,
 *   - Final basefees clamped to [1..25],
 *   - A bit of random noise for realism.
 */
function generateDemoData(): {
  blockNumber: string;
  timestamp: number;
  basefee: number;
}[] {
  // --------------------------------------------------------------------
  //  1. Configurable parameters
  // --------------------------------------------------------------------

  // The "genesis" timestamp (first block).
  const genesisTimestamp = 1735705623 + 1800;

  // The first block number to use.
  const startBlock = 21527387;

  // How many blocks of data to generate total.
  const numberOfBlocks = 500;

  // Time delta between blocks in seconds.
  const blockTime = 12;

  // The basefee starts around 10.
  let currentBasefee = 10;

  // We store final data here.
  const data = [];

  // --------------------------------------------------------------------
  //  2. Piecewise polynomial to create an overall trend
  //     Part 1: downward from ~10 to ~5
  //     Part 2: upward from ~5 to ~15 (or any values you like)
  // --------------------------------------------------------------------

  function piecewiseTrend(x: number): number {
    // x in [0..1]
    if (x < 0.25) {
      // This covers the first half of blocks, i.e. x in [0..0.5].
      // Map x to t in [0..1].
      const t = x / 0.5;
      // Let's define a polynomial that goes from ~10 => ~5.
      // For example, f(t) = 10 - 5 * t^2
      //   at t=0 => 10
      //   at t=1 => 5
      return 10 - 5 * (t * t);
    } else {
      // This covers the second half, x in [0.5..1].
      // Map x to t in [0..1].
      const t = (x - 0.5) / 0.5;
      // Let's define a polynomial that goes from ~5 => ~15.
      //   f(t) = 5 + 10 * t^2
      //   at t=0 => 5
      //   at t=1 => 15
      return 5 + 10 * (t * t);
    }
  }

  // --------------------------------------------------------------------
  //  3. Generate the data
  // --------------------------------------------------------------------

  // Helper: clamp a value to [min, max]
  const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));

  for (let i = 0; i < numberOfBlocks; i++) {
    // The blockNumber and timestamp for this block
    const blockNumber = startBlock + i;
    const timestamp = genesisTimestamp + i * blockTime;

    // Evaluate the "ideal" piecewise polynomial for this block
    // normalized x in [0..1]
    const x = i / Math.max(1, numberOfBlocks - 1);
    const ideal = piecewiseTrend(x);

    // Let's push the current basefee gently toward that ideal
    // with some random noise, but limited by ±12.5% from the previous block.
    const maxChange = currentBasefee * 0.125; // ±12.5%

    // difference = (ideal - current) + random "jitter"
    let difference = ideal - currentBasefee;

    // Add random noise in ±2 range
    difference += (Math.random() - 0.5) * 4;

    // Clamp the difference to ±maxChange
    difference = clamp(difference, -maxChange, maxChange);

    // Apply the difference
    let newBasefee = currentBasefee + difference;

    // Finally clamp to [1..25]
    newBasefee = clamp(newBasefee, 1, 25);

    // Round to 6 decimals
    currentBasefee = parseFloat(newBasefee.toFixed(6));

    data.push({
      blockNumber: blockNumber.toString(),
      timestamp,
      basefee: currentBasefee,
    });
  }

  return data;
}

// Quick driver: print JSON to stdout so we can redirect it to a file in bash.
function main() {
  const demoData = generateDemoData();
  console.log(JSON.stringify(demoData, null, 2));
}

main();

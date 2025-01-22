import { useRoundState } from "@/hooks/stateTransition/useRoundState";
import { OptionRoundStateType } from "@/lib/types";
import { StatusData } from "@/hooks/fossil/useFossilStatus";

describe("useRoundState", () => {
  const mockRoundState = (state: string): OptionRoundStateType => ({
    roundState: state,
  } as OptionRoundStateType);

  it("returns Settled when selectedRoundState is undefined", () => {
    const { roundState } = useRoundState({
      selectedRoundState: undefined,
      fossilStatus: null,
      fossilError: null,
      pendingTx: undefined,
      expectedNextState: null,
    });
    expect(roundState).toBe("Settled");
  });

  it("returns Pending when transaction is pending", () => {
    const { roundState } = useRoundState({
      selectedRoundState: mockRoundState("Open"),
      fossilStatus: null,
      fossilError: null,
      pendingTx: "0x123",
      expectedNextState: null,
    });
    expect(roundState).toBe("Pending");
  });

  it("returns Pending when fossil status is Pending", () => {
    const { roundState } = useRoundState({
      selectedRoundState: mockRoundState("Open"),
      fossilStatus: { status: "Pending" },
      fossilError: null,
      pendingTx: undefined,
      expectedNextState: null,
    });
    expect(roundState).toBe("Pending");
  });

  it("returns current state for Open/Auctioning/Settled when matching expected state", () => {
    ["Open", "Auctioning", "Settled"].forEach(currentState => {
      const { roundState } = useRoundState({
        selectedRoundState: mockRoundState(currentState),
        fossilStatus: null,
        fossilError: null,
        pendingTx: undefined,
        expectedNextState: currentState,
      });
      expect(roundState).toBe(currentState);
    });
  });

  it("returns Pending when current state doesn't match expected next state", () => {
    const { roundState } = useRoundState({
      selectedRoundState: mockRoundState("Open"),
      fossilStatus: null,
      fossilError: null,
      pendingTx: undefined,
      expectedNextState: "Auctioning",
    });
    expect(roundState).toBe("Pending");
  });

  describe("Running state transitions", () => {
    it("returns Running when fossil status is Completed and not expecting Open", () => {
      const { roundState } = useRoundState({
        selectedRoundState: mockRoundState("Running"),
        fossilStatus: { status: "Completed" },
        fossilError: null,
        pendingTx: undefined,
        expectedNextState: "Running",
      });
      expect(roundState).toBe("Running");
    });

    it("returns Pending when fossil status is Completed and expecting Open", () => {
      const { roundState } = useRoundState({
        selectedRoundState: mockRoundState("Running"),
        fossilStatus: { status: "Completed" },
        fossilError: null,
        pendingTx: undefined,
        expectedNextState: "Open",
      });
      expect(roundState).toBe("Pending");
    });

    it("returns FossilReady when fossil status is Failed", () => {
      const { roundState } = useRoundState({
        selectedRoundState: mockRoundState("Running"),
        fossilStatus: { status: "Failed" },
        fossilError: null,
        pendingTx: undefined,
        expectedNextState: null,
      });
      expect(roundState).toBe("FossilReady");
    });

    it("returns FossilReady when there is a fossil error", () => {
      const { roundState } = useRoundState({
        selectedRoundState: mockRoundState("Running"),
        fossilStatus: null,
        fossilError: "Some error",
        pendingTx: undefined,
        expectedNextState: null,
      });
      expect(roundState).toBe("FossilReady");
    });

    it("returns FossilReady when fossil status is null", () => {
      const { roundState } = useRoundState({
        selectedRoundState: mockRoundState("Running"),
        fossilStatus: null,
        fossilError: null,
        pendingTx: undefined,
        expectedNextState: null,
      });
      expect(roundState).toBe("FossilReady");
    });

    it("tracks previous round state", () => {
      const { roundState: initialState, prevRoundState: initialPrev } = useRoundState({
        selectedRoundState: mockRoundState("Open"),
        fossilStatus: null,
        fossilError: null,
        pendingTx: undefined,
        expectedNextState: null,
      });

      expect(initialState).toBe("Open");
      expect(initialPrev).toBe("Open");

      const { roundState: nextState, prevRoundState: nextPrev } = useRoundState({
        selectedRoundState: mockRoundState("Auctioning"),
        fossilStatus: null,
        fossilError: null,
        pendingTx: undefined,
        expectedNextState: null,
      });

      expect(nextState).toBe("Auctioning");
      expect(nextPrev).toBe("Open");
    });
  });
}); 
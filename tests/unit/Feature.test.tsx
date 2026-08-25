import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMockRoom } from "@baditaflorin/mesh-common/testing";
import { Feature } from "../../src/Feature";
import { config } from "../../src/config";

describe("Feature (component)", () => {
  it("turns the first entry into a real shared shortlist action", () => {
    const room = createMockRoom();
    render(<Feature room={room} config={config} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "What should we choose?" }),
    ).toBeInTheDocument();
    const add = screen.getByRole("button", { name: "Add this option" });
    expect(add).toBeDisabled();

    fireEvent.change(screen.getByLabelText("First option"), {
      target: { value: "The courtyard table" },
    });
    expect(add).toBeEnabled();
    fireEvent.click(add);

    expect(
      screen.getByRole("heading", { level: 1, name: "Make the call with clarity." }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("The courtyard table").length).toBeGreaterThan(0);
  });

  it("keeps a recognizable, honest entry state while the room connects", () => {
    render(<Feature room={null} config={config} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "What should we choose?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Opening your room…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add this option" })).toBeDisabled();
  });
});

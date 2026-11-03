import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/ui/status-badge";
import { BigTile } from "@/components/ui/big-tile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

describe("StatusBadge", () => {
  for (const [tone, word] of [
    ["green", "Real"],
    ["yellow", "Check this"],
    ["red", "Not real"],
  ] as const) {
    it(`${tone} shows an icon AND a word, never colour alone`, () => {
      const { container } = render(<StatusBadge tone={tone} label={word} />);
      expect(screen.getByText(word)).toBeInTheDocument();
      expect(container.querySelector("svg")).not.toBeNull();
      expect(container.firstElementChild).toHaveAttribute("data-tone", tone);
    });
  }
});

describe("BigTile", () => {
  it("is one big link with a title and a call to action", () => {
    render(<BigTile href="/check" title="Check someone" body="Paste a link" cta="Check" power="stretch" icon="check" />);
    expect(screen.getByRole("link", { name: /check someone/i })).toHaveAttribute("href", "/check");
  });
});

describe("Button", () => {
  it("shows a busy state with its own label and blocks clicks", () => {
    render(
      <Button busy busyLabel="Checking...">
        Check
      </Button>,
    );
    const b = screen.getByRole("button");
    expect(b).toHaveAttribute("aria-busy", "true");
    expect(b).toBeDisabled();
    expect(b).toHaveTextContent("Checking...");
  });
});

describe("Card", () => {
  it("renders its children in the outlined card", () => {
    render(<Card data-testid="c">Hello</Card>);
    expect(screen.getByTestId("c")).toHaveClass("card");
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShoppingRow } from "./ShoppingRow";
import { ListItem } from "../types/shared";

const item: ListItem = {
  id: "list-1",
  foodItemId: "food-1",
  name: "Mjölk",
  category: "Mejeri & Ägg",
  unit: "l",
  quantity: 2,
  checked: false,
  addedAt: "2026-07-20T10:00:00.000Z",
};

describe("ShoppingRow", () => {
  it("fires onToggle when tapped", () => {
    const onToggle = vi.fn();
    render(<ShoppingRow item={item} unavailable={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("renders checked items with strike-through styling", () => {
    render(
      <ShoppingRow item={{ ...item, checked: true }} unavailable={false} onToggle={() => {}} />
    );
    const row = screen.getByRole("checkbox");
    expect(row).toHaveClass("shopping-row-checked");
    expect(row).toHaveAttribute("aria-checked", "true");
  });

  it("shows the unavailable badge when the store lacks the item", () => {
    render(<ShoppingRow item={item} unavailable={true} onToggle={() => {}} />);
    expect(screen.getByText("Finns ej här")).toBeInTheDocument();
  });

  it("formats the quantity with the unit", () => {
    render(<ShoppingRow item={item} unavailable={false} onToggle={() => {}} />);
    expect(screen.getByText("2 l")).toBeInTheDocument();
  });
});

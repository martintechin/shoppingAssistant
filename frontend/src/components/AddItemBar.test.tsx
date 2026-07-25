import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddItemBar } from "./AddItemBar";
import { FoodItem } from "../types/shared";

const items: FoodItem[] = [
  {
    id: "food-1",
    name: "Mjölk",
    category: "Mejeri & Ägg",
    unit: "l",
    lastBought: "2026-07-23T10:00:00.000Z", // 2 days ago
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "food-2",
    name: "Mellanmjölk",
    category: "Mejeri & Ägg",
    unit: "l",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("AddItemBar", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-07-25T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(onSelect = vi.fn(), onCreateNew = vi.fn()) {
    render(
      <AddItemBar items={items} listItems={[]} onSelect={onSelect} onCreateNew={onCreateNew} />
    );
    return { onSelect, onCreateNew };
  }

  it("shows ranked suggestions while typing", () => {
    setup();
    fireEvent.change(screen.getByPlaceholderText("Lägg till vara..."), {
      target: { value: "mjölk" },
    });
    const names = screen.getAllByText(/mjölk/i).map((el) => el.textContent);
    expect(names[0]).toBe("Mjölk");
  });

  it("marks recently bought items with a warning tag", () => {
    setup();
    fireEvent.change(screen.getByPlaceholderText("Lägg till vara..."), {
      target: { value: "mjölk" },
    });
    expect(screen.getByText("Köpt för 2 dagar sedan")).toBeInTheDocument();
  });

  it("asks for confirmation before adding a recently bought item", () => {
    const { onSelect } = setup();
    fireEvent.change(screen.getByPlaceholderText("Lägg till vara..."), {
      target: { value: "Mjölk" },
    });
    fireEvent.click(screen.getByText("Mjölk"));

    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Lägg till ändå"));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "food-1" }));
  });

  it("adds items without recent purchases immediately", () => {
    const { onSelect } = setup();
    fireEvent.change(screen.getByPlaceholderText("Lägg till vara..."), {
      target: { value: "Mellanmjölk" },
    });
    fireEvent.click(screen.getByText("Mellanmjölk"));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "food-2" }));
  });

  it("offers to create an unknown item", () => {
    const { onCreateNew } = setup();
    fireEvent.change(screen.getByPlaceholderText("Lägg till vara..."), {
      target: { value: "Surströmming" },
    });
    fireEvent.click(screen.getByText('+ Skapa "Surströmming"'));
    expect(onCreateNew).toHaveBeenCalledWith("Surströmming");
  });

  it("hides the create row when an exact match exists", () => {
    setup();
    fireEvent.change(screen.getByPlaceholderText("Lägg till vara..."), {
      target: { value: "mjölk" },
    });
    expect(screen.queryByText(/\+ Skapa/)).not.toBeInTheDocument();
  });
});

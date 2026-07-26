import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddItemBar } from "./AddItemBar";
import { FoodItem } from "../types/shared";

const items: FoodItem[] = [
  {
    id: "food-1",
    name: "Milk",
    category: "Dairy & Eggs",
    unit: "l",
    lastBought: "2026-07-23T10:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "food-2",
    name: "Whole milk",
    category: "Dairy & Eggs",
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
    fireEvent.change(screen.getByPlaceholderText("Add item..."), {
      target: { value: "milk" },
    });
    const names = screen.getAllByText(/milk/i).map((el) => el.textContent);
    expect(names[0]).toBe("Milk");
  });

  it("marks recently bought items with a warning tag", () => {
    setup();
    fireEvent.change(screen.getByPlaceholderText("Add item..."), {
      target: { value: "milk" },
    });
    expect(screen.getByText(/Bought.*2 days ago/)).toBeInTheDocument();
  });

  it("asks for confirmation before adding a recently bought item", () => {
    const { onSelect } = setup();
    fireEvent.change(screen.getByPlaceholderText("Add item..."), {
      target: { value: "Milk" },
    });
    fireEvent.click(screen.getByText("Milk"));

    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Add anyway"));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "food-1" }));
  });

  it("adds items without recent purchases immediately", () => {
    const { onSelect } = setup();
    fireEvent.change(screen.getByPlaceholderText("Add item..."), {
      target: { value: "Whole milk" },
    });
    fireEvent.click(screen.getByText("Whole milk"));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "food-2" }));
  });

  it("offers to create an unknown item", () => {
    const { onCreateNew } = setup();
    fireEvent.change(screen.getByPlaceholderText("Add item..."), {
      target: { value: "Kombucha" },
    });
    fireEvent.click(screen.getByText('+ Create "Kombucha"'));
    expect(onCreateNew).toHaveBeenCalledWith("Kombucha");
  });

  it("hides the create row when an exact match exists", () => {
    setup();
    fireEvent.change(screen.getByPlaceholderText("Add item..."), {
      target: { value: "milk" },
    });
    expect(screen.queryByText(/\+ Create/)).not.toBeInTheDocument();
  });
});

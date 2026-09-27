// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ShortcutRecorder, acceleratorFromEvent, describeAccelerator } from "./shortcut-recorder";

function key(code: string, mods: Partial<Record<"meta" | "ctrl" | "alt" | "shift", boolean>> = {}) {
  return new KeyboardEvent("keydown", {
    code,
    metaKey: mods.meta ?? false,
    ctrlKey: mods.ctrl ?? false,
    altKey: mods.alt ?? false,
    shiftKey: mods.shift ?? false,
  });
}

describe("acceleratorFromEvent (non-mac)", () => {
  it("builds a modifier + letter accelerator", () => {
    expect(acceleratorFromEvent(key("KeyN", { ctrl: true, alt: true }))).toBe("Control+Alt+N");
  });

  it("orders modifiers as Super, Control, Alt, Shift", () => {
    expect(
      acceleratorFromEvent(key("KeyK", { meta: true, ctrl: true, alt: true, shift: true })),
    ).toBe("Super+Control+Alt+Shift+K");
  });

  it("names the meta key Super off macOS", () => {
    expect(acceleratorFromEvent(key("Space", { meta: true }))).toBe("Super+Space");
  });

  it("requires a modifier other than Shift", () => {
    expect(acceleratorFromEvent(key("KeyA"))).toBeNull();
    expect(acceleratorFromEvent(key("KeyA", { shift: true }))).toBeNull();
  });

  it("maps digits, numpad digits and function keys", () => {
    expect(acceleratorFromEvent(key("Digit5", { ctrl: true }))).toBe("Control+5");
    expect(acceleratorFromEvent(key("Numpad7", { alt: true }))).toBe("Alt+num7");
    expect(acceleratorFromEvent(key("F1", { ctrl: true }))).toBe("Control+F1");
    expect(acceleratorFromEvent(key("F12", { ctrl: true }))).toBe("Control+F12");
    expect(acceleratorFromEvent(key("F24", { ctrl: true }))).toBe("Control+F24");
  });

  it("maps named keys to their Electron spelling", () => {
    expect(acceleratorFromEvent(key("Enter", { ctrl: true }))).toBe("Control+Return");
    expect(acceleratorFromEvent(key("NumpadEnter", { ctrl: true }))).toBe("Control+Return");
    expect(acceleratorFromEvent(key("ArrowUp", { alt: true }))).toBe("Alt+Up");
    expect(acceleratorFromEvent(key("Minus", { ctrl: true }))).toBe("Control+-");
    expect(acceleratorFromEvent(key("Backslash", { ctrl: true }))).toBe("Control+\\");
    expect(acceleratorFromEvent(key("Backquote", { ctrl: true, shift: true }))).toBe(
      "Control+Shift+`",
    );
  });

  it("rejects keys that cannot be part of a global shortcut", () => {
    expect(acceleratorFromEvent(key("F25", { ctrl: true }))).toBeNull();
    expect(acceleratorFromEvent(key("ControlLeft", { ctrl: true }))).toBeNull();
    expect(acceleratorFromEvent(key("NumpadAdd", { ctrl: true }))).toBeNull();
    expect(acceleratorFromEvent(key("Escape", { ctrl: true }))).toBeNull();
  });
});

describe("describeAccelerator (non-mac)", () => {
  it("returns None for an empty accelerator", () => {
    expect(describeAccelerator("")).toBe("None");
  });

  it("joins spelled-out modifiers with +", () => {
    expect(describeAccelerator("CommandOrControl+Shift+Space")).toBe("Ctrl+Shift+Space");
    expect(describeAccelerator("CmdOrCtrl+Alt+N")).toBe("Ctrl+Alt+N");
    expect(describeAccelerator("Control+Option+K")).toBe("Ctrl+Alt+K");
  });

  it("names Command and Super as Win", () => {
    expect(describeAccelerator("Super+K")).toBe("Win+K");
    expect(describeAccelerator("Command+K")).toBe("Win+K");
    expect(describeAccelerator("Cmd+K")).toBe("Win+K");
  });

  it("shows Return as an arrow symbol", () => {
    expect(describeAccelerator("Control+Return")).toBe("Ctrl+↩");
  });
});

describe("on macOS", () => {
  async function loadMac() {
    vi.spyOn(navigator, "platform", "get").mockReturnValue("MacIntel");
    vi.resetModules();
    return import("./shortcut-recorder");
  }

  it("names the meta key Command", async () => {
    const mac = await loadMac();
    expect(mac.acceleratorFromEvent(key("Space", { meta: true, alt: true }))).toBe(
      "Command+Alt+Space",
    );
  });

  it("describes accelerators with symbols and no separator", async () => {
    const mac = await loadMac();
    expect(mac.describeAccelerator("CommandOrControl+Shift+Space")).toBe("⌘⇧Space");
    expect(mac.describeAccelerator("Control+Option+K")).toBe("⌃⌥K");
    expect(mac.describeAccelerator("Super+Return")).toBe("⌘↩");
    expect(mac.describeAccelerator("")).toBe("None");
  });
});

describe("ShortcutRecorder", () => {
  function setup(value = "CommandOrControl+Shift+Space") {
    const onChange = vi.fn();
    render(<ShortcutRecorder value={value} onChange={onChange} />);
    const recorder = screen.getByTestId("shortcut-recorder");
    const clear = screen.getByTitle("Disable the global shortcut");
    return { onChange, recorder, clear };
  }

  it("shows the current shortcut", () => {
    const { recorder } = setup();
    expect(recorder.textContent).toBe("Ctrl+Shift+Space");
  });

  it("shows None when no shortcut is set", () => {
    const { recorder } = setup("");
    expect(recorder.textContent).toBe("None");
  });

  it("ignores key presses until clicked", () => {
    const { onChange, recorder } = setup();
    fireEvent.keyDown(recorder, { key: "k", code: "KeyK", ctrlKey: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("records a combination after a click", () => {
    const { onChange, recorder } = setup();
    fireEvent.click(recorder);
    expect(recorder.textContent).toBe("Press keys…");
    fireEvent.keyDown(recorder, { key: "k", code: "KeyK", ctrlKey: true, altKey: true });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("Control+Alt+K");
    expect(recorder.textContent).toBe("Ctrl+Shift+Space");
  });

  it("waits through modifier-only and invalid presses", () => {
    const { onChange, recorder } = setup();
    fireEvent.click(recorder);
    fireEvent.keyDown(recorder, { key: "Control", code: "ControlLeft", ctrlKey: true });
    fireEvent.keyDown(recorder, { key: "a", code: "KeyA" });
    expect(onChange).not.toHaveBeenCalled();
    expect(recorder.textContent).toBe("Press keys…");
    fireEvent.keyDown(recorder, { key: "a", code: "KeyA", ctrlKey: true });
    expect(onChange).toHaveBeenCalledWith("Control+A");
  });

  it("cancels recording on Escape", () => {
    const { onChange, recorder } = setup();
    fireEvent.click(recorder);
    fireEvent.keyDown(recorder, { key: "Escape", code: "Escape" });
    expect(recorder.textContent).toBe("Ctrl+Shift+Space");
    fireEvent.keyDown(recorder, { key: "k", code: "KeyK", ctrlKey: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("stops recording on blur", () => {
    const { onChange, recorder } = setup();
    fireEvent.click(recorder);
    fireEvent.blur(recorder);
    expect(recorder.textContent).toBe("Ctrl+Shift+Space");
    fireEvent.keyDown(recorder, { key: "k", code: "KeyK", ctrlKey: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears the shortcut with the × button", () => {
    const { onChange, clear } = setup();
    expect((clear as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(clear);
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("disables the × button when there is no shortcut", () => {
    const { clear } = setup("");
    expect((clear as HTMLButtonElement).disabled).toBe(true);
  });
});

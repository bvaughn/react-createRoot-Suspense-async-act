/** @jest-environment jsdom */

const { createElement, Suspense } = require("react");
const { createRoot } = require("react-dom/client");
const { act } = require("react-dom/test-utils");

describe("suspense", () => {
  let resolved = false;
  let promise = null;

  // This is a silly "cache"
  // I've stripped all the non-essential bits out of the repro case
  function read(key) {
    if (promise == null) {
      promise = Promise.resolve(key).then(() => {
        console.log("RESOLVED");
        resolved = true;
      });
    }

    if (!resolved) {
      throw promise;
    } else {
      return key;
    }
  }

  function Component() {
    const value = read("test");
    return createElement("div", null, value);
  }

  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;

    promise = null;
    resolved = false;
  });

  // I think this failure is expected because it doesn't account for the microtask queue
  it("fails with an act warning (expected)", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    act(() => {
      root.render(createElement(Suspense, null, createElement(Component)));
    });

    expect(container.textContent).toBe("test");
  });

  // This test hangs though, which seems unexpected
  // NOTE this doesn't happen on "latest" – but both "experimental" and "next" channels hang
  it("hangs forever after suspended promise resolves (unexpected)", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(Suspense, null, createElement(Component)));
    });

    expect(container.textContent).toBe("test");
  });
});

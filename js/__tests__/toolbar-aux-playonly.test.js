// Copyright (c) 2026 Sugarlabs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

"use strict";

/*
 * Regression coverage for the play-only auxiliary-menu whitespace bug.
 *
 * Opening the auxiliary ("3-dot") menu expands a second toolbar row and, via
 * the aux-menu callback, shifts the whole workspace down to make room for it.
 * In play-only mode the auxiliary tools are editor-only and unavailable, so
 * that shift only leaves an unnecessary blank band below the toolbar. The menu
 * button must therefore keep the auxiliary toolbar collapsed in play-only
 * mode (while still allowing an already-open toolbar to be closed), and must
 * behave exactly as before in the full editor.
 */

const { platformColor } = require("../utils/platformstyle");
global.platformColor = platformColor;
global.makeKeyboardAccessible = require("../utils/dom-helpers").makeKeyboardAccessible;

jest.mock("../utils/platformstyle", () => ({
    platformColor: { stopIconColor: "#ea174c" }
}));

global.jQuery = jest.fn(() => ({
    on: jest.fn(),
    trigger: jest.fn(),
    tooltip: jest.fn(),
    dropdown: jest.fn()
}));
global.jQuery.noConflict = jest.fn(() => global.jQuery);

const ToolbarUI = require("../toolbar-ui");

const makeEl = id => ({
    id,
    style: {},
    textContent: "menu",
    classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(() => false),
        toggle: jest.fn()
    }
});

/**
 * Wires up the DOM doubles the menu-icon handler touches and returns them.
 * @param {boolean} playOnly - whether <body> carries the "play-only" class.
 */
const setup = playOnly => {
    const menu = makeEl("menu");
    const aux = makeEl("aux-toolbar");
    aux.style.display = "none";
    const els = {
        menu,
        "aux-toolbar": aux,
        "search": makeEl("search"),
        "chooseKeyDiv": makeEl("chooseKeyDiv"),
        "movable": makeEl("movable")
    };

    document.getElementById = jest.fn(id => els[id] || makeEl(id));
    global.docById = id => document.getElementById(id);
    document.body.classList.remove("play-only");
    if (playOnly) {
        document.body.classList.add("play-only");
    }

    const toolbar = new ToolbarUI();
    // _setAuxToolbarButtonState reads the menu button's class list; stub it out
    // so the test focuses on the open/collapse decision.
    toolbar._setAuxToolbarButtonState = jest.fn();

    const onclick = jest.fn();
    toolbar.renderMenuIcon(onclick);
    return { menu, aux, onclick };
};

describe("auxiliary menu in play-only mode", () => {
    test("clicking the menu does NOT expand the toolbar or shift the workspace", () => {
        const { menu, aux, onclick } = setup(true);

        menu.onclick();

        expect(onclick).not.toHaveBeenCalled(); // no workspace shift
        expect(aux.style.display).toBe("none"); // toolbar stays collapsed
        expect(menu.textContent).toBe("menu"); // icon unchanged
    });

    test("an already-open toolbar can still be closed in play-only mode", () => {
        const { menu, aux, onclick } = setup(true);
        aux.style.display = "block";
        menu.textContent = "more_vert";

        menu.onclick();

        expect(onclick).toHaveBeenCalledTimes(1);
        expect(onclick.mock.calls[0][1]).toBe(true); // close path runs (resize=true)
        expect(aux.style.display).toBe("none");
        expect(menu.textContent).toBe("menu");
    });
});

describe("auxiliary menu in the full editor", () => {
    test("clicking the menu expands the toolbar and shifts the workspace as before", () => {
        const { menu, aux, onclick } = setup(false);

        menu.onclick();

        expect(onclick).toHaveBeenCalledTimes(1);
        expect(onclick.mock.calls[0][1]).toBe(false); // workspace shift happens (resize=false)
        expect(aux.style.display).toBe("block"); // toolbar opens
        expect(menu.textContent).toBe("more_vert"); // icon flips
    });
});

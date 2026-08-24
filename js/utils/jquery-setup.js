// Copyright (c) 2026 Sugar Labs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
 * jQuery/jQuery-UI/Materialize post-load setup.
 *
 * This file is loaded with "defer" after jQuery, jQuery-UI, and
 * Materialize so that those three libraries can also be deferred
 * (removing ~550 KB of render-blocking JavaScript).
 *
 * Contents were previously inline <script> blocks in index.html.
 */

// Bridge jQuery-UI autocomplete with Materialize so both coexist.
jQuery(document).ready(function () {
    if (jQuery.ui && jQuery.ui.autocomplete) {
        jQuery.fn.materializeAutocomplete = jQuery.fn.autocomplete;
        jQuery.widget.bridge("autocomplete", jQuery.ui.autocomplete);
    }
});

// Fix autocomplete dropdown position to stay anchored to the search input.
// The #search autocomplete is created lazily by SearchController.doSearch()
// (js/activity/search-controller.js), which runs late in activity startup —
// a timer-based poll here cannot know when that happens and loses the race
// on any load slower than its budget (issue #8069). Instead, doSearch()
// calls this function immediately after initialising the widget.
window.fixSearchAutocompletePosition = function () {
    const $search = jQuery("#search");
    if (!$search.length || !$search.data("ui-autocomplete")) {
        return false;
    }

    const instance = $search.autocomplete("instance");
    if (!instance || instance._mbPositionFixApplied) {
        return false;
    }

    const originalRenderMenu = instance._renderMenu;
    instance._renderMenu = function (ul, items) {
        originalRenderMenu.call(this, ul, items);
        setTimeout(() => {
            const searchInput = document.querySelector("#search");
            const dropdown = ul[0];
            if (searchInput && dropdown) {
                const rect = searchInput.getBoundingClientRect();
                dropdown.style.position = "fixed";
                dropdown.style.left = rect.left + "px";
                dropdown.style.top = rect.bottom + 2 + "px";
                dropdown.style.width = rect.width + "px";
            }
        }, 0);
    };
    instance._mbPositionFixApplied = true;
    return true;
};

// Keep Materialize's tooltip teardown from destroying Velocity state that an
// in-flight animation is still going to touch (issue: "Cannot read properties
// of undefined (reading 'tweensContainer')").
//
// Materialize 0.100.2's $.fn.tooltip tears down the previous tooltip with
// jQuery's .remove(). That runs cleanData(), which deletes the element's
// "velocity" data. But the show animation Materialize starts on mouseenter
// ends with
//
//     $tooltip.velocity({opacity: 1}, {duration: 300, delay: 50, queue: false})
//
// and Velocity implements `delay` + `queue:false` as a bare setTimeout that it
// never tracks or cancels. Roughly 100-150 ms after a pointer lands on a
// .tooltipped element there is a pending timer holding a reference to the
// tooltip node. When that timer fires, Velocity reads Data(element)
// .tweensContainer -- and if we removed the node in the meantime, the data is
// gone and it throws. Neither .velocity("stop") nor .stop(true, true) helps,
// because that setTimeout is not in any queue Velocity knows about.
//
// So detach instead of remove. .detach() takes the node out of the document
// without running cleanData(), so the orphaned animation finishes harmlessly
// on the detached node and the node is then garbage collected. Patching
// $.fn.tooltip here fixes every caller at once -- re-init, "remove", and the
// bogus "close" -- without touching the vendor bundle.
(function () {
    const originalTooltip = jQuery.fn.tooltip;
    if (typeof originalTooltip !== "function") {
        return;
    }

    jQuery.fn.tooltip = function (...args) {
        this.each(function () {
            const id = this.getAttribute && this.getAttribute("data-tooltip-id");
            const previous = id && document.getElementById(id);
            if (previous) {
                jQuery(previous).detach();
            }
        });
        return originalTooltip.apply(this, args);
    };
})();

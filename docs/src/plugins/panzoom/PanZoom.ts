/**
 * Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import Panzoom from "@panzoom/panzoom";
import type { ClientModule } from "@docusaurus/types";
import { PanZoomPluginOptions } from "./PanzoomPluginOptions";

const config = require("@generated/docusaurus.config").default;
const { themeConfig } = config;
const { zoom }: { zoom: PanZoomPluginOptions } = themeConfig;
const {
  selectors = [
    'div.mermaid[data-processed="true"]',
    "div.docusaurus-mermaid-container",
    ".drawio",
  ],
  wrap = true,
  timeout = 1000,
  ...panZoomConfig
} = zoom || {};

const updatedPanZoomConfig = { ...panZoomConfig, disablePan: false };

const getElementInnerHTML = (element: Element): string => {
  if (element instanceof HTMLElement) {
    return element.innerHTML;
  }
  return "";
};

const showModalWithContent = (content: string) => {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "block";

  const modalBody = document.createElement("div");
  modalBody.className = "modal-body";

  const modalHeader = document.createElement("div");
  modalHeader.className = "modal-header";
  modalBody.appendChild(modalHeader);
  const closeButton = document.createElement("span");
  closeButton.className = "close-modal-button";
  closeButton.innerHTML = `
    <svg fill="currentColor" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:text-bottom" class="octicon octicon-x">
      <path fill-rule="evenodd" d="M5.72 5.72a.75.75 0 011.06 0L12 10.94l5.22-5.22a.75.75 0 111.06 1.06L13.06 12l5.22 5.22a.75.75 0 11-1.06 1.06L12 13.06l-5.22 5.22a.75.75 0 01-1.06-1.06L10.94 12 5.72 6.78a.75.75 0 010-1.06z"></path>
    </svg>
  `;
  closeButton.addEventListener("click", () => {
    document.body.classList.remove("modal-open");
    document.body.removeChild(modal);
  });
  modalHeader.appendChild(closeButton);

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const diagram = document.createElement("div");
  diagram.className = "diagram";
  diagram.innerHTML = content;

  modalContent.appendChild(diagram);
  modalBody.appendChild(modalContent);

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "panzoom-controls panzoom-controls-modal";
  buttonContainer.style.position = "sticky";

  const zoomInButton = document.createElement("button");
  zoomInButton.innerHTML = `<svg fill="currentColor" version="1.1" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.75 7.5a.75.75 0 0 1 .75-.75h2.25V4.5a.75.75 0 0 1 1.5 0v2.25h2.25a.75.75 0 0 1 0 1.5H8.25v2.25a.75.75 0 0 1-1.5 0V8.25H4.5a.75.75 0 0 1-.75-.75Z"></path><path d="M7.5 0a7.5 7.5 0 0 1 5.807 12.247l2.473 2.473a.749.749 0 1 1-1.06 1.06l-2.473-2.473A7.5 7.5 0 1 1 7.5 0Zm-6 7.5a6 6 0 1 0 12 0 6 6 0 0 0-12 0Z"></path></svg>`;
  zoomInButton.className = "button button--secondary button--lg button-control";

  const zoomOutButton = document.createElement("button");
  zoomOutButton.innerHTML = `<svg fill="currentColor" version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-zoom-out" aria-hidden="true"><path d="M4.5 6.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1 0-1.5Z"></path><path d="M0 7.5a7.5 7.5 0 1 1 13.307 4.747l2.473 2.473a.749.749 0 1 1-1.06 1.06l-2.473-2.473A7.5 7.5 0 0 1 0 7.5Zm7.5-6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z"></path></svg>`;
  zoomOutButton.className =
    "button button--secondary button--lg button-control";

  const resetButton = document.createElement("button");
  resetButton.innerHTML = `<svg fill="currentColor" version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-sync" aria-hidden="true"><path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path></svg>`;
  resetButton.className = "button button--secondary button--lg button-control";

  buttonContainer.appendChild(zoomInButton);
  buttonContainer.appendChild(zoomOutButton);
  buttonContainer.appendChild(resetButton);

  modalBody.appendChild(buttonContainer);
  modal.appendChild(modalBody);

  document.body.appendChild(modal);

  const panzoomInstance = Panzoom(diagram);

  zoomInButton.addEventListener("click", () => panzoomInstance.zoomIn());
  zoomOutButton.addEventListener("click", () => panzoomInstance.zoomOut());
  resetButton.addEventListener("click", () => panzoomInstance.reset());

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      document.body.classList.remove("modal-open");
      document.body.removeChild(modal);
    }
  });
};

const createActionsButtons = (element: Element, wrapper: HTMLElement) => {
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "panzoom-actions";

  const openModalButton = document.createElement("button");
  openModalButton.innerHTML = `
    <svg fill="currentColor" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="octicon m-2">
      <path fill-rule="evenodd" d="M3.72 3.72a.75.75 0 011.06 1.06L2.56 7h10.88l-2.22-2.22a.75.75 0 011.06-1.06l3.5 3.5a.75.75 0 010 1.06l-3.5 3.5a.75.75 0 11-1.06-1.06l2.22-2.22H2.56l2.22 2.22a.75.75 0 11-1.06 1.06l-3.5-3.5a.75.75 0 010-1.06l3.5-3.5z"></path>
    </svg>
  `;
  openModalButton.className =
    "button button--secondary button--lg button-control";

  openModalButton.addEventListener("click", () => {
    document.body.classList.add("modal-open");
    const innerHTML = getElementInnerHTML(element);
    showModalWithContent(innerHTML);
  });

  buttonContainer.appendChild(openModalButton);

  wrapper.appendChild(buttonContainer);
};

const createControlButtons = (
  wrapper: HTMLElement,
  instance: ReturnType<typeof Panzoom>
) => {
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "panzoom-controls";

  const zoomInButton = document.createElement("button");
  zoomInButton.innerHTML = `<svg fill="currentColor" version="1.1" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.75 7.5a.75.75 0 0 1 .75-.75h2.25V4.5a.75.75 0 0 1 1.5 0v2.25h2.25a.75.75 0 0 1 0 1.5H8.25v2.25a.75.75 0 0 1-1.5 0V8.25H4.5a.75.75 0 0 1-.75-.75Z"></path><path d="M7.5 0a7.5 7.5 0 0 1 5.807 12.247l2.473 2.473a.749.749 0 1 1-1.06 1.06l-2.473-2.473A7.5 7.5 0 1 1 7.5 0Zm-6 7.5a6 6 0 1 0 12 0 6 6 0 0 0-12 0Z"></path></svg>`;
  zoomInButton.className = "button button--secondary button--lg button-control";
  zoomInButton.addEventListener("click", () => instance.zoomIn());

  const zoomOutButton = document.createElement("button");
  zoomOutButton.innerHTML = `<svg fill="currentColor" version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-zoom-out" aria-hidden="true"><path d="M4.5 6.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1 0-1.5Z"></path><path d="M0 7.5a7.5 7.5 0 1 1 13.307 4.747l2.473 2.473a.749.749 0 1 1-1.06 1.06l-2.473-2.473A7.5 7.5 0 0 1 0 7.5Zm7.5-6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z"></path></svg>`;
  zoomOutButton.className =
    "button button--secondary button--lg button-control";
  zoomOutButton.addEventListener("click", () => instance.zoomOut());

  const resetButton = document.createElement("button");
  resetButton.innerHTML = `<svg fill="currentColor" version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-sync" aria-hidden="true"><path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path></svg>`;
  resetButton.className = "button button--secondary button--lg button-control";
  resetButton.addEventListener("click", () => instance.reset());

  buttonContainer.appendChild(zoomInButton);
  buttonContainer.appendChild(zoomOutButton);
  buttonContainer.appendChild(resetButton);

  wrapper.appendChild(buttonContainer);
};

const zoomElements = (selectors: string[]) => {
  const foundElements: Element[] = [];
  selectors.forEach((selector) => {
    foundElements.push(...Array.from(document.querySelectorAll(selector)));
  });
  foundElements.forEach((element) => {
    const instance = Panzoom(element as HTMLElement, updatedPanZoomConfig);
    if (wrap) {
      if (!element.parentElement?.classList.contains("panzoom-wrapper")) {
        const wrapper = document.createElement("div");
        wrapper.setAttribute("style", "overflow: hidden");
        wrapper.className = "panzoom-wrapper";
        element.parentElement?.insertBefore(wrapper, element);
        wrapper.appendChild(element);

        createControlButtons(wrapper, instance);
        createActionsButtons(element, wrapper);
      }
    }
  });
};

const ZoomModule: ClientModule = {
  onRouteDidUpdate() {
    setTimeout(() => {
      zoomElements(selectors);
    }, timeout);
  },
};

export default ZoomModule;

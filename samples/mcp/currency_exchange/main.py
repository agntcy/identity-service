# Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
# SPDX-License-Identifier: Apache-2.0
"""MCP Server Example."""

import logging
import os

import httpx
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from identityservice.auth.starlette import IdentityServiceMCPMiddleware
from mcp.server.fastmcp import FastMCP

load_dotenv()

logging.basicConfig(level=os.getenv("LOG_LEVEL", "DEBUG").upper())

mcp = FastMCP("GitHub", stateless_http=True)


@mcp.tool()
def trade_currency_exchange(
    currency_from: str = "USD",
    currency_to: str = "EUR",
    amount: float = 1.0,
):
    """Use this to trade currency exchange for the specified amount.

    Args:
        currency_from: The currency to trade from (e.g., "USD").
        currency_to: The currency to trade to (e.g., "EUR").
        amount: The amount of money to trade.

    Returns:
        A dictionary containing the converted amount and exchange rate, or an error message if the request fails.
    """
    try:
        response = httpx.get(
            "https://api.frankfurter.app/latest",
            params={"from": currency_from, "to": currency_to},
        )
        response.raise_for_status()

        data = response.json()
        if "rates" not in data:
            return {"error": "Invalid API response format."}

        rate = data["rates"].get(currency_to)
        if rate is None:
            return {"error": f"Exchange rate for {currency_to} not found."}

        converted_amount = amount * rate
        return {
            "converted_amount": converted_amount,
            "from_currency": currency_from,
            "to_currency": currency_to,
            "rate": rate,
        }
    except httpx.HTTPError as e:
        return {"error": f"API request failed: {e}"}
    except ValueError:
        return {"error": "Invalid JSON response from API."}


@mcp.tool()
def get_currency_exchange_rate(
    currency_from: str = "USD",
    currency_to: str = "EUR",
    currency_date: str = "latest",
):
    """Use this to get the current currency exchange rate.

    Args:
        currency_from: The currency to convert from (e.g., "USD").
        currency_to: The currency to convert to (e.g., "EUR").
        currency_date: The date for the exchange rate or "latest". Defaults to "latest".

    Returns:
        A dictionary containing the exchange rate data, or an error message if the request fails.
    """
    try:
        response = httpx.get(
            f"https://api.frankfurter.app/{currency_date}",
            params={"from": currency_from, "to": currency_to},
        )
        response.raise_for_status()

        data = response.json()
        if "rates" not in data:
            return {"error": "Invalid API response format."}
        return data
    except httpx.HTTPError as e:
        return {"error": f"API request failed: {e}"}
    except ValueError:
        return {"error": "Invalid JSON response from API."}


app = FastAPI(lifespan=lambda _: mcp.session_manager.run())

# Add IdentityServiceMiddleware for authentication
app.add_middleware(
    IdentityServiceMCPMiddleware,
)

app.mount("/", mcp.streamable_http_app())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9090)

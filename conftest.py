"""pytest config for the exported suite.

The `page` fixture is provided by pytest-playwright (see requirements.txt);
it launches a fresh headless Chromium context per test. Run headed with
`pytest --headed`, or another browser with `--browser firefox`.

Login-gated app? These tests assume they start already authenticated. Point
QA_STORAGE_STATE at a Playwright storage_state JSON and every test's context
loads that session:

    playwright codegen --save-storage=auth.json https://your-app/login   # save once
    QA_STORAGE_STATE=auth.json pytest                                     # reuse it

No credentials live in this repo — only the path to a session you provide.
"""
import os

import pytest


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    """Reuse a saved auth session when QA_STORAGE_STATE points at one."""
    state = os.environ.get("QA_STORAGE_STATE")
    if state and os.path.exists(state):
        return {**browser_context_args, "storage_state": state}
    return browser_context_args

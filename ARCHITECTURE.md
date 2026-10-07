# Free Game Notifier

Python 3.12 + GitHub Actions rewrite of the original notifier.

## Flow

4Gamers RSS → article filter → article parser → Gemini extraction → validation → Steam price resolver → Discord Embed → processed state

The old Code.gs is retained temporarily as the behavior reference until the rewrite is verified.

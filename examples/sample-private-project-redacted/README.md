# Sample Private Project - Redacted

This folder shows the kind of public-safe context a user can add before running `pow-portfolio` on a private or team project.

The sample intentionally avoids source code, secrets, customer names, internal URLs, and proprietary implementation details.

Suggested flow:

```bash
npx pow-portfolio init
# copy manual_notes.redacted.md into .pow/manual_notes.md and edit it
npx pow-portfolio collect --repo .
npx pow-portfolio brief
npx pow-portfolio export
```

Expected generated outputs live in the user's local `.pow/` folder, not in this example directory.

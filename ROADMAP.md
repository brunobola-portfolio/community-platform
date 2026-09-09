# Roadmap

What is planned, in the order it is likely to ship. Nothing here is available today; the
[CHANGELOG](CHANGELOG.md) is the record of what is. Items come from the known limitations
in [SECURITY.md](SECURITY.md) and from what reference deployments ask for.

| Item | Why |
| --- | --- |
| Email verification on member sign-up | Today any address can register; a verified address is the base for password recovery and notifications |
| Sign-in throttling per account and per address | The password provider only enforces the password policy; repeated attempts are not slowed down |
| Per-document visibility (board only, members, public) | The members' archive is one bucket visible to every signed-in account |
| Media Studio cleanup of orphaned uploads | Generated images that are never attached stay in storage |
| A stored photo count per album | The gallery still counts every photo row on each change |
| Facebook Graph feed on the news page | The settings hold a page id used only for the footer link; 2.9.0 removed the unused access-token field until a feed reads it |

Suggestions and priorities: open an issue on the repository or write to bruno@bolalabs.pt.

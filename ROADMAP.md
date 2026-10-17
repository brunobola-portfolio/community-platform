# Roadmap

What is planned, in the order it is likely to ship. Nothing here is available today; the
[CHANGELOG](CHANGELOG.md) is the record of what is. Items come from the known limitations
in [SECURITY.md](SECURITY.md) and from what reference deployments ask for.

| Item | Why |
| --- | --- |
| Sign-in throttling per account and per address | The password provider only enforces the password policy; repeated attempts are not slowed down |
| Per-document visibility (board only, members, public) | The members' archive is one bucket visible to every signed-in account |
| "Forgot my password" by email | Email delivery exists since 2.21.0; today an administrator resets passwords in Acessos |
| Notices to members by email | "Avisos aos sócios" reach the member area only; the delivery pipeline can carry them |
| Bounce and complaint webhooks from the email provider | The delivery log knows a message left, not whether it bounced |
| Facebook Graph feed on the news page | The settings hold a page id used only for the footer link |

Suggestions and priorities: open an issue on the repository or write to bruno@bolalabs.pt.

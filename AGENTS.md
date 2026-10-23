<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Account identity uses one React AuthProvider with the generated Supabase browser client; public account pages show a sign-in state and private queries rely on owner RLS, so no duplicate route gates or simulated identity are used.
- Access status is derived exclusively from valid access_grants read through the user's session; metadata never grants privileges.

# Recipes: networking

Send data between your mod's server half and its client half: a message to a player, a request from a client, a struct instead of loose bytes, and a command that sends data. Both halves are the same mod, in the same `.hmod` and the same `src/lib.rs`.

Every recipe here needs the Rust part of a mod: start with `cargo horizon-mod new my_mod --template native`, or add code to a mod you have ([Add code to your mod](/docs/mod-code)).

> [!NOTE] Checked against the mod API at `de8b4e2`
> Checked against the mod API at [arismoko/horizon `de8b4e2`](https://github.com/arismoko/horizon/tree/de8b4e2526df9d7f611515b78123a26a3914176f), which Sunrise merges. The Rust examples below were compile-checked against horizon-mod-api, with the final command methods added to the mana example's `Hooks` implementation. They were not tried in game.

## Before you start: one mod, two sides

- The **server** half runs in server hooks (`&mut dyn ServerHost`). The **client** half runs in client hooks (`&mut dyn ClientHost`). In single player both run, in the same game.
- Use `side = "both"` for these examples ([The manifest](/docs/mod-manifest)). This mod belongs on the server and its clients; its required payload declarations must agree at join.
- Register namespaced payload IDs such as `my_mod:hello` in `Hooks::register`. Each receiving direction has one handler, not a broadcast to every mod.

> [!TIP] Register typed payloads
> Derive `PayloadCodec` for a message, register it, and keep the returned `ToClient<T>` or `ToServer<T>` token. The game encodes and decodes the value and negotiates its schema. Native and wasm mods use the same API. See [Client networking](/docs/modding/how-to/client/networking).

## Send a message to a player

**Status:** Works today with compatible registered payloads on both peers.

**You get:** when a player joins, the server sends them a line, and their client shows it in chat.

**File:** `src/lib.rs`

```rust
use mod_api::*;
use std::sync::OnceLock;

#[derive(PayloadCodec)]
struct Hello {
    text: String,
}

static HELLO: OnceLock<ToClient<Hello>> = OnceLock::new();

#[derive(Default)]
struct Mod;

#[mod_api::horizon_mod]
impl Hooks for Mod {
    fn register(&self, r: &mut dyn Registrar, _: &RegistrationContext) {
        let mut payloads = r.payload_handlers();
        let mut view = payloads.registrar("1");
        let token = view.play_to_client_typed::<Hello>(
            PayloadId("my_mod:hello".into()),
            |value, cx| {
                let host = cx.client_host().map_err(|e| format!("{e:?}"))?;
                host.chat_line(Text::literal(value.text)).map_err(|e| format!("{e:?}"))
            },
        );
        let _ = HELLO.set(token);
    }

    fn player_logged_in(&self, host: &mut dyn ServerHost, event: &mut PlayerLoggedInEvent<'_>) {
        if let (Some(token), Some(player)) = (HELLO.get(), host.player(event.player)) {
            let message = Hello { text: format!("Welcome, {}!", event.name) };
            let _ = token.send(host, player, &message);
        }
    }
}
```

- `ToClient::send` takes a `PlayerRef`, obtained here from the joining player's UUID.
- The default handler executor is the receiving main thread. `cx.client_host()` gives the client host there.
- `Ok(PayloadAccepted::Queued)` means accepted locally, not delivered. These short examples discard send errors; a real mod should handle them.

**Try it:** build into your test instance, open a world: the welcome line should appear in chat.

## Send a request from the client to the server

**Status:** Works with a negotiated serverbound payload.

**You get:** `/ping` typed on the client sends a request; the server answers in chat.

```rust
use mod_api::*;
use std::sync::OnceLock;

#[derive(PayloadCodec)]
struct Ping {
    nonce: i32,
}

static PING: OnceLock<ToServer<Ping>> = OnceLock::new();

#[derive(Default)]
struct Mod;

#[mod_api::horizon_mod]
impl Hooks for Mod {
    fn register(&self, r: &mut dyn Registrar, _: &RegistrationContext) {
        let mut payloads = r.payload_handlers();
        let mut view = payloads.registrar("1");
        let token = view.play_to_server_typed::<Ping>(
            PayloadId("my_mod:ping".into()),
            |_value, cx| {
                let player = cx.player().map_err(|e| format!("{e:?}"))?;
                let host = cx.server_host().map_err(|e| format!("{e:?}"))?;
                player.tell(host, Text::literal("Pong!")).map(drop).map_err(|e| format!("{e:?}"))
            },
        );
        let _ = PING.set(token);
    }

    fn register_client_commands(&self, _: &mut dyn ClientHost, event: &mut RegisterClientCommandsEvent<'_>) {
        event.commands.push(Command::new("ping"));
    }

    fn command(&self, host: &mut dyn ClientHost, event: &mut CommandEvent<'_>) -> Flow {
        if event.command != "ping" {
            return Flow::Continue;
        }
        if let Some(token) = PING.get() {
            if let Err(why) = token.send(host, &Ping { nonce: 0 }) {
                let _ = host.chat_line(Text::literal(format!("Can't ping: {why:?}")));
            }
        }
        Flow::Cancel
    }
}
```

- `cx.player()` identifies the connection's player in play, not a player chosen from the message body.
- `PayloadCodec` checks the wire representation. Your handler must still validate application rules, permissions and ranges before changing game state.

**Try it:** open a world, type `/ping`.

**Common mistakes:**

- Sending before negotiation or without a connection: a send returns a named error, such as `NotNegotiated` or `Disconnected`.
- Treating a decoded value as permission to act: a modified client can choose its values.
- Asking for a world host in a network-thread handler: use `enqueue_work` to run world work on the main thread. The examples keep the default main-thread executor.

## A struct instead of bytes

**Status:** Works today, including registered typed payloads.

**You get:** the server sends a mana value, and the client decodes it and shows it in chat. Keep the token returned by registration; do not encode a separate envelope around the message.

```rust
use mod_api::*;
use std::sync::OnceLock;

#[derive(PayloadCodec)]
struct ManaUpdate {
    current: i32,
    max: i32,
    reason: String,
}

static MANA: OnceLock<ToClient<ManaUpdate>> = OnceLock::new();

#[derive(Default)]
struct Mod;

#[mod_api::horizon_mod]
impl Hooks for Mod {
    fn register(&self, r: &mut dyn Registrar, _: &RegistrationContext) {
        let mut payloads = r.payload_handlers();
        let mut view = payloads.registrar("1");
        let token = view.play_to_client_typed::<ManaUpdate>(
            PayloadId("my_mod:mana".into()),
            |value, cx| {
                let host = cx.client_host().map_err(|e| format!("{e:?}"))?;
                host.chat_line(Text::literal(format!(
                    "Mana: {}/{} ({})", value.current, value.max, value.reason,
                ))).map_err(|e| format!("{e:?}"))
            },
        );
        let _ = MANA.set(token);
    }
}

fn send_mana(host: &mut dyn ServerHost, player: PlayerRef, current: i32, max: i32) {
    if let Some(token) = MANA.get() {
        let message = ManaUpdate { current, max, reason: "command".into() };
        let _ = token.send(host, player, &message);
    }
}
```

- The body is the value's `PayloadCodec` encoding: fields in order, VarInt lengths and big-endian fixed-width numbers.
- A malformed typed body closes the session, naming the mod, before the handler runs. Encoding a value outside codec bounds returns `EncodeFailed` before queueing it.
- The derive supplies a schema fingerprint. A required peer with another shape is refused at join; when both peers declare a payload `optional()`, an incompatible or absent payload is unavailable and sends return `UnsupportedPeer`.
- Both sides use the same struct. The registration version (`"1"` here) and schema participate in negotiation.

> [!TIP] Sending NBT
> For NBT, wrap it in a `Tag` (`Tag::Compound(compound)`): `tag.to_network_bytes()` writes vanilla's network NBT, and `Tag::from_network_bytes(&bytes, None)` reads it back, with the number of bytes it used. See [Maths and network NBT](/docs/modding/reference/maths-and-network-nbt).

## A command that sends data to a player

**Status:** Works today.

**You get:** `/setmana <player> <amount>`, run by an operator, sends the new value to that player's client. Add these methods inside the mana example's `impl Hooks for Mod`.

```rust
fn register_commands(&self, _: &mut dyn ServerHost, event: &mut RegisterCommandsEvent<'_>) {
    event.commands.push(Command::op("setmana <target:player> <amount:integer>", 2));
}

fn run_mod_command(&self, host: &mut dyn ServerHost, event: &mut RunModCommandEvent<'_>) -> Flow {
    if event.command.literals.first().map(String::as_str) != Some("setmana") {
        return Flow::Continue;
    }
    let (Some(CommandArgumentValue::Player(target)), Some(CommandArgumentValue::Integer(amount))) =
        (event.command.argument("target"), event.command.argument("amount"))
    else {
        return Flow::Continue;
    };
    send_mana(host, *target, *amount, 100);
    let _ = host.commands().feedback(Text::literal(format!("Mana set to {amount}")));
    Flow::Cancel
}
```

More on commands: [Commands](/docs/recipes-commands).

> [!TIP] Keeping a value in step
> If the value belongs in a player, entity or block entity attachment and should match on the client, use an attachment with `sync: true`. See [A value on the player that the HUD shows](/docs/recipes-saved-data#a-value-on-the-player-that-the-hud-shows).

## Limits to know

- Sends check connection byte budgets and whole-packet framing; `Backpressure` and `FrameTooLarge` report refusals.
- `Queued` is local acceptance only. Disconnect invalidates pending work; a handler's replies are staged in its transaction.
- Payload handlers default to the logical receiving main thread. A network executor has no direct world access.
- Required declarations must match at join. Use `optional()` only when the feature can work without that payload on the peer.

## What `Wire` is for

`#[derive(mod_api::Wire)]` is not the network payload codec: it describes the shared-memory boundary between the game and wasm mods, including mod-to-mod calls. Derive it for your own types that cross that boundary. For network message bodies, use `PayloadCodec`. More: [Wire types](/docs/modding/concepts/wire-types).

## What these recipes do not cover

- **A vanilla peer running your mod's handlers.** These recipes require compatible payload declarations and code on both peers; they are not a way to install mod logic on an unmodified client or server.
- **A full configuration-phase recipe on this page.** The API already has `configuration_*` and `common_*` registration methods. Configuration handlers cannot obtain a play player from `cx.player()`.
- More on registration, tokens and optional peers: [Client networking](/docs/modding/how-to/client/networking).

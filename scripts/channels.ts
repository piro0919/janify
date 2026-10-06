// アーティストごとに YouTube のチャンネルの候補を検索し、data/raw/channel-candidates.json に書く。
// 公式かどうかは機械では決めきれないので、名前と登録者数を見て scripts/channels.json に手で選ぶ。
// 検索は1回100単位なので、50組で5000単位を使う
import { readFile, writeFile } from "node:fs/promises";
import { youtube } from "./lib/youtube";

type Artist = { name: string };

async function main() {
  const artists: Artist[] = JSON.parse(await readFile("data/raw/artists.json", "utf8"));
  const result: Record<string, { id: string; title: string; subscribers: number; handle?: string }[]> = {};

  for (const artist of artists) {
    const search = await youtube<{ items: { id: { channelId: string } }[] }>("search", {
      part: "id",
      type: "channel",
      q: artist.name,
      maxResults: "5",
      regionCode: "JP",
    });
    const ids = search.items.map((i) => i.id.channelId);
    if (ids.length === 0) continue;
    const channels = await youtube<{
      items: { id: string; snippet: { title: string; customUrl?: string }; statistics: { subscriberCount?: string } }[];
    }>("channels", { part: "snippet,statistics", id: ids.join(",") });
    result[artist.name] = channels.items
      .map((c) => ({
        id: c.id,
        title: c.snippet.title,
        handle: c.snippet.customUrl,
        subscribers: Number(c.statistics.subscriberCount ?? 0),
      }))
      .sort((a, b) => b.subscribers - a.subscribers);
    console.error(`${artist.name}: ${result[artist.name].map((c) => `${c.title}(${c.subscribers})`).join(" / ")}`);
  }

  await writeFile("data/raw/channel-candidates.json", `${JSON.stringify(result, null, 2)}\n`);
}

main();

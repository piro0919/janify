// data/raw/matches.json の当てはめを、Notion の「曲」の YouTube と動画の列へ書く。
// 最初の一回だけ使う。行の特定には notion-import.ts が残した data/raw/notion-progress.json を使う。
// すでに YouTube が入っている行は、手で直したものかもしれないので上書きしない
import { readFile } from "node:fs/promises";
import { notion, queryAll } from "./lib/notion";

type Match = { videoId: string; kind: "mv" | "audio" };

async function main() {
  const ids = JSON.parse(await readFile("scripts/notion-ids.json", "utf8"));
  const progress: Record<string, string> = JSON.parse(await readFile("data/raw/notion-progress.json", "utf8"));
  const matches: Record<string, Match> = JSON.parse(await readFile("data/raw/matches.json", "utf8"));

  await notion("PATCH", `/data_sources/${ids.tracks}`, {
    properties: { 動画: { select: { options: [{ name: "MV" }, { name: "音源" }, { name: "非公式" }] } } },
  });

  const filled = new Set(
    (await queryAll(ids.tracks)).filter((p) => p.properties.YouTube?.url).map((p) => p.id),
  );

  const targets = Object.entries(matches).filter(([key]) => progress[key] && !filled.has(progress[key]));
  let done = 0;
  for (let i = 0; i < targets.length; i += 30) {
    await Promise.all(
      targets.slice(i, i + 30).map(([key, m]) =>
        notion("PATCH", `/pages/${progress[key]}`, {
          properties: {
            YouTube: { url: `https://www.youtube.com/watch?v=${m.videoId}` },
            動画: { select: { name: m.kind === "mv" ? "MV" : "音源" } },
          },
        }),
      ),
    );
    done += targets.slice(i, i + 30).length;
    console.error(`${done}/${targets.length}`);
  }
}

main();

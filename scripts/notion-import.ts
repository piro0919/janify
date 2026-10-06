// Wikipedia から集めた data/raw の一式を、Notion の「アーティスト」「アルバム」「曲」の3つのデータベースへ入れる。
// 最初の一回だけ使う。以後の正本は Notion で、直すのも Notion。
// データベースが無ければ親ページの下に作り、ID を scripts/notion-ids.json に残す。
// 途中で止まっても、作った行は data/raw/notion-progress.json に記録してあるので、走らせ直せば続きから入る
import { existsSync, writeFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { notion, title } from './lib/notion';

const PARENT_PAGE = '3f12c3b9-390c-81fc-b8d2-cc9e2ada21c4';
const IDS_FILE = 'scripts/notion-ids.json';
const PROGRESS_FILE = 'data/raw/notion-progress.json';

type Ids = { artists: string; albums: string; tracks: string };
type Artist = { name: string; page: string };
type Album = { artist: string; title: string; page: string; year: number | null; tracks: string[] };

const wikipedia = (page: string) =>
  `https://ja.wikipedia.org/wiki/${encodeURIComponent(page.replace(/ /g, '_'))}`;

async function createDatabase(name: string, properties: Record<string, unknown>): Promise<string> {
  const db = await notion<{ data_sources: { id: string }[] }>('POST', '/databases', {
    parent: { type: 'page_id', page_id: PARENT_PAGE },
    title: [{ text: { content: name } }],
    initial_data_source: { properties },
  });
  return db.data_sources[0].id;
}

async function ensureDatabases(): Promise<Ids> {
  if (existsSync(IDS_FILE)) return JSON.parse(await readFile(IDS_FILE, 'utf8'));

  const artists = await createDatabase('アーティスト', {
    名前: { title: {} },
    Wikipedia: { url: {} },
    掲載: { checkbox: {} },
  });
  const albums = await createDatabase('アルバム', {
    タイトル: { title: {} },
    アーティスト: { relation: { data_source_id: artists, single_property: {} } },
    発売年: { number: {} },
    Wikipedia: { url: {} },
    掲載: { checkbox: {} },
  });
  const tracks = await createDatabase('曲', {
    曲名: { title: {} },
    アルバム: { relation: { data_source_id: albums, single_property: {} } },
    曲順: { number: {} },
    YouTube: { url: {} },
    動画: { select: { options: [{ name: '公式' }, { name: '非公式' }] } },
    掲載: { checkbox: {} },
  });

  const ids = { artists, albums, tracks };
  await writeFile(IDS_FILE, `${JSON.stringify(ids, null, 2)}\n`);
  return ids;
}

async function main() {
  const ids = await ensureDatabases();
  const artists: Artist[] = JSON.parse(await readFile('data/raw/artists.json', 'utf8'));
  const albums: Album[] = JSON.parse(await readFile('data/raw/albums.json', 'utf8'));
  const progress: Record<string, string> = existsSync(PROGRESS_FILE)
    ? JSON.parse(await readFile(PROGRESS_FILE, 'utf8'))
    : {};

  // 止めたときに記録から漏れると行が二重にできるので、1行ごとに書き残す
  const save = async () => {
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress));
  };

  async function create(
    key: string,
    dataSource: string,
    properties: Record<string, unknown>,
  ): Promise<string> {
    if (progress[key]) return progress[key];
    const page = await notion<{ id: string }>('POST', '/pages', {
      parent: { type: 'data_source_id', data_source_id: dataSource },
      properties,
    });
    progress[key] = page.id;
    await save();
    return page.id;
  }

  const withAlbums = artists.filter((a) => albums.some((al) => al.artist === a.name));
  const total = albums.reduce((n, a) => n + a.tracks.length, 0);
  let done = 0;

  for (const artist of withAlbums) {
    const artistId = await create(`artist:${artist.page}`, ids.artists, {
      名前: title(artist.name),
      Wikipedia: { url: wikipedia(artist.page) },
      掲載: { checkbox: true },
    });

    for (const album of albums.filter((a) => a.artist === artist.name)) {
      const albumKey = `album:${artist.page}:${album.page}`;
      const albumId = await create(albumKey, ids.albums, {
        タイトル: title(album.title),
        アーティスト: { relation: [{ id: artistId }] },
        発売年: { number: album.year },
        Wikipedia: { url: wikipedia(album.page) },
        掲載: { checkbox: true },
      });

      // アルバムの曲はまとめて送る。送る間隔は lib/notion が守る
      await Promise.all(
        album.tracks.map((track, i) =>
          create(`track:${albumKey}:${i}`, ids.tracks, {
            曲名: title(track),
            アルバム: { relation: [{ id: albumId }] },
            曲順: { number: i + 1 },
            掲載: { checkbox: true },
          }),
        ),
      );
      done += album.tracks.length;
      console.error(`${artist.name} / ${album.title}（${done}/${total}）`);
    }
  }

  await save();
  console.error('完了');
}

main();

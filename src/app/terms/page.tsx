import type { Metadata } from 'next';
import Link from 'next/link';
import { Legal } from '@/components/legal';
import { CONTACT_FORM_URL, OPERATOR } from '@/lib/site';

export const metadata: Metadata = { title: '利用規約' };

export default function TermsPage() {
  return (
    <Legal title="利用規約" updated="2026年10月7日">
      <p>
        この規約は、{OPERATOR} が運営する
        Janify（以下「本サイト」）の利用について定めます。本サイトを利用した時点で、この規約に同意したものとみなします。
      </p>

      <h2>本サイトについて</h2>
      <p>
        本サイトは、旧ジャニーズ事務所に所属していたアーティストの曲を、YouTube
        に公開されている動画の埋め込みでアルバムごとに聴けるようにした、個人の非公式サイトです。各アーティスト、所属事務所、レコード会社とは関係ありません。
      </p>
      <p>
        本サイトは音声や動画のファイルを保存・配信しておらず、再生はすべて YouTube
        のプレイヤーで行われます。
      </p>

      <h2>YouTube の利用</h2>
      <p>
        本サイトは YouTube API Services を使っています。本サイトを利用する方は、
        <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">
          YouTube 利用規約
        </a>
        にも同意したものとみなします。利用者の情報の扱いは、
        <Link href="/privacy">プライバシーポリシー</Link>
        をご覧ください。
      </p>

      <h2>権利について</h2>
      <p>
        動画・楽曲・サムネイル・チャンネルのアイコンの著作権その他の権利は、それぞれの権利者に帰属します。アーティスト名・アルバム名・曲名などの情報は、Wikipedia
        などの公開情報をもとにしています。
      </p>

      <h2>掲載の取り下げ</h2>
      <p>
        掲載している動画について、権利者の方から削除のご依頼をいただいた場合は、確認のうえ速やかに掲載を取り下げます。
        <a href={CONTACT_FORM_URL} target="_blank" rel="noopener noreferrer">
          お問い合わせフォーム
        </a>
        からご連絡ください。曲名などの誤りのご報告も同じフォームで受け付けています。
      </p>

      <h2>禁止事項</h2>
      <ul>
        <li>本サイトの運営を妨げる行為</li>
        <li>本サイトに大量のアクセスを自動で送る行為</li>
        <li>法令や公序良俗に反する行為</li>
      </ul>

      <h2>免責</h2>
      <p>
        本サイトの情報の正確さ・完全さは保証しません。動画は YouTube
        側で削除・非公開・地域制限などにより、予告なく再生できなくなることがあります。
      </p>
      <p>
        本サイトの利用によって生じた損害について、{OPERATOR}
        は責任を負いません。本サイトは、予告なく内容を変更し、または公開を終了することがあります。
      </p>

      <h2>この規約の変更</h2>
      <p>
        この規約は、必要に応じて変更することがあります。変更したときは、このページでお知らせします。
      </p>
    </Legal>
  );
}

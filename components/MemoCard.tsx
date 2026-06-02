"use client";

import { useState } from "react";
import { FixedMediaShelf } from "./MediaRenderer";
import ReplyTree from "./ReplyTree";

function plainMemoText(text) {
  return String(text || "")
    .replace(/\[media:[^\]]+\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function displayMemoDateTime(memo) {
  return `${String(memo.date || "").replaceAll("-", "/")} ${
    memo.time || "--:--"
  }`;
}

function TagList({ tags = [], small = false }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${small ? "mt-3" : "mt-5"}`}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-gradient-to-r from-white to-gray-100 border border-white/80 shadow-sm px-3 py-1 text-xs text-gray-600"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}

function ActionIcons({
  onEdit,
  onPin,
  onBookmark,
  onDelete,
  onReply,
  bookmarked,
  pinned,
  Icon,
}) {
  return (
    <div className="flex justify-end items-center gap-4 mt-6 text-gray-400">
      <button
        title="編集"
        onClick={onEdit}
        className="hover:text-blue-500 transition"
      >
        <Icon name="editBox" className="w-4.5 h-4.5" />
      </button>

      <button
        title="トップに固定"
        onClick={onPin}
        className={`${
          pinned ? "text-blue-500" : "hover:text-blue-500"
        } transition`}
      >
        <Icon name="pin" className="w-4 h-4" filled={pinned} />
      </button>

      <button
        title="ブックマーク"
        onClick={onBookmark}
        className={`${
          bookmarked ? "text-yellow-500" : "hover:text-yellow-500"
        } transition`}
      >
        <Icon
          name="bookmark"
          className="w-4 h-4"
          filled={bookmarked}
        />
      </button>

      <button
        title="削除"
        onClick={onDelete}
        className="hover:text-red-500 transition"
      >
        <Icon name="trash" className="w-4 h-4" />
      </button>

      <button
        title="返信"
        onClick={onReply}
        className="hover:text-gray-700 transition"
      >
        <Icon name="reply" className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function MemoCard({
  memo,
 typeFilter,
  typeStyle,
  Icon,
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete,
  onUpdate,
  onReply,
  onEditReply,
  onDeleteReply,
  renderText,
}) {
  const [noteExpanded, setNoteExpanded] = useState(false);

  const style = typeStyle[memo.type] || typeStyle.つぶやき;
  const isNote = memo.type === "ノート";
  const plainText = plainMemoText(memo.text);

  const shouldCollapseNote =
    isNote && plainText.length > 140 && !noteExpanded;

  const notePreviewText = shouldCollapseNote
    ? `${plainText.slice(0, 140)}...`
    : plainText;

  const bottomMedia = (memo.media || []).filter(
    (m) =>
      !String(memo.text || "").includes(`[media:${m.id}]`)
  );

  return (
    <div className="relative bg-white/85 backdrop-blur-xl rounded-[28px] p-8 shadow-sm border border-white/70 overflow-hidden">
      <div
        className={`absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b ${style.button}`}
      />

      <div className="flex justify-between items-start mb-4">
        <div
          className={`inline-block px-4 py-1 rounded-full text-white text-sm font-bold bg-gradient-to-r ${style.chip}`}
        >
          {memo.type}
        </div>

        <div className="text-gray-400 text-sm">
          {displayMemoDateTime(memo)}
        </div>
      </div>

      {memo.pinned && (
        <div className="text-blue-500 text-sm font-bold mb-3">
          📌 トップに固定
        </div>
      )}

      <h3
        onClick={() =>
          isNote && setNoteExpanded((prev) => !prev)
        }
        className={`text-3xl font-bold mb-4 ${
          isNote
            ? "cursor-pointer hover:text-green-700 transition"
            : ""
        }`}
      >
        {memo.title}
      </h3>

      <div
        onClick={() =>
          isNote && setNoteExpanded((prev) => !prev)
        }
        className={`text-gray-600 leading-relaxed mb-4 ${
          isNote ? "cursor-pointer" : ""
        }`}
      >
        {isNote ? (
          shouldCollapseNote ? (
            <span className="whitespace-pre-wrap">
              {notePreviewText}
            </span>
          ) : (
            renderText(memo)
          )
        ) : (
          <span className="whitespace-pre-wrap">
            {memo.text}
          </span>
        )}
      </div>

      {isNote && plainText.length > 140 && (
        <button
          onClick={() => setNoteExpanded((prev) => !prev)}
          className="mb-4 rounded-full bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-2 text-sm font-bold text-green-700 hover:shadow-sm transition"
        >
          {noteExpanded ? "閉じる" : "全文を表示"}
        </button>
      )}

      {(!isNote || noteExpanded) &&
        bottomMedia.length > 0 && (
          <FixedMediaShelf media={bottomMedia} />
        )}

      <TagList tags={memo.tags} />

      <ActionIcons
        onEdit={() => onEdit(memo)}
        onPin={() =>
          onUpdate(memo.id, {
            pinned: !memo.pinned,
          })
        }
        onBookmark={() =>
          onUpdate(memo.id, {
            bookmarked: !memo.bookmarked,
          })
        }
        onDelete={() => onDelete(memo.id)}
        onReply={() =>
          onReply({
            type: "memo",
            memoId: memo.id,
          })
        }
        bookmarked={memo.bookmarked}
        pinned={memo.pinned}
        Icon={Icon}
      />

      {typeFilter === "ゴミ箱" && (
  <div className="mt-4 flex justify-end gap-2">
    <button
      type="button"
      onClick={() => onRestore(memo.id)}
      title="元に戻す"
      className="rounded-full bg-green-50 px-3 py-2 text-sm font-bold text-green-600 hover:bg-green-100"
    >
      ↩ 元に戻す
    </button>

    <button
      type="button"
      onClick={() => onPermanentDelete(memo.id)}
      className="rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
    >
      このメモを削除する
    </button>
  </div>
)}

      <ReplyTree
        replies={memo.replies}
        memoId={memo.id}
        onReply={onReply}
        onEditReply={onEditReply}
        onDeleteReply={onDeleteReply}
        Icon={Icon}
      />
    </div>
  );
}

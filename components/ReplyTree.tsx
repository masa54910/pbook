"use client";

import { FixedMediaShelf } from "./MediaRenderer";

export default function ReplyTree({
  replies,
  memoId,
  onReply,
  onEditReply,
  onDeleteReply,
  Icon,
}) {
  if (!replies || replies.length === 0) return null;

  return (
    <div className="mt-6 border-l-2 border-gray-200 pl-5 space-y-4">
      {replies.map((reply) => (
        <ReplyNode
          key={reply.id}
          reply={reply}
          memoId={memoId}
          depth={0}
          onReply={onReply}
          onEditReply={onEditReply}
          onDeleteReply={onDeleteReply}
          Icon={Icon}
        />
      ))}
    </div>
  );
}

function ReplyNode({
  reply,
  memoId,
  depth,
  onReply,
  onEditReply,
  onDeleteReply,
  Icon,
}) {
  return (
    <div className="text-sm">
      <div className="rounded-2xl bg-gray-50/80 p-4 border border-gray-100">
        <div className="text-gray-400 mb-2">
          {reply.createdAt}
        </div>

        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {reply.text}
        </div>

        <FixedMediaShelf media={reply.media || []} />

        <TagList tags={reply.tags} small />

        <div className="flex justify-end gap-3 mt-3 text-gray-400 text-base">
          <button
            title="編集"
            onClick={() => onEditReply(reply, memoId)}
            className="hover:text-blue-500"
          >
            <Icon name="edit" className="w-4 h-4" />
          </button>

          <button
            title="削除"
            onClick={() => onDeleteReply(memoId, reply.id)}
            className="hover:text-red-500"
          >
            <Icon name="trash" className="w-4 h-4" />
          </button>

          <button
            title="返信"
            onClick={() =>
              onReply({
                type: "reply",
                memoId,
                replyId: reply.id,
              })
            }
            className="hover:text-gray-700"
          >
            <Icon name="reply" className="w-4 h-4" />
          </button>
        </div>
      </div>

      {(reply.replies || []).length > 0 && (
        <div className="mt-3 ml-5 border-l-2 border-gray-200 pl-4 space-y-3">
          {reply.replies.map((child) => (
            <ReplyNode
              key={child.id}
              reply={child}
              memoId={memoId}
              depth={depth + 1}
              onReply={onReply}
              onEditReply={onEditReply}
              onDeleteReply={onDeleteReply}
              Icon={Icon}
            />
          ))}
        </div>
      )}
    </div>
  );
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
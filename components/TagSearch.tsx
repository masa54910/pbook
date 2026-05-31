"use client";

export default function TagSearch({
  search,
  setSearch,
  allTags,
}) {
  return (
    <>
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="検索 / #タグ"
          className="w-full rounded-2xl px-4 py-3 bg-white/80 shadow-sm outline-none border border-white/80 text-sm"
        />
      </div>

      <div className="mb-7">
        <p className="text-xs text-gray-400 mb-2">
          #タグ候補
        </p>

        <div className="flex flex-wrap gap-2">
          {allTags.length === 0 ? (
            <span className="text-xs text-gray-400">
              タグはまだありません
            </span>
          ) : (
            allTags.slice(0, 4).map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => setSearch(`#${tag}`)}
                className="rounded-full bg-gradient-to-r from-white to-gray-100 border border-white/80 shadow-sm px-3 py-1 text-xs text-gray-600 hover:shadow-md transition"
              >
                #{tag}{" "}
                <span className="text-gray-400">
                  {count}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
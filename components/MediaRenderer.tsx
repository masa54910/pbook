"use client";

export function MediaPreview({
  media,
  editing = false,
  onWidthChange,
}) {
  const width = media.width || 64;

  const widthStyle = {
    width: `${width}%`,
    maxWidth: "100%",
  };

  return (
    <div className="my-3">

      {media.kind === "image" && media.url && (
        <img
          src={media.url}
          alt="添付画像"
          className="rounded-2xl object-cover"
          style={widthStyle}
        />
      )}

      {media.kind === "video" && media.url && (
        <video
          src={media.url}
          controls
          className="rounded-2xl"
          style={widthStyle}
        />
      )}

      {media.kind === "file" && (
        <div className="w-16 h-16 rounded-2xl bg-white border flex items-center justify-center text-2xl">
          📎
        </div>
      )}

      {!media.url && media.kind !== "file" && (
        <div className="rounded-2xl bg-gray-100 text-gray-400 p-5 text-sm">
          画像・動画は再読み込み後は再添付が必要です
        </div>
      )}

      {editing &&
        (media.kind === "image" ||
          media.kind === "video") && (
          <input
            type="range"
            min="30"
            max="100"
            value={width}
            onChange={(e) =>
              onWidthChange?.(
                media.id,
                Number(e.target.value)
              )
            }
            className="mt-3 w-full"
          />
        )}

    </div>
  );
}

export function FixedMediaShelf({
  media,
  setMedia,
  editing = false,
  onWidthChange,
}) {

  if (!media?.length) return null;

  return (
    <div className="mt-5 grid grid-cols-2 gap-4">

      {media.map((m) => (
        <div
          key={m.id}
          className="rounded-2xl bg-gray-50 border border-gray-100 p-3"
        >

          <MediaPreview
            media={m}
            editing={editing}
            onWidthChange={onWidthChange}
          />

          {editing && setMedia && (
            <button
              onClick={() =>
                setMedia((prev) =>
                  prev.filter(
                    (x) => x.id !== m.id
                  )
                )
              }
              className="mt-2 text-xs text-red-500"
            >
              削除
            </button>
          )}

        </div>
      ))}

    </div>
  );
}
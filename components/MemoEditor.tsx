"use client";

import { FixedMediaShelf } from "./MediaRenderer";

export default function MemoEditor({
  modalType,
  editingMemo,
  formTitle,
  setFormTitle,
  formText,
  setFormText,
  formTags,
  setFormTags,
  formMedia,
  setFormMedia,
  mediaSize,
  setMediaSize,
  noteTextRef,
  allTags,
  typeStyle,
  closeModal,
  submitMemo,
  handleMediaSelect,
  changeMediaWidth,
  renderTextWithInlineMedia,
  MediaToolbar,
  TagInput,
}) {
  if (!modalType) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white/95 rounded-[32px] shadow-2xl p-8">
        <div className="flex justify-between items-center mb-6 gap-4">
          <h3 className="text-3xl font-bold">
            {editingMemo ? "編集" : "新規作成"}：{modalType}
          </h3>

          {modalType === "ノート" ? (
            <div className="flex items-center gap-3">
              <button
                onClick={closeModal}
                className="px-5 py-3 rounded-full bg-gray-100 font-bold hover:bg-gray-200 transition"
              >
                キャンセル
              </button>

              <button
                onClick={submitMemo}
                className={`px-6 py-3 rounded-full text-white font-bold bg-gradient-to-r ${typeStyle[modalType].button} shadow-md hover:shadow-lg transition`}
              >
                {editingMemo ? "更新する" : "投稿する"}
              </button>
            </div>
          ) : (
            <button
              onClick={closeModal}
              className="text-2xl text-gray-400 hover:text-gray-700"
            >
              ×
            </button>
          )}
        </div>

        {modalType !== "つぶやき" && (
          <input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="タイトル"
            className="w-full mb-4 rounded-2xl border border-gray-200 px-5 py-4 outline-none"
          />
        )}

        {modalType === "つぶやき" ? (
          <>
            <textarea
              value={formText}
              onChange={(e) => setFormText(e.target.value.slice(0, 140))}
              placeholder="いま考えていることを書く。140字以内。"
              className="w-full min-h-[130px] rounded-2xl border border-gray-200 px-5 py-4 outline-none resize-none"
            />

            <div className="flex justify-between text-sm text-gray-400 mb-4">
              <span>本文のみ140字制限</span>
              <span>{formText.length}/140</span>
            </div>

            <MediaToolbar
              type={modalType}
              mediaSize={mediaSize}
              setMediaSize={setMediaSize}
              onSelect={handleMediaSelect}
            />

            <FixedMediaShelf
              media={formMedia}
              setMedia={setFormMedia}
              editing
              onWidthChange={changeMediaWidth}
            />
          </>
        ) : modalType === "ノート" ? (
          <div className="relative">
            <div className="mb-3 flex items-center gap-3">
              <MediaToolbar
                type={modalType}
                mediaSize={mediaSize}
                setMediaSize={setMediaSize}
                onSelect={handleMediaSelect}
                compact
              />
            </div>

            <textarea
              ref={noteTextRef}
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              placeholder="＋から画像・動画・ファイルを本文途中に挿入できます。"
              className="w-full min-h-[260px] rounded-2xl border border-gray-200 px-5 py-4 outline-none resize-y leading-relaxed"
            />

            <div className="mt-4 rounded-2xl bg-gray-50 p-4 border border-gray-100">
              <p className="text-sm text-gray-400 mb-3">
                プレビュー・サイズ調整
              </p>

              <div className="text-gray-700 leading-relaxed">
                {renderTextWithInlineMedia(
                  {
                    text: formText,
                    media: formMedia,
                  },
                  true
                )}
              </div>
            </div>
          </div>
        ) : (
          <textarea
            value={formText}
            onChange={(e) => setFormText(e.target.value)}
            placeholder="ホワイトボードのメモ内容"
            className="w-full min-h-[180px] rounded-2xl border border-gray-200 px-5 py-4 outline-none resize-y"
          />
        )}

        <TagInput
          value={formTags}
          setValue={setFormTags}
          allTags={allTags}
        />

        {modalType !== "ノート" && (
  <div className="relative z-50 flex justify-end gap-3 mt-8">
    <button
      type="button"
      onClick={closeModal}
      className="relative z-50 px-6 py-3 rounded-full bg-gray-100 font-bold"
    >
      キャンセル
    </button>

    <button
      type="button"
      onClick={submitMemo}
      className={`relative z-50 px-7 py-3 rounded-full text-white font-bold bg-gradient-to-r ${TYPE_STYLE[modalType].button}`}
    >
      {editingMemo ? "更新する" : "投稿する"}
    </button>
  </div>
)}
            <button
              onClick={closeModal}
              className="px-6 py-3 rounded-full bg-gray-100 font-bold"
            >
              キャンセル
            </button>

            <button
              onClick={submitMemo}
              className={`px-7 py-3 rounded-full text-white font-bold bg-gradient-to-r ${typeStyle[modalType].button}`}
            >
              {editingMemo ? "更新する" : "投稿する"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
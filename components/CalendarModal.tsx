"use client";

export default function CalendarModal({
  show,
  close,
  calendarInfo,
  selectedDate,
  getMemoCount,
  setSelectedDate,
  moveMonth,
  Icon,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white/95 rounded-[32px] shadow-2xl p-7 border border-white/80">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-r from-pink-400 to-purple-400 text-white flex items-center justify-center shadow-md">
              <Icon name="calendarAlt" className="w-5 h-5" />
            </div>

            <div>
              <p className="text-xs text-gray-400 font-bold">
                メモカレンダー
              </p>
              <h3 className="text-2xl font-bold">
                {calendarInfo.year}年{calendarInfo.month}月
              </h3>
              <div className="mt-3 flex gap-2">
  <button
    type="button"
    onClick={() => moveMonth(-1)}
    className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200"
  >
    ← 前月
  </button>

  <button
    type="button"
    onClick={() => moveMonth(1)}
    className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200"
  >
    次月 →
  </button>
</div>
            </div>
          </div>

          <button
            onClick={close}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-gray-400">
          {["日", "月", "火", "水", "木", "金", "土"].map((week) => (
            <div key={week} className="py-2">
              {week}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarInfo.cells.map((cell) => {
            if (cell.blank) {
              return <div key={cell.key} className="h-14" />;
            }

            const count = getMemoCount(cell.date);
            const isSelected = selectedDate === cell.date;

            return (
              <button
                key={cell.key}
                onClick={() => {
                  setSelectedDate(cell.date);
                  close();
                }}
                className={`relative h-14 rounded-2xl font-bold transition ${
                  isSelected
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-pink-50"
                }`}
              >
                {cell.day}

                {count > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 text-[11px] w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${
                      isSelected
                        ? "bg-white text-pink-600"
                        : "bg-blue-500 text-white"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
"use client";

import TagSearch from "./TagSearch";

export default function Sidebar({
  search,
  setSearch,
  typeFilter,
setTypeFilter,
  allTags,
  navItems,
  typeStyle,
  Icon,
  openCreate,
  getMemoCount,
  selectedDate,
}) {
  return (
    <aside className="sticky top-0 h-screen overflow-y-auto w-[270px] bg-white/55 backdrop-blur-xl border-r border-white/60 shadow-[8px_0_40px_rgba(0,0,0,.04)] p-6 flex flex-col">
      <div className="mb-10 flex justify-center">
        <img
          src="/pbook-logo.png"
          alt="P Book"
          className="w-[190px] h-auto object-contain"
        />
      </div>

      <TagSearch
  search={search}
  setSearch={setSearch}
  allTags={allTags}
/>

      <div className="space-y-3 mb-8">
        {navItems.map((item) => {
          const itemStyle = typeStyle[item.key];
          const isType = Boolean(itemStyle);

          return (
            <button
              key={item.key}
              onClick={() => {
  if (["ホーム", "つぶやき", "ノート", "ホワイトボード"].includes(item.key)) {
    setTypeFilter(item.key);
  }
}}
              className={`w-full text-left px-5 py-4 rounded-2xl transition flex items-center gap-3 ${
                item.key === "ホーム"
                  ? "bg-pink-50 text-pink-600 font-bold shadow-sm"
                  : isType
                  ? `bg-gradient-to-r ${itemStyle.soft} ${itemStyle.text} hover:shadow-md`
                  : "hover:bg-white/80 text-gray-700"
              }`}
            >
              <span className="w-7 flex justify-center">
                <Icon
                  name={item.icon}
                  className="w-5 h-5"
                />
              </span>

              <span>{item.key}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto bg-white/70 rounded-3xl p-5 shadow-sm">
        <p className="text-xs text-gray-400 mb-2">
          今日のメモ
        </p>

        <p className="text-3xl font-bold">
          {getMemoCount(selectedDate)}
        </p>
      </div>
    </aside>
  );
}
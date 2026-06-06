"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CalendarModal from "../components/CalendarModal";
import { FixedMediaShelf, MediaPreview } from "../components/MediaRenderer";
import Sidebar from "../components/Sidebar";
import ReplyTree from "../components/ReplyTree";
import MemoCard from "../components/MemoCard";
const STORAGE_KEY = "pbook-memos-v4";
const MODE_STORAGE_KEY = "pbook-modes-v1";
const MODE_SELECTED_KEY = "pbook-selected-mode-v1";

const TYPE_STYLE = {
  つぶやき: {
    icon: "💬",
    actionIcon: "💬",
    button: "from-sky-400 via-blue-500 to-indigo-500",
    chip: "from-sky-500 to-blue-600",
    soft: "from-sky-50 to-blue-50",
    text: "text-blue-700",
  },
  ノート: {
    icon: "✎",
    actionIcon: "✎",
    button: "from-emerald-400 via-green-500 to-teal-500",
    chip: "from-emerald-500 to-green-600",
    soft: "from-emerald-50 to-green-50",
    text: "text-green-700",
  },
  ホワイトボード: {
    icon: "🖌",
    actionIcon: "🖌",
    button: "from-slate-400 via-gray-500 to-zinc-600",
    chip: "from-slate-500 to-gray-700",
    soft: "from-slate-50 to-gray-100",
    text: "text-gray-700",
  },
};

const NAV_ITEMS = [
  { key: "ホーム", icon: "home" },
  { key: "つぶやき", icon: "comment" },
  { key: "ノート", icon: "penAlt" },
  { key: "ホワイトボード", icon: "paintBrush" },
  { key: "ブックマーク", icon: "bookmark" },
  { key: "ゴミ箱", icon: "trash" },
];

const today = "2026-06-06";

const initialMemos = [
  {
  id: "sample-1",
  modeId: "work",
  type: "つぶやき",
    title: "今日のランチはピザ🍕",
    text: "とても美味しかった！明日は何を食べようかな。新しいカフェにも行ってみたい。",
    date: "2026-05-30",
    time: "12:30",
    tags: ["ランチ", "日常"],
    pinned: true,
    bookmarked: false,
    media: [],
    replies: [
      {
        id: "reply-1",
        text: "神保町の駅前のカフェを調べる。☕",
        tags: ["カフェ"],
        media: [],
        createdAt: "2026/05/30 12:45",
        replies: [
          {
            id: "reply-1-1",
            text: "候補を3店くらいメモしておく。",
            tags: ["候補"],
            media: [],
            createdAt: "2026/05/30 12:47",
            replies: [],
          },
        ],
      },
    ],
  },
  {
  id: "sample-2",
  modeId: "work",
  type: "ノート",
    title: "新しいプロジェクトのアイデア",
    text: "ユーザーの思考を整理し、アイデアを視覚化できるプライベート空間にする。\n\nAIを活用して、関連するアイデアを提案する機能も追加したい。",
    date: "2026-05-30",
    time: "18:45",
    tags: ["アイデア", "プロジェクト"],
    pinned: false,
    bookmarked: true,
    media: [],
    replies: [],
  },
  {
  id: "sample-3",
  modeId: "work",
  type: "ホワイトボード",
    title: "サービス改善のブレスト",
    text: "ユーザーの声を集めて、改善点を洗い出す。",
    date: "2026-05-29",
    time: "10:20",
    tags: ["改善", "UI"],
    pinned: false,
    bookmarked: false,
    media: [],
    replies: [],
  },
];

function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowText() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

function nowTimeOnly() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function displayMemoDateTime(memo) {
  return `${String(memo.date || "").replaceAll("-", "/")} ${memo.time || "--:--"}`;
}

function extractTags(input) {
  return Array.from(
    new Set(
      (String(input || "").match(/#[\p{L}\p{N}_一-龥ぁ-んァ-ヶー]+/gu) || []).map((tag) =>
        tag.replace(/^#/, "").trim()
      )
    )
  ).filter(Boolean);
}

function normalizeTagInput(input) {
  return Array.from(
    new Set(
      String(input || "")
        .split(/[\s,、，]+/)
        .map((tag) => tag.replace(/^#+/, "").trim())
        .filter(Boolean)
    )
  );
}

function mediaToken(media) {
  return `\n[media:${media.id}]\n`;
}

function safeLocalMedia(file, kind, size = "medium") {
  return {
    id: uid("media"),
    kind,
    mime: file.type,
    url: URL.createObjectURL(file),
    size,
    width: size === "large" ? 100 : size === "small" ? 38 : 64,
  };
}

function stripMediaUrlsFromReplies(replies = []) {
  return replies.map((reply) => ({
    ...reply,
    media: (reply.media || []).map((m) => ({ ...m, url: "" })),
    replies: stripMediaUrlsFromReplies(reply.replies || []),
  }));
}

function restoreReplyShape(replies = []) {
  return replies.map((reply) => ({
    ...reply,
    tags: reply.tags || [],
    media: reply.media || [],
    replies: restoreReplyShape(reply.replies || []),
  }));
}

function updateReplyTree(replies = [], targetId, updater) {
  return replies.map((reply) => {
    if (reply.id === targetId) return updater(reply);
    return { ...reply, replies: updateReplyTree(reply.replies || [], targetId, updater) };
  });
}

function deleteReplyFromTree(replies = [], targetId) {
  return replies
    .filter((reply) => reply.id !== targetId)
    .map((reply) => ({ ...reply, replies: deleteReplyFromTree(reply.replies || [], targetId) }));
}

function collectTagsFromReplies(replies = []) {
  return replies.flatMap((reply) => [
    ...(reply.tags || []),
    ...extractTags(reply.text || ""),
    ...collectTagsFromReplies(reply.replies || []),
  ]);
}

function Icon({ name, className = "w-5 h-5", filled = false }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };

  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M3.5 10.8 12 4l8.5 6.8" />
        <path d="M5.5 10.5V20h13v-9.5" />
        <path d="M9.5 20v-6h5v6" />
      </svg>
    );
  }

  if (name === "chat") {
    return (
      <svg {...common}>
        <path d="M5.2 17.6c-1.1-1.1-1.7-2.5-1.7-4.1C3.5 9.1 7.3 5.7 12 5.7s8.5 3.4 8.5 7.8-3.8 7.8-8.5 7.8c-1.2 0-2.4-.2-3.4-.7L4 21.2l1.2-3.6Z" />
      </svg>
    );
  }

  if (name === "comment") {
    return (
      <svg viewBox="0 0 512 512" className={className} fill="currentColor" aria-hidden="true">
        <path d="M256 32C114.6 32 0 125.1 0 240c0 45.1 17.7 86.8 47.7 120.9-1.9 24.5-11.4 46.3-21.4 62.9-5.6 9.2-11.1 16.6-15.2 21.6-2.1 2.6-3.8 4.5-4.9 5.7-.6.6-1 1.1-1.3 1.4l-.3.3c-4.6 4.6-5.9 11.4-3.4 17.4C3.7 476.1 9.5 480 16 480c28.7 0 57.6-8.9 81.6-19.3 23-10 42.4-21.9 54.3-30.6C183.7 441.6 218.9 448 256 448c141.4 0 256-93.1 256-208S397.4 32 256 32Z" />
      </svg>
    );
  }

  if (name === "penAlt") {
    return (
      <svg viewBox="0 0 512 512" className={className} fill="currentColor" aria-hidden="true">
        <path d="M410.3 231 291 111.7 45.4 357.3c-4.2 4.2-7.1 9.6-8.2 15.4L.7 475.1c-2.9 8.1-.9 17.2 5.2 23.3s15.2 8.1 23.3 5.2l102.4-36.5c5.8-1.1 11.2-4 15.4-8.2L410.3 231ZM507.3 84.7 427.3 4.7c-6.2-6.2-16.4-6.2-22.6 0L335 74.3 454.3 193.7 507.3 140.7c6.2-6.2 6.2-16.4 0-22.6V84.7Z" />
      </svg>
    );
  }

  if (name === "paintBrush") {
    return (
      <svg viewBox="0 0 512 512" className={className} fill="currentColor" aria-hidden="true">
        <path d="M167.1 309.4c-36.7 2.4-65.1 17.2-84.7 44.1C56.6 388.8 56 438.4 56 440v24c0 13.3 10.7 24 24 24h24c1.6 0 51.2-.6 86.5-26.4 26.9-19.6 41.7-48 44.1-84.7l-67.5-67.5ZM480.6 31.4c-41.9-41.9-109.9-41.9-151.8 0L178.7 181.5c-17.6 17.6-17.6 46.1 0 63.8l88 88c17.6 17.6 46.1 17.6 63.8 0L480.6 183.2c41.9-41.9 41.9-109.9 0-151.8Z" />
      </svg>
    );
  }

  if (name === "editBox") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" rx="3.2" />
        <path d="M8.2 15.8h2.5l5.8-5.8a1.3 1.3 0 0 0 0-1.8l-.7-.7a1.3 1.3 0 0 0-1.8 0l-5.8 5.8v2.5Z" />
        <path d="m13.2 8.3 2.5 2.5" />
      </svg>
    );
  }

  if (name === "edit") {
    return (
      <svg {...common}>
        <path d="M4 20h4.6L19.4 9.2a2.2 2.2 0 0 0 0-3.1l-1.5-1.5a2.2 2.2 0 0 0-3.1 0L4 15.4V20Z" />
        <path d="m13.8 5.6 4.6 4.6" />
      </svg>
    );
  }

  if (name === "brush") {
    return (
      <svg {...common}>
        <path d="M14.5 4.5c1.9-1.5 4.3-.4 4.9 1.5.4 1.4-.2 2.8-1.4 3.8l-6.3 5.1" />
        <path d="M4.5 19.5c2.8.2 5.2-.5 6.5-1.9 1.1-1.2 1-3.2-.2-4.4s-3.2-1.3-4.4-.2c-1.4 1.3-2.1 3.7-1.9 6.5Z" />
      </svg>
    );
  }

  if (name === "pin") {
    return (
      <svg {...common} fill={filled ? "currentColor" : "none"}>
        <path d="M9 3.8h6" />
        <path d="M10.2 4.2v6.1l-2.2 2.3v1.6h8v-1.6l-2.2-2.3V4.2" />
        <path d="M12 14.2V21" />
      </svg>
    );
  }

  if (name === "bookmark") {
    return (
      <svg viewBox="0 0 384 512" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="26" aria-hidden="true">
        <path d="M0 48C0 21.5 21.5 0 48 0h288c26.5 0 48 21.5 48 48v440c0 9-10 14.3-17.4 9.2L192 384 17.4 497.2C10 502.3 0 497 0 488V48Z" />
      </svg>
    );
  }

  if (name === "trash") {
    return (
      <svg viewBox="0 0 448 512" className={className} fill="currentColor" aria-hidden="true">
        <path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0h120.4c12.1 0 23.2 6.8 28.6 17.7L328 48h88c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 112 0 97.7 0 80s14.3-32 32-32h88l15.2-30.3ZM53.2 467c-1.7-24.7-12.2-179.8-16.7-246.3L32 144h384l-4.5 76.7c-4.5 66.5-15 221.6-16.7 246.3-1.7 25.6-22.9 45-48.5 45H101.7c-25.6 0-46.8-19.4-48.5-45ZM160 208c-8.8 0-16 7.2-16 16v192c0 8.8 7.2 16 16 16s16-7.2 16-16V224c0-8.8-7.2-16-16-16Zm128 0c-8.8 0-16 7.2-16 16v192c0 8.8 7.2 16 16 16s16-7.2 16-16V224c0-8.8-7.2-16-16-16Z" />
      </svg>
    );
  }

  if (name === "calendarAlt") {
    return (
      <svg viewBox="0 0 448 512" className={className} fill="currentColor" aria-hidden="true">
        <path d="M152 24c0-13.3-10.7-24-24-24s-24 10.7-24 24v40H64C28.7 64 0 92.7 0 128v48h448v-48c0-35.3-28.7-64-64-64h-40V24c0-13.3-10.7-24-24-24s-24 10.7-24 24v40H152V24ZM448 224H0v224c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64V224ZM112 288h64v64h-64v-64Zm96 0h64v64h-64v-64Zm96 0h64v64h-64v-64ZM112 384h64v64h-64v-64Zm96 0h64v64h-64v-64Z" />
      </svg>
    );
  }

  if (name === "reply") {
    return (
      <svg {...common}>
        <path d="M9 8 5 12l4 4" />
        <path d="M5.5 12H15a4 4 0 0 1 4 4v1" />
      </svg>
    );
  }

  return null;
}

export default function Home() {
  const [memos, setMemos] = useState(initialMemos);
  const [selectedDate, setSelectedDate] = useState(today);
  const [showCalendar, setShowCalendar] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [editingMemo, setEditingMemo] = useState(null);
  const [search, setSearch] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [typeFilter, setTypeFilter] = useState("ホーム");
  const [homeModes, setHomeModes] = useState([
    
  {
    id: "work",
    name: "仕事用メモ",
    image: "https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=1600",
  },
  {
    id: "study",
    name: "学習用メモ",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1600",
  },
]);

const [selectedModeId, setSelectedModeId] = useState("work");
const [showModeModal, setShowModeModal] = useState(false);
const [newModeName, setNewModeName] = useState("");
const [newModeImage, setNewModeImage] = useState("");
const [editingModeId, setEditingModeId] = useState(null);
const [editingModeName, setEditingModeName] = useState("");
const [modeImageInput, setModeImageInput] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const [editingReply, setEditingReply] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyTags, setReplyTags] = useState("");
  const [replyMedia, setReplyMedia] = useState([]);

  const [formTitle, setFormTitle] = useState("");
  const [formText, setFormText] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formMedia, setFormMedia] = useState([]);
  const [mediaSize, setMediaSize] = useState("medium");
  const [drawColor, setDrawColor] = useState("#111827");
  const [drawWidth, setDrawWidth] = useState(4);
  const [isMounted, setIsMounted] = useState(false);
  const [eraserWidth, setEraserWidth] = useState(24);
  const [isEraser, setIsEraser] = useState(false);
  const canvasHistoryRef = useRef([]);
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const noteTextRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        setMemos(
          parsed.map((memo) => ({
            ...memo,
            modeId: memo.modeId || "work",
            replies: restoreReplyShape(memo.replies || []),
          }))
        );
      }
    }
  } catch (error) {
    console.warn("保存データの読み込みに失敗しました", error);
  }
}, []);

useEffect(() => {
  try {
    const storedModes = localStorage.getItem(MODE_STORAGE_KEY);
    const storedSelected = localStorage.getItem(MODE_SELECTED_KEY);

    if (storedModes) {
      const parsed = JSON.parse(storedModes);

      if (Array.isArray(parsed) && parsed.length > 0) {
        setHomeModes(parsed);
      }
    }

    if (storedSelected) {
      setSelectedModeId(storedSelected);
    }
  } catch (error) {
    console.warn("モード復元失敗", error);
  }
}, []);

  useEffect(() => {
    try {
      const lightMemos = memos.map((memo) => ({
        ...memo,
        media: (memo.media || []).map((m) => ({ ...m, url: "" })),
        replies: stripMediaUrlsFromReplies(memo.replies || []),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lightMemos));
    } catch (error) {
      console.warn("localStorage保存に失敗しました。画像・動画は一時表示扱いです。", error);
    }
  }, [memos]);

  useEffect(() => {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, JSON.stringify(homeModes));
    localStorage.setItem(MODE_SELECTED_KEY, selectedModeId);
  } catch (error) {
    console.warn("モード保存失敗", error);
  }
}, [homeModes, selectedModeId]);

  const allTags = useMemo(() => {
    const tagCounts = new Map();
    memos.forEach((memo) => {
      [...(memo.tags || []), ...extractTags(memo.text || ""), ...collectTagsFromReplies(memo.replies || [])].forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
      .map(([tag, count]) => ({ tag, count }));
  }, [memos]);

    const calendarInfo = useMemo(() => {
    const [yearText, monthText] = selectedDate.split("-");
    const year = Number(yearText);
    const monthIndex = Number(monthText) - 1;
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const cells = [
      ...Array.from({ length: firstDay }, (_, index) => ({ blank: true, key: `blank-${index}` })),
      ...Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        return {
          blank: false,
          day,
          date: `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          key: `day-${day}`,
        };
      }),
    ];

    return { year, month: monthIndex + 1, cells };
  }, [selectedDate]);
  function moveMonth(diff) {
  const [yearText, monthText] = selectedDate.split("-");
  const current = new Date(Number(yearText), Number(monthText) - 1 + diff, 1);

  const y = current.getFullYear();
  const m = String(current.getMonth() + 1).padStart(2, "0");

  setSelectedDate(`${y}-${m}-01`);
}

  const visibleMemos = useMemo(() => {
    const q = search.trim().replace(/^#/, "").toLowerCase();
    return memos
  .filter((memo) => memo.modeId === selectedModeId)
  .filter((memo) => memo.date === selectedDate)
  .filter((memo) => {
  if (typeFilter === "ゴミ箱") {
    return memo.deleted === true;
  }

  if (memo.deleted === true) {
    return false;
  }

  if (typeFilter === "ホーム") return true;

  if (typeFilter === "ブックマーク") {
    return memo.bookmarked === true;
  }

  if (["つぶやき", "ノート", "ホワイトボード"].includes(typeFilter)) {
    return memo.type === typeFilter;
  }

  return true;
})
      .filter((memo) => {
        if (!q) return true;
        const replyHay = JSON.stringify(memo.replies || []);
        const hay = [memo.title, memo.text, ...(memo.tags || []), replyHay].join(" ").toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
}, [memos, selectedDate, search, selectedModeId, typeFilter]);

  const getMemoCount = (date) =>
  memos.filter((memo) => memo.modeId === selectedModeId && memo.date === date).length;
const selectedMode = homeModes.find((mode) => mode.id === selectedModeId) || homeModes[0];

function handleAddMode() {
  const cleanName = newModeName.trim();

  if (!cleanName) {
    alert("タスク名を入力してください。");
    return;
  }

  const newMode = {
    id: uid("mode"),
    name: cleanName,
    image: newModeImage || "/pbook-logo.png",
  };

  setHomeModes((prev) => [...prev, newMode]);
  setSelectedModeId(newMode.id);
  setNewModeName("");
  setNewModeImage("");
}

function startEditMode(mode) {
  setEditingModeId(mode.id);
  setEditingModeName(mode.name);
  setModeImageInput(mode.image || "");
}
function saveModeName() {
  const clean = editingModeName.trim();

  if (!clean) {
    alert("名前を入力してください");
    return;
  }

  setHomeModes((prev) =>
    prev.map((mode) =>
      mode.id === editingModeId
        ? {
            ...mode,
            name: clean,
            image: modeImageInput || mode.image,
          }
        : mode
    )
  );

  setEditingModeId(null);
  setEditingModeName("");
  setModeImageInput("");
}
function handleDeleteMode(modeId) {
  

  const targetMode = homeModes.find(
    (mode) => mode.id === modeId
  );

  const ok = window.confirm(
    `「${targetMode?.name || "このタスク"}」を削除しますか？
このタスク内のメモも削除されます。`
  );

  if (!ok) return;

  setHomeModes((prev) =>
    prev.filter((mode) => mode.id !== modeId)
  );

  setMemos((prev) =>
    prev.filter((memo) => memo.modeId !== modeId)
  );

  if (selectedModeId === modeId) {
    setSelectedModeId("work");
  }

  setEditingModeId(null);
  setEditingModeName("");
  setModeImageInput("");
}

function moveMode(modeId, direction) {
  setHomeModes((prev) => {
    const index = prev.findIndex((mode) => mode.id === modeId);
    if (index === -1) return prev;

    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= prev.length) return prev;

    const next = [...prev];
    const temp = next[index];
    next[index] = next[nextIndex];
    next[nextIndex] = temp;

    return next;
  });
}

function handleModeImageFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    setModeImageInput(String(reader.result || ""));
  };

  reader.readAsDataURL(file);
  e.target.value = "";
}

function handleNewModeImageFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    setNewModeImage(String(reader.result || ""));
  };

  reader.readAsDataURL(file);
  e.target.value = "";
}

  function openCreate(type) {
    setModalType(type);
    setEditingMemo(null);
    setFormTitle("");
    setFormText("");
    setFormTags("");
    setFormMedia([]);
    setMediaSize("medium");
    
  }

  function openEdit(memo) {
    setModalType(memo.type);
    setEditingMemo(memo);
    setFormTitle(memo.title || "");
    setFormText(memo.text || "");
    setFormTags((memo.tags || []).map((t) => `#${t}`).join(" "));
    setFormMedia(memo.media || []);
    setMediaSize("medium");
    if (memo.type === "ホワイトボード") {
  setTimeout(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const boardImage = (memo.media || []).find(
      (m) => m.kind === "image" && m.mime === "image/png"
    );

    if (!boardImage?.url) return;

    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    img.src = boardImage.url;
  }, 100);
}
  }

  function closeModal() {
    setModalType(null);
    setEditingMemo(null);
    setFormTitle("");
    setFormText("");
    setFormTags("");
    setFormMedia([]);
  }

  function handleMediaSelect(e, targetType, targetArea = "memo") {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newMedia = files.map((file) => {
      const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
      return safeLocalMedia(file, kind, mediaSize);
    });

    if (targetArea === "reply") {
      setReplyMedia((prev) => [...prev, ...newMedia]);
      e.target.value = "";
      return;
    }

    if (targetType === "ノート") {
      const textarea = noteTextRef.current;
      const start = textarea?.selectionStart ?? formText.length;
      const end = textarea?.selectionEnd ?? formText.length;
      const tokens = newMedia.map(mediaToken).join("");
      setFormText((prev) => `${prev.slice(0, start)}${tokens}${prev.slice(end)}`);
    }

    setFormMedia((prev) => [...prev, ...newMedia]);
    e.target.value = "";
  }

  function submitMemo() {
    if (!modalType) return;
    const cleanText = formText.trim();
    const cleanTitle = formTitle.trim();

    if (modalType === "つぶやき" && cleanText.length > 140) {
      alert("つぶやきは140字以内です。画像・動画・ファイルは文字数に含みません。");
      return;
    }


   const tags = Array.from(
  new Set([...normalizeTagInput(formTags), ...extractTags(cleanText)])
);

let nextMedia = formMedia;

if (modalType === "ホワイトボード") {
  const canvasMedia = getCanvasMedia();

  if (canvasMedia) {
    const otherMedia = formMedia.filter(
      (m) => !(m.kind === "image" && m.mime === "image/png")
    );

    nextMedia = [...otherMedia, canvasMedia];
  }
}

if (!cleanText && nextMedia.length === 0 && !cleanTitle) {
  alert("内容を入力してください。画像・動画・ファイルだけでも投稿できます。");
  return;
}
    const payload = {
  id: editingMemo?.id || uid("memo"),
  modeId: selectedModeId,
  type: modalType,
      title: modalType === "つぶやき" ? cleanTitle || cleanText.slice(0, 24) || "つぶやき" : cleanTitle || `${modalType}メモ`,
      text: cleanText,
      date: selectedDate,
      time: editingMemo?.time || nowTimeOnly(),
      tags,
      pinned: editingMemo?.pinned || false,
      bookmarked: editingMemo?.bookmarked || false,
media: nextMedia,
replies: editingMemo?.replies || [],
    };

    setMemos((prev) => {
      if (editingMemo) return prev.map((memo) => (memo.id === editingMemo.id ? payload : memo));
      return [payload, ...prev];
    });
    closeModal();
  }

  function deleteMemo(id) {
  if (!confirm("このメモをゴミ箱に移動しますか？")) return;

  setMemos((prev) =>
    prev.map((memo) =>
      memo.id === id
        ? { ...memo, deleted: true }
        : memo
    )
  );
}
function restoreMemo(id) {
  setMemos((prev) =>
    prev.map((memo) =>
      memo.id === id
        ? { ...memo, deleted: false }
        : memo
    )
  );
}

function permanentDeleteMemo(id) {
  if (!confirm("このメモを完全に削除しますか？この操作は元に戻せません。")) return;

  setMemos((prev) => prev.filter((memo) => memo.id !== id));
}
  function updateMemo(id, patch) {
    setMemos((prev) => prev.map((memo) => (memo.id === id ? { ...memo, ...patch } : memo)));
  }

  function openReply(target) {
    setReplyTarget(target);
    setEditingReply(null);
    setReplyText("");
    setReplyTags("");
    setReplyMedia([]);
  }

  function openEditReply(reply, parentMemoId) {
    setReplyTarget({ memoId: parentMemoId, replyId: reply.id, mode: "edit" });
    setEditingReply(reply);
    setReplyText(reply.text || "");
    setReplyTags((reply.tags || []).map((t) => `#${t}`).join(" "));
    setReplyMedia(reply.media || []);
  }

  function closeReplyModal() {
    setReplyTarget(null);
    setEditingReply(null);
    setReplyText("");
    setReplyTags("");
    setReplyMedia([]);
  }

  function submitReply() {
    if (!replyTarget || (!replyText.trim() && replyMedia.length === 0)) return;
    const tags = Array.from(new Set([...extractTags(replyTags), ...extractTags(replyText)]));
    const replyPayload = {
      id: editingReply?.id || uid("reply"),
      text: replyText.trim(),
      tags,
      media: replyMedia,
      createdAt: editingReply?.createdAt || nowText(),
      replies: editingReply?.replies || [],
    };

    setMemos((prev) =>
      prev.map((memo) => {
        if (editingReply && memo.id === replyTarget.memoId) {
          return {
            ...memo,
            replies: updateReplyTree(memo.replies || [], editingReply.id, () => replyPayload),
          };
        }

        if (replyTarget.type === "memo" && memo.id === replyTarget.memoId) {
          return { ...memo, replies: [...(memo.replies || []), replyPayload] };
        }

        if (replyTarget.type === "reply" && memo.id === replyTarget.memoId) {
          return {
            ...memo,
            replies: updateReplyTree(memo.replies || [], replyTarget.replyId, (reply) => ({
              ...reply,
              replies: [...(reply.replies || []), replyPayload],
            })),
          };
        }

        return memo;
      })
    );
    closeReplyModal();
  }

  function deleteReply(memoId, replyId) {
    if (!confirm("このリプライを削除しますか？")) return;
    setMemos((prev) =>
      prev.map((memo) => (memo.id === memoId ? { ...memo, replies: deleteReplyFromTree(memo.replies || [], replyId) } : memo))
    );
  }

  function changeMediaWidth(mediaId, width) {
    setFormMedia((prev) => prev.map((m) => (m.id === mediaId ? { ...m, width } : m)));
    setReplyMedia((prev) => prev.map((m) => (m.id === mediaId ? { ...m, width } : m)));
  }
  function saveCanvasHistory() {
  const canvas = canvasRef.current;
  if (!canvas) return;

  canvasHistoryRef.current.push(canvas.toDataURL("image/png"));

  if (canvasHistoryRef.current.length > 30) {
    canvasHistoryRef.current.shift();
  }
}

function undoCanvas() {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const last = canvasHistoryRef.current.pop();
  if (!last) return;

  const ctx = canvas.getContext("2d");
  const img = new Image();

  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  img.src = last;
}
function getCanvasPoint(e) {
  const canvas = canvasRef.current;
  if (!canvas) return null;

  const rect = canvas.getBoundingClientRect();
  const source = e.touches ? e.touches[0] : e;

  return {
    x: (source.clientX - rect.left) * (canvas.width / rect.width),
    y: (source.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function startDrawing(e) {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const point = getCanvasPoint(e);
  if (!point) return;

  saveCanvasHistory();

  isDrawingRef.current = true;

  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
}

function draw(e) {
  if (!isDrawingRef.current) return;

  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const point = getCanvasPoint(e);
  if (!point) return;

  ctx.strokeStyle = isEraser ? "#ffffff" : drawColor;
ctx.lineWidth = isEraser ? eraserWidth : drawWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.lineTo(point.x, point.y);
  ctx.stroke();
}

function stopDrawing() {
  isDrawingRef.current = false;
}

function clearCanvas() {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function getCanvasMedia() {
  const canvas = canvasRef.current;
  if (!canvas) return null;

  const dataUrl = canvas.toDataURL("image/png");

  return {
    id: uid("media"),
    kind: "image",
    mime: "image/png",
    url: dataUrl,
    size: "large",
    width: 100,
  };
}

function renderTextWithInlineMedia(memo, editing = false) {
  const parts = String(memo.text || "").split(/(\[media:[^\]]+\])/g);

  return parts.map((part, index) => {
    const match = part.match(/^\[media:([^\]]+)\]$/);

    if (!match) {
      return part ? (
        <span key={index} className="whitespace-pre-wrap">
          {part}
        </span>
      ) : null;
    }

    const media = (memo.media || []).find((m) => m.id === match[1]);
    if (!media) return null;


    return (
      <MediaPreview
        key={media.id}
        media={media}
        editing={editing}
        onWidthChange={changeMediaWidth}
      />
    );
  });
}

if (!isMounted) return null;
    
  return (
   <main className="min-h-screen bg-[#f4f2ef] flex text-[#1f2933] pb-24 lg:pb-0">
      <Sidebar
  search={search}
  setSearch={setSearch}
    typeFilter={typeFilter}
  setTypeFilter={setTypeFilter}
  allTags={allTags}
  navItems={NAV_ITEMS}
  typeStyle={TYPE_STYLE}
  Icon={Icon}
  openCreate={openCreate}
  getMemoCount={getMemoCount}
  selectedDate={selectedDate}
/>

      <section className="flex-1 p-4 lg:p-10">
        

        <div className="rounded-[32px] overflow-hidden shadow-lg mb-4 relative">
          <img
  src={selectedMode.image}
  className="w-full h-[180px] lg:h-[260px] object-cover brightness-[0.92]"
  alt="header"
/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
          <button
  onClick={() => setShowModeModal(true)}
  className="absolute bottom-4 left-4 bg-black/45 backdrop-blur-xl text-white px-3 py-1.5 text-sm lg:px-5 lg:py-2 lg:text-base rounded-full font-bold hover:bg-black/60 transition"
>
  {selectedMode.name}
</button>
          <button
            onClick={() => setShowCalendar(true)}
            className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-xl px-3 py-1.5 text-sm lg:px-5 lg:py-2 lg:text-base rounded-full shadow-md font-bold flex items-center gap-2 hover:bg-white transition"
          >
            <Icon name="calendarAlt" className="w-4 h-4 text-gray-900" />
            <span>{selectedDate.replaceAll("-", "/")}</span>
          </button>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[28px] p-4 flex gap-4 mb-8 shadow-sm">
          {Object.keys(TYPE_STYLE).map((type) => {
            const iconName = type === "つぶやき" ? "comment" : type === "ノート" ? "penAlt" : "paintBrush";
            return (
              <button
                key={type}
                onClick={() => openCreate(type)}
                className={`flex-1 rounded-2xl py-3 lg:py-5 font-bold transition text-white bg-gradient-to-r ${TYPE_STYLE[type].button} shadow-md hover:shadow-lg flex items-center justify-center gap-2 lg:gap-3`}
              >
                <Icon name={iconName} className="w-5 h-5 lg:w-6 lg:h-6" />
                <span className="hidden lg:inline">＋{type}</span>
              </button>
            );
          })}
        </div>

{typeFilter === "ゴミ箱" && (
  <div className="mb-6 rounded-[24px] border border-red-100 bg-red-50/80 p-5 shadow-sm">
    <div className="flex items-center justify-between gap-4">
      <div>
        <h3 className="text-lg font-bold text-red-700">ゴミ箱</h3>
        <p className="mt-1 text-sm text-red-500">
          削除済みのメモを表示しています。
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!confirm("ゴミ箱内のメモをすべて完全に削除しますか？この操作は元に戻せません。")) return;

          setMemos((prev) => prev.filter((memo) => memo.deleted !== true));
        }}
        className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700"
      >
        ゴミ箱を空にする
      </button>
    </div>
  </div>
)}

        <div className="space-y-6">
          {visibleMemos.length === 0 ? (
            <div className="bg-white/80 rounded-[28px] p-10 text-center text-gray-500 shadow-sm">この日のメモはまだありません。</div>
          ) : (
            visibleMemos.map((memo) => (
              <MemoCard
                key={memo.id}
                memo={memo}
                typeFilter={typeFilter}
                onRestore={restoreMemo}
                onPermanentDelete={permanentDeleteMemo}
                typeStyle={TYPE_STYLE}
                Icon={Icon}
                onEdit={openEdit}
                onDelete={deleteMemo}
                onUpdate={updateMemo}
                onReply={(target) => openReply(target)}
                onEditReply={openEditReply}
                onDeleteReply={deleteReply}
                renderText={renderTextWithInlineMedia}
                
              />
            ))
          )}
        </div>
      </section>

     <CalendarModal
  show={showCalendar}
  close={() => setShowCalendar(false)}
  calendarInfo={calendarInfo}
  selectedDate={selectedDate}
  getMemoCount={getMemoCount}
  setSelectedDate={setSelectedDate}
  moveMonth={moveMonth}
  Icon={Icon}
/>

{showModeModal && (
  <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-6">
    <div className="w-full max-w-md bg-white rounded-[28px] shadow-2xl p-6">
      <div className="flex items-start justify-between gap-3 mb-5">
  <h3 className="text-2xl font-bold">タスク切替</h3>

  <button
  type="button"
  onClick={() => setShowModeModal(false)}
  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-3xl leading-none text-gray-500 hover:bg-gray-200 hover:text-gray-800 active:scale-95"
  aria-label="タスク切替を閉じる"
>
  ✖
</button>
</div>

      <div className="space-y-3 mb-5">
        {homeModes.map((mode) => (
          <div
            key={mode.id}
            onClick={() => {
  if (editingModeId) return;
  setSelectedModeId(mode.id);
  setShowModeModal(false);
}}
            className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 font-bold transition ${
              selectedModeId === mode.id
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            {editingModeId === mode.id ? (
  <div className="flex flex-col gap-2 w-full">
   <input
  value={editingModeName}
  autoFocus
  onClick={(e) => e.stopPropagation()}
  onChange={(e) => setEditingModeName(e.target.value)}
  placeholder="タスク名"
  className="flex-1 rounded-xl bg-white px-3 py-2 text-black outline-none ring-2 ring-white/70"
/>
<div className="flex gap-2">
  <input
    value={newModeName}
    onChange={(e) => setNewModeName(e.target.value)}
    placeholder="例：読書メモ"
    className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 outline-none"
  />

  

  
</div>

{newModeImage && (
  <img
    src={newModeImage}
    alt="新規タスク画像プレビュー"
    className="mt-3 h-24 w-full rounded-2xl object-cover border border-gray-200"
  />
)}


<div onClick={(e) => e.stopPropagation()}>
  <label className="block cursor-pointer rounded-xl bg-white/20 px-3 py-2 text-sm font-bold text-center">
    ローカル画像を選択
    <input
      type="file"
      accept="image/*"
      hidden
      onChange={handleModeImageFile}
    />
  </label>
</div>

{modeImageInput && (
  <img
    src={modeImageInput}
    alt="タスク画像プレビュー"
    className="h-20 w-full rounded-xl object-cover border border-white/30"
  />
)}

<button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    saveModeName();
  }}
  className="text-sm px-3 py-2 rounded-xl bg-white/20"
>
  保存
</button>
  </div>
) : (
  <>
    <span>{mode.name}</span>

    <div className="flex items-center gap-2">
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      moveMode(mode.id, "up");
    }}
    className="text-xs opacity-70 hover:opacity-100"
  >
    ↑
  </button>

  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      moveMode(mode.id, "down");
    }}
    className="text-xs opacity-70 hover:opacity-100"
  >
    ↓
  </button>

  <button
    onClick={(e) => {
      e.stopPropagation();
      startEditMode(mode);
    }}
    className="text-sm opacity-80 hover:opacity-100"
  >
    編集
  </button>

  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      handleDeleteMode(mode.id);
    }}
    className="text-sm text-red-500 opacity-80 hover:opacity-100"
  >
    削除
  </button>
</div>
  </>
)}
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-5">
        <p className="text-sm font-bold text-gray-500 mb-2">新規タスク追加</p>
        <div className="flex gap-2">
  <input
    value={newModeName}
    onChange={(e) => setNewModeName(e.target.value)}
    placeholder="例：読書メモ"
    className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 outline-none"
  />

  <label className="cursor-pointer rounded-2xl bg-gray-100 px-4 py-3 font-bold text-gray-700 hover:bg-gray-200">
    画像
    <input
      type="file"
      accept="image/*"
      hidden
      onChange={handleNewModeImageFile}
    />
  </label>

  <button
    onClick={handleAddMode}
    className="rounded-2xl bg-gray-900 text-white px-5 py-3 font-bold"
  >
    追加
  </button>
</div>
{newModeImage && (
  <img
    src={newModeImage}
    alt="新規タスク画像プレビュー"
    className="mt-3 h-20 w-full rounded-2xl object-cover border border-gray-200"
  />
)}
      </div>
    </div>
  </div>
)}

      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-[92vw] max-w-3xl max-h-[86vh] overflow-y-auto bg-white/95 rounded-[28px] shadow-2xl p-5 lg:p-8">
            <div className="flex items-start justify-between mb-6 gap-3">
  <h3 className="text-[28px] leading-tight font-bold lg:text-3xl">
  {editingMemo ? "編集" : "新規作成"}：
  <span className="inline-block whitespace-nowrap">
    {modalType}
  </span>
</h3>

{modalType === "ノート" ? (
  <div className="flex shrink-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
    <button
      onClick={closeModal}
      className="px-4 py-2 rounded-full bg-gray-100 text-sm font-bold hover:bg-gray-200 transition"
    >
      キャンセル
    </button>

    <button
      onClick={submitMemo}
      className={`px-4 py-2 rounded-full text-white text-sm font-bold bg-gradient-to-r ${TYPE_STYLE[modalType].button} shadow-md hover:shadow-lg transition`}
    >
      {editingMemo ? "更新する" : "投稿する"}
    </button>
  </div>
) : (
              
                <button onClick={closeModal} className="text-2xl text-gray-400 hover:text-gray-700">×</button>
              )}
            </div>

            {modalType !== "つぶやき" && (
  <input
    value={formTitle}
    autoFocus
    onChange={(e) => setFormTitle(e.target.value)}
    placeholder={`${modalType}のタイトル`}
    className="mb-5 w-full rounded-2xl border border-gray-200 px-5 py-4 text-black outline-none"
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
                <div className="flex justify-between text-sm text-gray-400 mb-4"><span>本文のみ140字制限</span><span>{formText.length}/140</span></div>
                <MediaToolbar type={modalType} mediaSize={mediaSize} setMediaSize={setMediaSize} onSelect={handleMediaSelect} />
                <FixedMediaShelf media={formMedia} setMedia={setFormMedia} editing onWidthChange={changeMediaWidth} />
              </>
            ) : modalType === "ノート" ? (
              <div className="relative">
                <div className="mb-3 flex flex-wrap items-center gap-2 overflow-x-auto pb-2 text-sm lg:overflow-visible">
                  <MediaToolbar type={modalType} mediaSize={mediaSize} setMediaSize={setMediaSize} onSelect={handleMediaSelect} compact />
                </div>
                <textarea
                  ref={noteTextRef}
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="＋から画像・動画・ファイルを本文途中に挿入できます。"
                  className="w-full min-h-[260px] rounded-2xl border border-gray-200 px-5 py-4 outline-none resize-y leading-relaxed"
                />
                <div className="mt-4 rounded-2xl bg-gray-50 p-4 border border-gray-100">
                  <p className="text-sm text-gray-400 mb-3">プレビュー・サイズ調整</p>
                  <div className="text-gray-700 leading-relaxed">{renderTextWithInlineMedia({ text: formText, media: formMedia }, true)}</div>
                </div>
              </div>
            ) : (
              <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-inner">
  <div className="mb-4 flex items-center justify-between">
    <p className="text-sm font-bold text-gray-500">
      ホワイトボード
    </p>
    <span className="text-xs text-gray-400">
      自由メモ・構想整理用
    </span>
  </div>

  
<div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
  <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-2">
    <label className="hidden">
  色
</label>

    <input
      type="color"
      value={drawColor}
      onChange={(e) => setDrawColor(e.target.value)}
      className="h-11 w-11 shrink-0 cursor-pointer rounded-xl"
    />

    <label className="hidden">
  太さ
</label>

    <select
      value={drawWidth}
      onChange={(e) => setDrawWidth(Number(e.target.value))}
      className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
    >
      <option value={2}>細い</option>
      <option value={4}>普通</option>
      <option value={8}>太い</option>
      <option value={14}>極太</option>
    </select>
<button
  type="button"
  onClick={undoCanvas}
  className="rounded-xl bg-gray-100 px-3 py-3 text-sm font-bold text-gray-600 hover:bg-gray-200"
>
  ↩
</button>

<button
  type="button"
  onClick={() => setIsEraser((prev) => !prev)}
  className={`rounded-xl px-3 py-3 text-sm font-bold ${
    isEraser
      ? "bg-red-100 text-red-600"
      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
  }`}
>
  🧽
</button>
{isEraser && (
  <>
    

    <select
      value={eraserWidth}
      onChange={(e) => setEraserWidth(Number(e.target.value))}
      className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
    >
      <option value={12}>細い</option>
      <option value={24}>普通</option>
      <option value={40}>太い</option>
      <option value={64}>極太</option>
    </select>
  </>
)}
    <button
  type="button"
  onClick={clearCanvas}
  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl font-bold text-gray-600 hover:bg-gray-200"
  aria-label="ホワイトボードをクリア"
  title="クリア"
>
  🗑
</button>
  </div>

  <canvas
  ref={canvasRef}
  width={900}
  height={520}
  onMouseDown={startDrawing}
  onMouseMove={draw}
  onMouseUp={stopDrawing}
  onMouseLeave={stopDrawing}
  onTouchStart={(e) => {
    e.preventDefault();
    startDrawing(e);
  }}
  onTouchMove={(e) => {
    e.preventDefault();
    draw(e);
  }}
  onTouchEnd={(e) => {
    e.preventDefault();
    stopDrawing();
  }}
  className="
w-full
h-[420px]
sm:h-[520px]
touch-none
rounded-2xl
border
border-gray-300
bg-white
shadow-inner
select-none
"
/>
</div>
  <div className="mt-4">
  <MediaToolbar
    type={modalType}
    mediaSize={mediaSize}
    setMediaSize={setMediaSize}
    onSelect={handleMediaSelect}
  />
</div>
</div>
            )}

            <TagInput value={formTags} setValue={setFormTags} allTags={allTags} />

            {modalType !== "ノート" && (
              <div className="flex justify-end gap-3 mt-8">
                <button onClick={closeModal} className="px-6 py-3 rounded-full bg-gray-100 font-bold">キャンセル</button>
                <button onClick={submitMemo} className={`px-7 py-3 rounded-full text-white font-bold bg-gradient-to-r ${TYPE_STYLE[modalType].button}`}>
                  {editingMemo ? "更新する" : "投稿する"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {replyTarget && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[28px] p-6 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">{editingReply ? "リプライを編集" : "リプライを書く"}</h3>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full min-h-[130px] rounded-2xl border border-gray-200 p-4 outline-none"
              placeholder="このメモに続けて書く"
            />
            <MediaToolbar type="つぶやき" mediaSize={mediaSize} setMediaSize={setMediaSize} onSelect={(e) => handleMediaSelect(e, "つぶやき", "reply")} />
            <FixedMediaShelf media={replyMedia} setMedia={setReplyMedia} editing onWidthChange={changeMediaWidth} />
            <TagInput value={replyTags} setValue={setReplyTags} allTags={allTags} />
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={closeReplyModal} className="px-5 py-3 rounded-full bg-gray-100 font-bold">キャンセル</button>
              <button onClick={submitReply} className="px-6 py-3 rounded-full bg-blue-500 text-white font-bold">{editingReply ? "更新" : "返信"}</button>
            </div>
          </div>
        </div>
      )}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/70 bg-white/85 backdrop-blur-xl px-2 py-2 shadow-[0_-8px_30px_rgba(0,0,0,.08)] lg:hidden">
  <div className="grid grid-cols-6 gap-1">
    {NAV_ITEMS.map((item) => (
      <button
        key={item.key}
        type="button"
        onClick={() => {
          if (
            [
              "ホーム",
              "つぶやき",
              "ノート",
              "ホワイトボード",
              "ブックマーク",
              "ゴミ箱",
            ].includes(item.key)
          ) {
            setTypeFilter(item.key);
          }
        }}
        className={`flex items-center justify-center rounded-2xl px-1 py-3 min-h-[48px] font-bold transition ${
          typeFilter === item.key
            ? item.key === "ゴミ箱"
              ? "bg-red-50 text-red-600"
              : item.key === "ブックマーク"
              ? "bg-yellow-50 text-yellow-700"
              : item.key === "ホーム"
              ? "bg-pink-50 text-pink-600"
              : "bg-gray-100 text-gray-800"
            : "text-gray-500"
        }`}
      >
        <Icon
          name={item.icon}
          className="mb-1 h-5 w-5"
        />
        
      </button>
    ))}
  </div>
</nav>
    </main>
   );
}

function plainMemoText(text) {
  return String(text || "").replace(/\[media:[^\]]+\]/g, "").replace(/\n{3,}/g, "\n\n").trim();
}




function TagInput({ value, setValue, allTags }) {
  return (
    <div className="mt-5 relative">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="#タグ を入力。例：#アイデア #仕事"
        className="w-full rounded-2xl border border-gray-200 px-5 py-4 outline-none"
      />
      {value.includes("#") && allTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {allTags.slice(0, 12).map(({ tag }) => (
            <button key={tag} onClick={() => setValue((prev) => `${prev} #${tag}`)} className="rounded-full bg-gray-100 px-3 py-1 text-xs">
              #{tag}
            </button>
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
        <span key={tag} className="rounded-full bg-gradient-to-r from-white to-gray-100 border border-white/80 shadow-sm px-3 py-1 text-xs text-gray-600">
          #{tag}
        </span>
      ))}
    </div>
  );
}

function MediaToolbar({ type, mediaSize, setMediaSize, onSelect, compact = false }) {
  return (
    <div className={`flex items-center gap-2 sm:gap-3 flex-wrap ${compact ? "" : "mb-4 mt-4"}`}>
      {type === "ノート" && <span className="w-10 h-10 rounded-full border-2 border-gray-700 flex items-center justify-center text-xl font-bold">＋</span>}
      <select value={mediaSize} onChange={(e) => setMediaSize(e.target.value)} className="rounded-full bg-gray-100 px-3 py-2 text-sm outline-none">
        <option value="small">小</option>
        <option value="medium">中</option>
        <option value="large">大</option>
      </select>
      <label className="cursor-pointer rounded-full bg-gray-100 px-3 py-2 text-sm font-bold hover:bg-gray-200">🖼 画像<input type="file" accept="image/*" hidden onChange={(e) => onSelect(e, type)} /></label>
      <label className="cursor-pointer rounded-full bg-gray-100 px-3 py-2 text-sm font-bold hover:bg-gray-200">🎞 動画<input type="file" accept="video/*" hidden onChange={(e) => onSelect(e, type)} /></label>
      <label className="cursor-pointer rounded-full bg-gray-100 px-3 py-2 text-sm font-bold hover:bg-gray-200">📎 ファイル<input type="file" hidden onChange={(e) => onSelect(e, type)} /></label>
    </div>
  );
}


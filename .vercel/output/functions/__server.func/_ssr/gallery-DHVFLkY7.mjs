import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as useNssStore, D as formatLongDate, E as folderName, F as putMedia, R as todayIso, V as videoPoster, b as compressImageFile, d as assertVideoSize } from "./utils-BIiJ-s-U.mjs";
import { n as CardContent, t as Card } from "./card-2ADCK2Ma.mjs";
import { t as Input } from "./input-CRT4sBU_.mjs";
import { O as ImagePlus, i as Trash2, j as FolderOpen, n as Upload } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { g as Button } from "./router-Cdyjb-lJ.mjs";
import { t as Label } from "./label-Bl0lQyM7.mjs";
import { t as MediaThumb } from "./media-thumb-CiIriRxi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/gallery-DHVFLkY7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PoGallery() {
	const events = useNssStore((s) => s.events);
	const gallery = useNssStore((s) => s.gallery) ?? [];
	const addGalleryItems = useNssStore((s) => s.addGalleryItems);
	const removeGalleryItem = useNssStore((s) => s.removeGalleryItem);
	const sortedEvents = (0, import_react.useMemo)(() => [...events].sort((a, b) => b.date.localeCompare(a.date)), [events]);
	const [eventId, setEventId] = (0, import_react.useState)("");
	const [caption, setCaption] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [folderFilter, setFolderFilter] = (0, import_react.useState)("all");
	const [dropOver, setDropOver] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (eventId) return;
		if (sortedEvents[0]) setEventId(sortedEvents[0].id);
		else setEventId("__general__");
	}, [sortedEvents, eventId]);
	const selectedEvent = eventId === "__general__" ? void 0 : sortedEvents.find((e) => e.id === eventId);
	const eventName = selectedEvent?.name ?? "General";
	const folders = (0, import_react.useMemo)(() => {
		return [...new Set(gallery.map((g) => g.folder || g.eventName || "General"))].sort();
	}, [gallery]);
	const shown = gallery.filter((g) => folderFilter === "all" || (g.folder || g.eventName || "General") === folderFilter);
	async function onFiles(list) {
		if (!list?.length) return;
		setBusy(true);
		const added = [];
		try {
			for (const file of Array.from(list)) {
				const id = `gal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
				const isVideo = file.type.startsWith("video/");
				const isImage = file.type.startsWith("image/");
				if (!isVideo && !isImage) {
					toast.error(`${file.name} is not a photo or video.`);
					continue;
				}
				if (isVideo) {
					assertVideoSize(file);
					const mediaKey = `video-${id}`;
					await putMedia(mediaKey, file);
					let posterKey;
					const poster = await videoPoster(file);
					if (poster) {
						posterKey = `poster-${id}`;
						await putMedia(posterKey, poster);
					}
					added.push({
						id,
						src: "",
						caption: caption.trim() || file.name.replace(/\.[^.]+$/, ""),
						date: selectedEvent?.date || todayIso(),
						eventId: selectedEvent?.id,
						eventName,
						kind: "video",
						folder: folderName(eventName),
						mediaKey,
						posterKey
					});
				} else {
					const { blob } = await compressImageFile(file);
					const mediaKey = `photo-${id}`;
					await putMedia(mediaKey, blob);
					added.push({
						id,
						src: "",
						caption: caption.trim() || `${eventName} · ${file.name.replace(/\.[^.]+$/, "")}`,
						date: selectedEvent?.date || todayIso(),
						eventId: selectedEvent?.id,
						eventName,
						kind: "photo",
						folder: folderName(eventName),
						mediaKey
					});
				}
			}
			if (added.length) {
				addGalleryItems(added);
				toast.success(`${added.length} file(s) saved in HD to “${eventName}”. They appear on Home.`);
				setCaption("");
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Upload failed");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl font-semibold",
				children: "Gallery"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Pick an event — the folder name fills automatically. Multi-select or drag-and-drop photos and videos. Any size is compressed to HD JPEG (1920px) before saving. Videos keep their quality and a poster is generated. Saved files appear on the Home page."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "grid gap-3 pt-5 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Event (folder fills automatically)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "h-10 w-full rounded-md border border-border bg-card px-3 text-sm",
							value: eventId,
							onChange: (e) => setEventId(e.target.value),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "__general__",
								children: "General (no event)"
							}), sortedEvents.map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: event.id,
								children: [
									event.name,
									" — ",
									formatLongDate(event.date)
								]
							}, event.id))]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Caption (optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: caption,
							onChange: (e) => setCaption(e.target.value),
							placeholder: eventName
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `sm:col-span-2 rounded-lg border-2 border-dashed p-4 ${dropOver ? "border-forest bg-forest/5" : "border-border"}`,
						onDragOver: (e) => {
							e.preventDefault();
							setDropOver(true);
						},
						onDragLeave: () => setDropOver(false),
						onDrop: (e) => {
							e.preventDefault();
							setDropOver(false);
							onFiles(e.dataTransfer.files);
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
								className: "mb-2 flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), "Multi-select photos / videos — or drop files here"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "file",
								accept: "image/*,video/*",
								multiple: true,
								disabled: busy,
								className: "block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground",
								onChange: (e) => {
									onFiles(e.target.files);
									e.target.value = "";
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-muted-foreground",
								children: busy ? "Compressing and saving…" : `Saving into folder: ${eventName}`
							})
						]
					})
				]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: folderFilter === "all" ? "default" : "outline",
					onClick: () => setFolderFilter("all"),
					children: [
						"All (",
						gallery.length,
						")"
					]
				}), folders.map((folder) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: folderFilter === folder ? "default" : "outline",
					onClick: () => setFolderFilter(folder),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, {}), folder]
				}, folder))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
				children: [shown.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
					className: "overflow-hidden rounded-xl border border-border bg-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MediaThumb, {
						item,
						className: "aspect-4/3 w-full object-cover",
						controls: item.kind === "video"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
						className: "flex items-start justify-between gap-2 px-3 py-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium",
							children: item.caption
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "block text-xs text-muted-foreground",
							children: [
								item.folder || item.eventName,
								" · ",
								formatLongDate(item.date),
								" · ",
								item.kind === "video" ? "Video" : "HD photo"
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "ghost",
							onClick: () => {
								if (confirm("Remove this file from the gallery?")) removeGalleryItem(item.id);
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {})
						})]
					})]
				}, item.id)), shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "mr-1 inline size-4" }), "No files in this folder yet."]
				}) : null]
			})
		]
	});
}
//#endregion
export { PoGallery as component };

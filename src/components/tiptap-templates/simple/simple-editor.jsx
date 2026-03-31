"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table"
import { ToggleListNode, ToggleSummaryNode } from "@/components/tiptap-node/toggle-node/toggle-node-extension"
import { CodeBlockWithHighlight } from "@/components/tiptap-node/code-block-node/code-block-lowlight-extension"
import { MathBlock } from "@/components/tiptap-node/math-node/math-node-extension"
import { MathBlockView } from "@/components/tiptap-node/math-node/MathBlockView"
import { Columns, Column } from "@/components/tiptap-node/columns-node/columns-node-extension"
import { CalloutNode } from "@/components/tiptap-node/callout-node/callout-node-extension"
import { MetadataCard } from "@/components/tiptap-node/metadata-node/metadata-node-extension"
import { MetadataCardView } from "@/components/tiptap-node/metadata-node/MetadataCardView"
import { ApiEndpoint } from "@/components/tiptap-node/api-endpoint-node/api-endpoint-extension"
import { ApiEndpointView } from "@/components/tiptap-node/api-endpoint-node/ApiEndpointView"
import { ChartBlock } from "@/components/tiptap-node/chart-node/chart-node-extension"
import { ChartBlockView } from "@/components/tiptap-node/chart-node/ChartBlockView"
import { KanbanBlock } from "@/components/tiptap-node/kanban-node/kanban-extension"
import { KanbanView } from "@/components/tiptap-node/kanban-node/KanbanView"
// Excalidraw disabled — compatibility issues with Electron + Vite
// TODO: fix asset loading or replace with lighter alternative
// import { WhiteboardBlock } from "@/components/tiptap-node/whiteboard-node/whiteboard-extension"
// import { WhiteboardView } from "@/components/tiptap-node/whiteboard-node/WhiteboardView"
import { EmojiShortcode } from "@/components/tiptap-node/emoji-shortcode-extension"
import { TableOfContents } from "@/components/tiptap-node/toc-node/toc-node-extension"
import { TocView } from "@/components/tiptap-node/toc-node/TocView"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { CodeBlockLanguageSelect } from "@/components/tiptap-node/code-block-node/CodeBlockLanguageSelect"
import "@/components/tiptap-node/toggle-node/toggle-node.scss"
import "@/components/tiptap-node/table-node/table-node.scss"
import "@/components/tiptap-node/columns-node/columns-node.scss"
import "@/components/tiptap-node/callout-node/callout-node.scss"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"

// --- Slash Commands ---
import { buildSlashCommandExtension } from "@/components/tiptap-ui/slash-command-menu/extension"
import { SlashCommandMenu } from "@/components/tiptap-ui/slash-command-menu/slash-command-menu"

// --- Bubble Menu ---
import { BubbleToolbar, useBubbleMenuState } from "@/components/tiptap-ui/bubble-menu/bubble-menu"

// --- Drag Handle ---
import { buildDragHandleExtension } from "@/components/tiptap-ui/drag-handle/drag-handle"
import "@/components/tiptap-ui/drag-handle/drag-handle.scss"

// --- Insert Menu ---
import { InsertDropdownMenu } from "@/components/tiptap-ui/insert-dropdown-menu/insert-dropdown-menu"

// --- Table Toolbar ---
import { TableToolbar } from "@/components/tiptap-ui/table-toolbar/table-toolbar"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

import content from "@/components/tiptap-templates/simple/data/content.json"

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile
}) => {
  return (
    <>
      <Spacer />
      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
        <ListDropdownMenu modal={false} types={["bulletList", "orderedList", "taskList"]} />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <ImageUploadButton text="Add" />
        <InsertDropdownMenu modal={false} />
      </ToolbarGroup>
      <Spacer />
      {isMobile && <ToolbarSeparator />}
      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  );
}

const MobileToolbarContent = ({
  type,
  onBack
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export function SimpleEditor({ initialContent, onContentChange }) {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState("main")
  const toolbarRef = useRef(null)
  const isExternalLoad = useRef(false)

  // ── Slash commands state ──
  const [slashMenu, setSlashMenu] = useState(null) // null = closed
  const slashMenuRef = useRef(null)

  const handleSlashOpen = useCallback((props) => setSlashMenu(props), [])
  const handleSlashUpdate = useCallback((props) => setSlashMenu(props), [])
  const handleSlashClose = useCallback(() => setSlashMenu(null), [])

  const slashExtension = useRef(
    buildSlashCommandExtension({
      onOpen: handleSlashOpen,
      onUpdate: handleSlashUpdate,
      onClose: handleSlashClose,
    })
  ).current

  const dragHandleExtension = useRef(buildDragHandleExtension()).current

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        codeBlock: false, // reemplazado por CodeBlockWithHighlight
        link: {
          openOnClick: false,
          enableClickSelection: true,
          autolink: true,
          linkOnPaste: true,
        },
      }),
      CodeBlockWithHighlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockLanguageSelect, {
            // ProseMirror no debe procesar eventos que vienen del preview de mermaid
            stopEvent: ({ event }) =>
              !!event.target?.closest?.(
                ".mermaid-preview, .mermaid-diagram-area, .mermaid-fullscreen-overlay, " +
                ".code-block-split, .code-block-monaco-wrapper, .monaco-editor"
              ),
          });
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      ToggleListNode,
      ToggleSummaryNode,
      MathBlock.extend({
        addNodeView() {
          return ReactNodeViewRenderer(MathBlockView);
        },
      }),
      Columns,
      Column,
      CalloutNode,
      MetadataCard.extend({
        addNodeView() {
          return ReactNodeViewRenderer(MetadataCardView, {
            stopEvent: () => true,
          });
        },
      }),
      ApiEndpoint.extend({
        addNodeView() {
          return ReactNodeViewRenderer(ApiEndpointView, {
            stopEvent: () => true,
          });
        },
      }),
      ChartBlock.extend({
        addNodeView() {
          return ReactNodeViewRenderer(ChartBlockView, {
            stopEvent: () => true,
          });
        },
      }),
      KanbanBlock.extend({
        addNodeView() {
          return ReactNodeViewRenderer(KanbanView, { stopEvent: () => true });
        },
      }),
      EmojiShortcode,
      TableOfContents.extend({
        addNodeView() {
          return ReactNodeViewRenderer(TocView);
        },
      }),
      slashExtension,
      dragHandleExtension,
    ],
    content: initialContent || content,
    onUpdate: ({ editor: ed }) => {
      if (isExternalLoad.current) return
      // Send both HTML (for legacy .md) and JSON (for page-json)
      onContentChange?.(ed.getHTML(), ed.getJSON())
    },
  })

  // Load new document content when initialContent prop changes
  useEffect(() => {
    if (!editor || !initialContent) return
    isExternalLoad.current = true
    editor.commands.setContent(initialContent, false)
    isExternalLoad.current = false
  }, [editor, initialContent])

  const bubbleRect = useBubbleMenuState(editor)

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  // Click en el chevron del toggle (pseudo-element ::before, izquierda del summary)
  const handleToggleClick = useCallback((e) => {
    if (!editor) return
    const summary = e.target.closest('[data-type="toggle-summary"]')
    if (!summary) return
    const rect = summary.getBoundingClientRect()
    // El chevron ocupa los primeros 22px desde el borde izquierdo
    if (e.clientX - rect.left <= 22) {
      e.preventDefault()
      editor.commands.toggleOpen()
    }
  }, [editor])

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}>
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile} />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")} />
          )}
        </Toolbar>

        <EditorContent editor={editor} role="presentation" className="simple-editor-content" onClick={handleToggleClick} />

        {slashMenu && (
          <SlashCommandMenu
            ref={slashMenuRef}
            suggestionProps={slashMenu}
            onClose={handleSlashClose}
          />
        )}

        <BubbleToolbar
          editor={editor}
          rect={bubbleRect}
          onLinkClick={() => {
            // Abre el link popover de la toolbar — si está visible
            document.querySelector("[data-tiptap-link-trigger]")?.click()
          }}
        />

        <TableToolbar editor={editor} />
      </EditorContext.Provider>
    </div>
  );
}

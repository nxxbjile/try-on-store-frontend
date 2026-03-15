"use client"

import dynamic from "next/dynamic"
import { useEffect } from "react"
import { useRef } from "react"
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  Link,
  List,
  ListProperties,
  Heading,
  BlockQuote,
  Alignment,
  Indent,
} from "ckeditor5"

const CKEditor = dynamic(
  async () => {
    const mod = await import("@ckeditor/ckeditor5-react")
    return mod.CKEditor
  },
  {
    ssr: false,
    loading: () => <div className="rounded-md border border-border/70 p-3 text-sm text-muted-foreground">Loading editor...</div>,
  },
)

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<any>(null)

  useEffect(() => {
    const instance = editorRef.current
    if (!instance) return

    const current = instance.getData()
    const next = value || ""
    if (current !== next) {
      instance.setData(next || "")
    }
  }, [value])

  const handleChange = (_event: unknown, instance: any) => {
    if (!instance) return
    onChange(instance.getData())
  }

  return (
    <div className="rich-text-editor-shell">
      <CKEditor
        editor={ClassicEditor}
        config={{
          licenseKey: "GPL",
          plugins: [
            Essentials,
            Paragraph,
            Bold,
            Italic,
            Underline,
            Link,
            List,
            ListProperties,
            Heading,
            BlockQuote,
            Alignment,
            Indent,
          ],
          toolbar: [
            "heading",
            "|",
            "bold",
            "italic",
            "underline",
            "|",
            "alignment",
            "link",
            "bulletedList",
            "numberedList",
            "outdent",
            "indent",
            "blockQuote",
            "|",
            "undo",
            "redo",
          ],
          list: {
            properties: {
              styles: true,
              startIndex: true,
              reversed: true,
            },
          },
          placeholder: placeholder || "Write product details...",
        }}
        data={value || ""}
        onReady={(instance: any) => {
          editorRef.current = instance
        }}
        onChange={handleChange}
      />

      <div className="rich-text-preview mt-3 rounded-md border border-border/70 bg-[hsl(var(--surface-1))] p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Live Preview</p>
        {value?.trim() ? (
          <div className="rich-text-content ck-content" dangerouslySetInnerHTML={{ __html: value }} />
        ) : (
          <p className="text-sm text-muted-foreground">Start typing to preview formatted content...</p>
        )}
      </div>
    </div>
  )
}

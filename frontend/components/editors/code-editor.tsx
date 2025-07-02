"use client"

import { useRef } from "react"
import Editor from "@monaco-editor/react"

interface CodeEditorProps {
  content: string
  onChange: (content: string) => void
}

export function CodeEditor({ content, onChange }: CodeEditorProps) {
  const editorRef = useRef<any>(null)

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
  }

  return (
    <div className="h-full w-full flex items-center justify-center p-0">
      <div className="w-full h-[calc(100vh-12rem)]">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          defaultValue={
            content || "// Start coding here\n\nfunction helloWorld() {\n  console.log('Hello, world!');\n}\n"
          }
          theme="vs-dark"
          onChange={(value) => onChange(value || "")}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            lineNumbers: "on",
            scrollbar: {
              vertical: "visible",
              horizontal: "visible",
            },
            wordWrap: "on",
            wrappingIndent: "indent",
            tabSize: 2,
            insertSpaces: true,
            autoIndent: "full",
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>
    </div>
  )
}
